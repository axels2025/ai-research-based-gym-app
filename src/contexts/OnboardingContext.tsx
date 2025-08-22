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

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;

      if (!isFirebaseConfigured) {
        console.warn('Firebase not configured, using local state only');
        // Create initial profile structure for local use
        const initialProfile: Partial<UserProfile> = {
          userId: currentUser.uid,
          onboardingCompleted: false,
          completionStep: 1,
          personalInfo: {} as UserProfile['personalInfo'],
          experience: {} as UserProfile['experience'],
          goals: {} as UserProfile['goals'],
          availability: {} as UserProfile['availability'],
          health: { injuryHistory: [], limitations: [], medicalConditions: [], painAreas: [] },
          preferences: { favoriteExercises: [], dislikedExercises: [] } as UserProfile['preferences'],
          motivation: {} as UserProfile['motivation'],
        };
        setProfile(initialProfile as UserProfile);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userProfile = await getUserProfile(currentUser.uid);
        
        if (userProfile) {
          setProfile(userProfile);
          setCurrentStep(userProfile.completionStep || 1);
        } else {
          // Create initial profile structure
          const initialProfile: Partial<UserProfile> = {
            userId: currentUser.uid,
            onboardingCompleted: false,
            completionStep: 1,
            personalInfo: {} as UserProfile['personalInfo'],
            experience: {} as UserProfile['experience'],
            goals: {} as UserProfile['goals'],
            availability: {} as UserProfile['availability'],
            health: { injuryHistory: [], limitations: [], medicalConditions: [], painAreas: [] },
            preferences: { favoriteExercises: [], dislikedExercises: [] } as UserProfile['preferences'],
            motivation: {} as UserProfile['motivation'],
          };
          setProfile(initialProfile as UserProfile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
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
      };
      
      console.log('OnboardingContext - Updated profile:', updatedProfile);
      setProfile(updatedProfile);
      
      // Save to Firestore only if Firebase is configured
      if (isFirebaseConfigured) {
        console.log('OnboardingContext - Saving to Firestore...');
        
        // Check if this is the first save (profile doesn't exist in Firestore yet)
        const existingProfile = await getUserProfile(currentUser.uid);
        
        if (!existingProfile) {
          // Create new profile
          console.log('OnboardingContext - Creating new profile');
          await createUserProfile(currentUser.uid, updatedProfile);
        } else {
          // Update existing profile
          console.log('OnboardingContext - Updating existing profile');
          await updateOnboardingStep(currentUser.uid, currentStep, stepData);
        }
        
        console.log('OnboardingContext - Firestore save successful');
      } else {
        console.warn('OnboardingContext - Firebase not configured, saving locally only');
      }
      
      // Update can proceed status based on step completion
      validateStepCompletion(updatedProfile, currentStep);
      
    } catch (error) {
      console.error('OnboardingContext - Error saving step data:', error);
      throw error;
    }
  };

  const completeOnboardingFlow = async (finalData: Partial<UserProfile>) => {
    if (!currentUser) return;

    try {
      if (isFirebaseConfigured) {
        await completeOnboarding(currentUser.uid, finalData);
      } else {
        console.warn('Firebase not configured, completing onboarding locally only');
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...finalData, onboardingCompleted: true } : null);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const validateStepCompletion = (currentProfile: UserProfile, step: number) => {
    let isValid = false;

    switch (step) {
      case 1: // Personal basics
        isValid = !!(
          currentProfile.personalInfo?.age &&
          currentProfile.personalInfo?.sex &&
          currentProfile.personalInfo?.height &&
          currentProfile.personalInfo?.weight
        );
        break;
      case 2: // Goals and timeline
        isValid = !!(
          currentProfile.goals?.primaryGoals?.length &&
          currentProfile.goals?.targetTimeline
        );
        break;
      case 3: // Experience and access
        isValid = !!(
          currentProfile.experience?.trainingExperience &&
          currentProfile.experience?.equipmentAccess?.length &&
          currentProfile.experience?.workoutLocation
        );
        break;
      case 4: // Availability and schedule
        isValid = !!(
          currentProfile.availability?.sessionsPerWeek &&
          currentProfile.availability?.sessionDuration &&
          currentProfile.availability?.preferredTimes?.length
        );
        break;
      case 5: // Health and limitations
        // This step is optional, so always valid
        isValid = true;
        break;
      case 6: // Exercise preferences
        isValid = !!(
          currentProfile.preferences?.preferredWorkoutSplit &&
          currentProfile.preferences?.repRangePreference
        );
        break;
      case 7: // Review and confirmation
        isValid = true;
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