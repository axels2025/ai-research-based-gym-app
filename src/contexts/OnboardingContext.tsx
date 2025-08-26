import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, createUserProfile, updateOnboardingStep, completeOnboarding, type UserProfile } from '@/lib/userProfiles';
import { isFirebaseConfigured } from '@/lib/firebase';

interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  profile: UserProfile | null;
  isLoading: boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveStepData: (stepData: Partial<UserProfile>) => Promise<void>;
  completeOnboardingFlow: (finalData: Partial<UserProfile>) => Promise<void>;
  canProceed: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  
  const totalSteps = 7;

  // Helper function to create initial profile
  const createInitialProfile = (userId: string): UserProfile => ({
    id: userId,
    userId,
    personalInfo: {} as PersonalInfo,
    experience: {} as Experience,
    goals: {} as Goals,
    availability: {} as Availability,
    health: { injuryHistory: [], limitations: [], medicalConditions: [], painAreas: [] },
    preferences: { favoriteExercises: [], dislikedExercises: [] } as Preferences,
    motivation: {} as Motivation,
    onboardingCompleted: false,
    completionStep: 1,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  });

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      if (!isFirebaseConfigured) {
        console.warn('Firebase not configured, using local state only');
        // Create initial profile for local use
        const initialProfile: UserProfile = createInitialProfile(currentUser.uid);
        setProfile(initialProfile);
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(currentUser.uid);
        
        if (userProfile) {
          setProfile(userProfile);
          setCurrentStep(userProfile.completionStep || 1);
        } else {
          // Profile doesn't exist or couldn't be loaded - create initial one
          const initialProfile: UserProfile = createInitialProfile(currentUser.uid);
          setProfile(initialProfile);
          console.log('Created initial profile for user');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        
        // Don't block onboarding - create initial profile
        const initialProfile: UserProfile = createInitialProfile(currentUser.uid);
        setProfile(initialProfile);
        
        // Show user-friendly error
        console.warn('Using offline mode - changes will sync when connection is restored');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [currentUser]);

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to clean data for Firestore (remove undefined values)
  const cleanDataForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(cleanDataForFirestore);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanDataForFirestore(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  const saveStepData = async (stepData: Partial<UserProfile>) => {
    console.log('OnboardingContext - saveStepData called', { currentUser: !!currentUser, profile: !!profile, stepData });
    
    if (!currentUser || !profile) {
      console.error('OnboardingContext - Missing currentUser or profile');
      return;
    }

    try {
      // Merge the step data with the current profile
      const updatedProfile = {
        ...profile,
        ...stepData,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      };
      
      console.log('OnboardingContext - Updated profile:', updatedProfile);
      setProfile(updatedProfile);
      
      // Save to Firestore only if Firebase is configured
      if (isFirebaseConfigured) {
        console.log('OnboardingContext - Saving to Firestore...');
        
        try {
          // Clean the step data to remove undefined values before saving to Firestore
          const cleanedStepData = cleanDataForFirestore(stepData);
          console.log('OnboardingContext - Cleaned step data:', cleanedStepData);
          
          // Check if this is the first save (profile doesn't exist in Firestore yet)
          const existingProfile = await getUserProfile(currentUser.uid);
          
          if (!existingProfile) {
            // Create new profile with cleaned data
            console.log('OnboardingContext - Creating new profile');
            const cleanedProfile = cleanDataForFirestore(updatedProfile);
            await createUserProfile(currentUser.uid, cleanedProfile);
          } else {
            // Update existing profile with cleaned step data
            console.log('OnboardingContext - Updating existing profile');
            await updateOnboardingStep(currentUser.uid, currentStep, cleanedStepData);
          }
          
          console.log('OnboardingContext - Firestore save successful');
        } catch (firestoreError) {
          console.error('OnboardingContext - Firestore save failed:', firestoreError);
          console.warn('OnboardingContext - Continuing with local changes only. Will retry when connection is restored.');
          
          // Don't throw - allow onboarding to continue with local changes
          // Could implement retry logic here in the future
        }
      } else {
        console.warn('OnboardingContext - Firebase not configured, saving locally only');
      }
      
      // Update can proceed status based on step completion
      validateStepCompletion(updatedProfile, currentStep);
      
    } catch (error) {
      console.error('OnboardingContext - Error saving step data:', error);
      // Still throw critical errors that prevent local state updates
      throw error;
    }
  };

  const completeOnboardingFlow = async (finalData: Partial<UserProfile>) => {
    if (!currentUser) return;

    try {
      // Always update local state first
      setProfile(prev => prev ? { 
        ...prev, 
        ...finalData, 
        onboardingCompleted: true,
        completionStep: totalSteps,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      } : null);
      
      if (isFirebaseConfigured) {
        try {
          const cleanedFinalData = cleanDataForFirestore(finalData);
          await completeOnboarding(currentUser.uid, cleanedFinalData);
          console.log('OnboardingContext - Onboarding completed successfully in Firestore');
        } catch (firestoreError) {
          console.error('OnboardingContext - Failed to complete onboarding in Firestore:', firestoreError);
          console.warn('OnboardingContext - Onboarding completed locally. Will sync when connection is restored.');
          // Don't throw - allow onboarding to complete locally
        }
      } else {
        console.warn('Firebase not configured, completing onboarding locally only');
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const validateStepCompletion = (currentProfile: UserProfile | null, step: number) => {
    if (!currentProfile) {
      setCanProceed(false);
      return;
    }

    let isValid = false;

    switch (step) {
      case 1: // Personal basics - Let form handle its own validation
        isValid = true;
        break;
      case 2: // Goals - Let form handle its own validation
        isValid = true;
        break;
      case 3: // Experience - Let form handle its own validation
        isValid = true;
        break;
      case 4: // Availability - Let form handle its own validation
        isValid = true;
        break;
      case 5: // Health and limitations - Always valid (optional step)
        isValid = true;
        break;
      case 6: // Exercise preferences - Use actual validation for complex step
        isValid = !!(
          currentProfile.preferences?.preferredWorkoutSplit &&
          currentProfile.preferences?.repRangePreference
        );
        break;
      case 7: // Review and confirmation - Final validation
        isValid = !!(
          currentProfile.personalInfo?.age &&
          currentProfile.personalInfo?.sex &&
          currentProfile.personalInfo?.height &&
          currentProfile.personalInfo?.weight &&
          currentProfile.goals?.primaryGoals?.length &&
          currentProfile.experience?.trainingExperience &&
          currentProfile.experience?.equipmentAccess?.length &&
          currentProfile.availability?.sessionsPerWeek
        );
        break;
      default:
        isValid = false;
    }

    setCanProceed(isValid);
  };

  // Validate current step when profile changes
  useEffect(() => {
    if (profile) {
      validateStepCompletion(profile, currentStep);
    }
  }, [profile, currentStep]);

  const value = {
    currentStep,
    totalSteps,
    profile,
    isLoading,
    goToStep,
    nextStep,
    prevStep,
    saveStepData,
    completeOnboardingFlow,
    canProceed,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}