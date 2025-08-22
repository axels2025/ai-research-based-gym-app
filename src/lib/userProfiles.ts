import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// Enums and Types for User Profile
export type Sex = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
export type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type WorkoutLocation = 'home' | 'gym' | 'outdoor' | 'hybrid';
export type EquipmentAccess = 'none' | 'basic' | 'full-gym' | 'advanced';

export type PrimaryGoal = 
  | 'muscle-gain' 
  | 'fat-loss' 
  | 'strength' 
  | 'endurance' 
  | 'athletic-performance' 
  | 'general-fitness' 
  | 'rehabilitation' 
  | 'body-composition';

export type SecondaryGoal = 
  | 'flexibility' 
  | 'balance' 
  | 'posture' 
  | 'stress-relief' 
  | 'confidence' 
  | 'energy' 
  | 'sleep-quality' 
  | 'functional-movement';

export type WorkoutSplit = 
  | 'full-body' 
  | 'upper-lower' 
  | 'push-pull-legs' 
  | 'body-part-split' 
  | 'circuit-training' 
  | 'functional';

export type RepRangePreference = 'low' | 'moderate' | 'high' | 'mixed';
export type CoachingStyle = 'supportive' | 'challenging' | 'analytical' | 'motivational';
export type PreferredTime = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface PersonalInfo {
  age: number;
  sex: Sex;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
}

export interface Experience {
  trainingExperience: TrainingExperience;
  equipmentAccess: EquipmentAccess[];
  workoutLocation: WorkoutLocation;
  yearsTraining?: number;
  previousPrograms?: string[];
}

export interface Goals {
  primaryGoals: PrimaryGoal[];
  secondaryGoals: SecondaryGoal[];
  targetTimeline: number; // in months
  bodyCompositionGoals?: {
    targetWeight?: number;
    targetBodyFat?: number;
    muscleGainTarget?: string;
  };
  specificGoals?: string; // Custom goals text
}

export interface Availability {
  sessionsPerWeek: number;
  sessionDuration: number; // in minutes
  preferredTimes: PreferredTime[];
  availableDays: string[]; // ['monday', 'tuesday', etc.]
  flexibleSchedule: boolean;
}

export interface HealthInfo {
  injuryHistory: {
    bodyPart: string;
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
    timeframe: string;
  }[];
  limitations: string[];
  medicalConditions: string[];
  painAreas: string[];
  medications?: string[];
  allergies?: string[];
}

export interface Preferences {
  favoriteExercises: string[];
  dislikedExercises: string[];
  preferredWorkoutSplit: WorkoutSplit;
  repRangePreference: RepRangePreference;
  workoutIntensity: 'low' | 'moderate' | 'high' | 'variable';
  restPreference: 'minimal' | 'standard' | 'extended';
  musicPreference?: string;
  workoutEnvironment?: string;
}

export interface Motivation {
  motivationFactors: string[];
  coachingStyle: CoachingStyle;
  progressMilestones: string[];
  rewardSystem?: string[];
  challengePreference: 'gradual' | 'aggressive' | 'variable';
}

export interface UserProfile {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  experience: Experience;
  goals: Goals;
  availability: Availability;
  health: HealthInfo;
  preferences: Preferences;
  motivation: Motivation;
  onboardingCompleted: boolean;
  completionStep: number; // Track which step user is on
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastOnboardingUpdate?: Timestamp;
}

// Firestore functions for User Profiles
export async function createUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }
  
  const profileRef = doc(db, 'userProfiles', userId);
  const profile: UserProfile = {
    id: userId,
    userId,
    personalInfo: profileData.personalInfo || {} as PersonalInfo,
    experience: profileData.experience || {} as Experience,
    goals: profileData.goals || {} as Goals,
    availability: profileData.availability || {} as Availability,
    health: profileData.health || {} as HealthInfo,
    preferences: profileData.preferences || {} as Preferences,
    motivation: profileData.motivation || {} as Motivation,
    onboardingCompleted: false,
    completionStep: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...profileData,
  };
  
  await setDoc(profileRef, profile);
  return profile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }
  
  const profileRef = doc(db, 'userProfiles', userId);
  const profileDoc = await getDoc(profileRef);
  
  if (profileDoc.exists()) {
    return profileDoc.data() as UserProfile;
  }
  
  return null;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }
  
  const profileRef = doc(db, 'userProfiles', userId);
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: Timestamp.now(),
    lastOnboardingUpdate: Timestamp.now(),
  });
}

export async function updateOnboardingStep(userId: string, step: number, stepData: Partial<UserProfile>): Promise<void> {
  await updateUserProfile(userId, {
    ...stepData,
    completionStep: step,
  });
}

export async function completeOnboarding(userId: string, finalData: Partial<UserProfile>): Promise<void> {
  await updateUserProfile(userId, {
    ...finalData,
    onboardingCompleted: true,
    completionStep: 7,
  });
}

