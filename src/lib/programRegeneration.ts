import { UserProfile, getUserProfile } from './userProfiles';
import { generateWorkoutPlan, AIWorkoutGenerationError } from './aiWorkoutGeneration';
import { 
  regenerateWorkoutProgram, 
  canRegenerateProgram, 
  revertToPreviousProgram,
  getActiveProgram,
  archiveCurrentProgram,
  createWorkout,
  type WorkoutProgram,
  type Workout
} from './firestore';
import { toast } from '@/hooks/use-toast';

export interface RegenerationResult {
  success: boolean;
  program?: WorkoutProgram;
  workouts?: Workout[];
  error?: string;
  usedFallback?: boolean;
}

export interface RegenerationCheck {
  canRegenerate: boolean;
  reason?: string;
  suggestedWaitDays?: number;
  programAge?: number;
  progressPercentage?: number;
  optimalTiming?: boolean;
}

// Enhanced regeneration logic that considers user history and progress
export async function checkRegenerationEligibility(userId: string): Promise<RegenerationCheck> {
  try {
    const baseCheck = await canRegenerateProgram(userId);
    const activeProgram = await getActiveProgram(userId);
    
    if (!activeProgram) {
      return { canRegenerate: true };
    }
    
    const programAge = Date.now() - activeProgram.createdAt.seconds * 1000;
    const daysSinceCreation = Math.floor(programAge / (1000 * 60 * 60 * 24));
    const progressPercentage = (activeProgram.workoutsCompleted / activeProgram.totalWorkouts) * 100;
    
    // Determine if timing is optimal (4-6 weeks or >80% completion)
    const optimalTiming = daysSinceCreation >= 28 || progressPercentage >= 80;
    
    return {
      ...baseCheck,
      programAge: daysSinceCreation,
      progressPercentage,
      optimalTiming,
    };
  } catch (error) {
    console.error('Error checking regeneration eligibility:', error);
    return {
      canRegenerate: false,
      reason: 'Unable to check program status. Please try again.',
    };
  }
}

// Smart regeneration that adapts to user progress and preferences
export async function regenerateProgramSmart(userId: string): Promise<RegenerationResult> {
  try {
    // Check eligibility first
    const eligibility = await checkRegenerationEligibility(userId);
    if (!eligibility.canRegenerate) {
      return {
        success: false,
        error: eligibility.reason || 'Cannot regenerate program at this time.',
      };
    }
    
    // Get user profile (may have been updated since onboarding)
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return {
        success: false,
        error: 'User profile not found. Please complete your profile first.',
      };
    }
    
    // Get current program for history tracking
    const currentProgram = await getActiveProgram(userId);
    
    // Generate new program using AI
    try {
      console.log('Generating new AI program for user:', userId);
      const aiResult = await generateWorkoutPlan(userProfile);
      
      // Archive current program and create new one
      const newProgram = await regenerateWorkoutProgram(userId, {
        name: aiResult.program.name,
        currentWeek: 1,
        totalWeeks: aiResult.program.totalWeeks,
        workoutsCompleted: 0,
        totalWorkouts: aiResult.program.totalWorkouts,
      });
      
      return {
        success: true,
        program: newProgram,
        workouts: aiResult.workouts,
      };
      
    } catch (aiError) {
      console.warn('AI generation failed, using enhanced fallback:', aiError);
      
      // Create intelligent fallback based on user history
      const fallbackProgram = await createIntelligentFallback(userId, userProfile, currentProgram);
      
      return {
        success: true,
        ...fallbackProgram,
        usedFallback: true,
      };
    }
    
  } catch (error) {
    console.error('Program regeneration failed:', error);
    return {
      success: false,
      error: 'Failed to regenerate program. Please try again later.',
    };
  }
}

// Create an intelligent fallback that considers user history
async function createIntelligentFallback(
  userId: string, 
  userProfile: UserProfile, 
  currentProgram: WorkoutProgram | null
): Promise<{ program: WorkoutProgram; workouts: Workout[] }> {
  
  // Analyze what worked well in previous program
  const progressionLevel = currentProgram?.workoutsCompleted || 0;
  const hasGoodProgress = progressionLevel >= (currentProgram?.totalWorkouts || 0) * 0.6;
  
  // Adjust program based on user progress
  const programName = hasGoodProgress 
    ? `Advanced ${userProfile.preferences.preferredWorkoutSplit} Program`
    : `Progressive ${userProfile.preferences.preferredWorkoutSplit} Program`;
    
  // Create new program
  const newProgram = await regenerateWorkoutProgram(userId, {
    name: programName,
    currentWeek: 1,
    totalWeeks: 6,
    workoutsCompleted: 0,
    totalWorkouts: userProfile.availability.sessionsPerWeek * 6,
  });
  
  // Create workouts with intelligent progression
  const workouts: Workout[] = [];
  const sessionsPerWeek = userProfile.availability.sessionsPerWeek;
  const baseIntensity = hasGoodProgress ? 'intermediate' : 'beginner';
  
  for (let week = 1; week <= 6; week++) {
    const rotation = Math.ceil(week / 2);
    const rotationWeek = week % 2 === 0 ? 2 : 1;
    
    for (let day = 1; day <= sessionsPerWeek; day++) {
      const workoutTitle = generateIntelligentWorkoutTitle(
        userProfile.preferences.preferredWorkoutSplit,
        day,
        rotation,
        hasGoodProgress
      );
      
      const workout = await createWorkout(userId, {
        programId: newProgram.id,
        title: workoutTitle,
        week,
        day,
        exercises: getOptimalExerciseCount(userProfile.experience.trainingExperience, rotation),
        estimatedTime: userProfile.availability.sessionDuration,
        isCompleted: false,
        rotation,
        rotationWeek,
        progressionNotes: getRotationProgressionNotes(rotation, baseIntensity),
      });
      
      workouts.push(workout);
    }
  }
  
  return { program: newProgram, workouts };
}

// Generate intelligent workout titles based on split and progression
function generateIntelligentWorkoutTitle(
  split: string,
  day: number,
  rotation: number,
  advanced: boolean
): string {
  const intensity = rotation === 1 ? 'Foundation' : rotation === 2 ? 'Build' : 'Peak';
  const level = advanced ? 'Advanced' : 'Progressive';
  
  switch (split) {
    case 'full-body':
      return `${level} Full Body ${intensity} - Day ${day}`;
    case 'upper-lower':
      return day % 2 === 1 
        ? `${level} Upper Body ${intensity}` 
        : `${level} Lower Body ${intensity}`;
    case 'push-pull-legs':
      const pplDay = ['Push', 'Pull', 'Legs'][day % 3];
      return `${level} ${pplDay} ${intensity}`;
    case 'body-part-split':
      const bodyParts = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms'][day % 5];
      return `${level} ${bodyParts} ${intensity}`;
    default:
      return `${level} Workout ${day} - ${intensity}`;
  }
}

// Determine optimal exercise count based on experience and rotation
function getOptimalExerciseCount(experience: string, rotation: number): number {
  const baseCount = experience === 'beginner' ? 4 : experience === 'intermediate' ? 6 : 8;
  const rotationModifier = rotation === 1 ? 0 : rotation === 2 ? 1 : 2;
  return Math.min(baseCount + rotationModifier, 10);
}

// Generate progression notes for each rotation
function getRotationProgressionNotes(rotation: number, baseIntensity: string): string {
  const phases = {
    1: 'Foundation phase: Focus on proper form, controlled movements, and building base strength.',
    2: 'Build phase: Increase intensity and volume. Add complexity to movements.',
    3: 'Peak phase: Maximum intensity with advanced variations and techniques.'
  };
  
  const intensityNote = baseIntensity === 'intermediate' 
    ? ' Push your limits with heavier weights and shorter rest periods.'
    : ' Progress at a comfortable pace, prioritizing form over weight.';
    
  return phases[rotation as keyof typeof phases] + intensityNote;
}

// Revert to previous program (24-hour window)
export async function revertProgram(userId: string): Promise<RegenerationResult> {
  try {
    const revertedProgram = await revertToPreviousProgram(userId);
    
    if (!revertedProgram) {
      return {
        success: false,
        error: 'Cannot revert: No previous program found or revert period has expired.',
      };
    }
    
    return {
      success: true,
      program: revertedProgram,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to revert program';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get regeneration recommendations
export async function getRegenerationRecommendations(userId: string): Promise<{
  shouldRegenerate: boolean;
  reason: string;
  benefits: string[];
  risks: string[];
}> {
  const eligibility = await checkRegenerationEligibility(userId);
  const activeProgram = await getActiveProgram(userId);
  
  if (!activeProgram) {
    return {
      shouldRegenerate: true,
      reason: 'No active program found.',
      benefits: ['Get a personalized workout plan', 'Start fresh with new exercises'],
      risks: [],
    };
  }
  
  const benefits: string[] = [];
  const risks: string[] = [];
  
  // Analyze benefits
  if (eligibility.optimalTiming) {
    benefits.push('Perfect timing for a new challenge');
    benefits.push('Your body has adapted to the current routine');
  }
  
  if (eligibility.progressPercentage && eligibility.progressPercentage >= 70) {
    benefits.push('You\'ve made excellent progress on your current program');
  }
  
  if (eligibility.programAge && eligibility.programAge >= 42) {
    benefits.push('Program is mature - time for new stimulus');
  }
  
  // Analyze risks
  if (!eligibility.canRegenerate) {
    risks.push(eligibility.reason || 'Not recommended at this time');
  }
  
  if (eligibility.progressPercentage && eligibility.progressPercentage < 50) {
    risks.push('Consider completing more of your current program first');
  }
  
  if (eligibility.programAge && eligibility.programAge < 14) {
    risks.push('Program is still relatively new');
  }
  
  return {
    shouldRegenerate: eligibility.canRegenerate && (eligibility.optimalTiming || false),
    reason: eligibility.reason || 'Program analysis complete',
    benefits,
    risks,
  };
}