export function checkProfileCompletion(profile: UserProfile): { completed: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  // Check required fields
  if (!profile.personalInfo?.age) missingFields.push('age');
  if (!profile.personalInfo?.sex) missingFields.push('sex');
  if (!profile.personalInfo?.height) missingFields.push('height');
  if (!profile.personalInfo?.weight) missingFields.push('weight');
  if (!profile.goals?.primaryGoals?.length) missingFields.push('primary goals');
  if (!profile.experience?.trainingExperience) missingFields.push('training experience');
  if (!profile.availability?.sessionsPerWeek) missingFields.push('sessions per week');
  
  return {
    completed: missingFields.length === 0 && profile.onboardingCompleted,
    missingFields,
  };
}

// AI Integration utilities
export function generateAIPromptData(profile: UserProfile): string {
  const { personalInfo, experience, goals, availability, health, preferences } = profile;
  
  return `User Profile for AI Workout Generation:

PERSONAL INFO:
- Age: ${personalInfo.age}
- Sex: ${personalInfo.sex}
- Height: ${personalInfo.height}cm
- Weight: ${personalInfo.weight}kg
- Activity Level: ${personalInfo.activityLevel}

EXPERIENCE:
- Training Experience: ${experience.trainingExperience}
- Years Training: ${experience.yearsTraining || 'Not specified'}
- Equipment Access: ${experience.equipmentAccess?.join(', ')}
- Workout Location: ${experience.workoutLocation}

GOALS:
- Primary Goals: ${goals.primaryGoals?.join(', ')}
- Secondary Goals: ${goals.secondaryGoals?.join(', ')}
- Target Timeline: ${goals.targetTimeline} months
- Specific Goals: ${goals.specificGoals || 'None specified'}

AVAILABILITY:
- Sessions per Week: ${availability.sessionsPerWeek}
- Session Duration: ${availability.sessionDuration} minutes
- Preferred Times: ${availability.preferredTimes?.join(', ')}
- Available Days: ${availability.availableDays?.join(', ')}

HEALTH CONSIDERATIONS:
- Injury History: ${health.injuryHistory?.map(i => `${i.bodyPart}: ${i.description}`).join('; ') || 'None'}
- Limitations: ${health.limitations?.join(', ') || 'None'}
- Medical Conditions: ${health.medicalConditions?.join(', ') || 'None'}
- Pain Areas: ${health.painAreas?.join(', ') || 'None'}

PREFERENCES:
- Preferred Workout Split: ${preferences.preferredWorkoutSplit}
- Rep Range Preference: ${preferences.repRangePreference}
- Workout Intensity: ${preferences.workoutIntensity}
- Favorite Exercises: ${preferences.favoriteExercises?.join(', ') || 'None specified'}
- Disliked Exercises: ${preferences.dislikedExercises?.join(', ') || 'None specified'}

Please generate a personalized workout program based on this profile.`;
}

// Default options for forms
export const defaultOptions = {
  primaryGoals: [
    { value: 'muscle-gain', label: 'Muscle Gain', icon: '💪' },
    { value: 'fat-loss', label: 'Fat Loss', icon: '🔥' },
    { value: 'strength', label: 'Strength', icon: '🏋️' },
    { value: 'endurance', label: 'Endurance', icon: '🏃' },
    { value: 'athletic-performance', label: 'Athletic Performance', icon: '⚡' },
    { value: 'general-fitness', label: 'General Fitness', icon: '🌟' },
    { value: 'rehabilitation', label: 'Rehabilitation', icon: '🩹' },
    { value: 'body-composition', label: 'Body Composition', icon: '📊' },
  ],
  
  secondaryGoals: [
    { value: 'flexibility', label: 'Flexibility', icon: '🤸' },
    { value: 'balance', label: 'Balance', icon: '⚖️' },
    { value: 'posture', label: 'Posture', icon: '🧘' },
    { value: 'stress-relief', label: 'Stress Relief', icon: '😌' },
    { value: 'confidence', label: 'Confidence', icon: '🌟' },
    { value: 'energy', label: 'Energy', icon: '⚡' },
    { value: 'sleep-quality', label: 'Sleep Quality', icon: '😴' },
    { value: 'functional-movement', label: 'Functional Movement', icon: '🏃‍♂️' },
  ],
  
  equipmentAccess: [
    { value: 'none', label: 'No Equipment', icon: '🏠' },
    { value: 'basic', label: 'Basic (Dumbbells, Resistance Bands)', icon: '🏋️‍♀️' },
    { value: 'full-gym', label: 'Full Gym Access', icon: '🏢' },
    { value: 'advanced', label: 'Advanced Equipment', icon: '⚙️' },
  ],
  
  trainingExperience: [
    { value: 'beginner', label: 'Beginner (0-1 years)', icon: '🌱' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)', icon: '🌿' },
    { value: 'advanced', label: 'Advanced (3-5 years)', icon: '🌳' },
    { value: 'expert', label: 'Expert (5+ years)', icon: '🌲' },
  ],
};