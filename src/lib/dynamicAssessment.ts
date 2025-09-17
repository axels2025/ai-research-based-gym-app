// Dynamic Strength Assessment System
// Analyzes workout programs and creates targeted assessments

import { WorkoutProgram, Workout, Exercise } from './firestore';
import { generateWorkoutPlan } from './aiWorkoutGeneration';
import { UserProfile } from './userProfiles';
import { createExerciseProtocol, type ExerciseProtocol, type EquipmentType, type WorkoutGoal } from './researchBasedWorkout';

// Exercise categorization by movement patterns
export type MovementPattern = 
  | 'horizontal-push' 
  | 'vertical-push' 
  | 'horizontal-pull' 
  | 'vertical-pull' 
  | 'knee-dominant' 
  | 'hip-dominant' 
  | 'single-leg'
  | 'core'
  | 'accessory';

export interface ExerciseMapping {
  name: string;
  category: MovementPattern;
  equipment: EquipmentType;
  primaryMuscles: string[];
  isCompound: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AssessmentExercise {
  id: string;
  name: string;
  category: MovementPattern;
  description: string;
  equipment: EquipmentType;
  placeholder: string;
  icon: string;
  tips: string[];
  representsExercises: string[]; // Other exercises this assessment covers
  priority: number; // 1 = highest priority
}

export interface DynamicAssessmentData {
  assessedExercises: Record<string, {
    weight: number;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    goal: WorkoutGoal;
  }>;
  generatedProtocols: Record<string, ExerciseProtocol>;
  programExercises: string[];
  assessmentCompletion: number; // percentage of program exercises covered
}

// Comprehensive exercise mapping database
const EXERCISE_DATABASE: ExerciseMapping[] = [
  // Horizontal Push
  { name: 'Bench Press', category: 'horizontal-push', equipment: 'barbell', primaryMuscles: ['chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Barbell Bench Press', category: 'horizontal-push', equipment: 'barbell', primaryMuscles: ['chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Dumbbell Bench Press', category: 'horizontal-push', equipment: 'dumbbell', primaryMuscles: ['chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Incline Bench Press', category: 'horizontal-push', equipment: 'barbell', primaryMuscles: ['upper-chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Incline Dumbbell Press', category: 'horizontal-push', equipment: 'dumbbell', primaryMuscles: ['upper-chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Push-up', category: 'horizontal-push', equipment: 'bodyweight', primaryMuscles: ['chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'beginner' },
  { name: 'Dips', category: 'horizontal-push', equipment: 'bodyweight', primaryMuscles: ['chest', 'triceps', 'front-delts'], isCompound: true, difficulty: 'intermediate' },

  // Vertical Push  
  { name: 'Overhead Press', category: 'vertical-push', equipment: 'barbell', primaryMuscles: ['shoulders', 'triceps', 'core'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Military Press', category: 'vertical-push', equipment: 'barbell', primaryMuscles: ['shoulders', 'triceps', 'core'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Dumbbell Shoulder Press', category: 'vertical-push', equipment: 'dumbbell', primaryMuscles: ['shoulders', 'triceps'], isCompound: true, difficulty: 'beginner' },
  { name: 'Pike Push-up', category: 'vertical-push', equipment: 'bodyweight', primaryMuscles: ['shoulders', 'triceps'], isCompound: true, difficulty: 'intermediate' },

  // Horizontal Pull
  { name: 'Bent-over Row', category: 'horizontal-pull', equipment: 'barbell', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Barbell Row', category: 'horizontal-pull', equipment: 'barbell', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Dumbbell Row', category: 'horizontal-pull', equipment: 'dumbbell', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'beginner' },
  { name: 'Seated Cable Row', category: 'horizontal-pull', equipment: 'machine', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'beginner' },

  // Vertical Pull
  { name: 'Pull-up', category: 'vertical-pull', equipment: 'bodyweight', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'advanced' },
  { name: 'Chin-up', category: 'vertical-pull', equipment: 'bodyweight', primaryMuscles: ['lats', 'rhomboids', 'biceps'], isCompound: true, difficulty: 'advanced' },
  { name: 'Lat Pulldown', category: 'vertical-pull', equipment: 'machine', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'beginner' },
  { name: 'Assisted Pull-up', category: 'vertical-pull', equipment: 'machine', primaryMuscles: ['lats', 'rhomboids', 'rear-delts', 'biceps'], isCompound: true, difficulty: 'intermediate' },

  // Knee Dominant (Squats)
  { name: 'Squat', category: 'knee-dominant', equipment: 'barbell', primaryMuscles: ['quads', 'glutes', 'core'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Back Squat', category: 'knee-dominant', equipment: 'barbell', primaryMuscles: ['quads', 'glutes', 'core'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Front Squat', category: 'knee-dominant', equipment: 'barbell', primaryMuscles: ['quads', 'core'], isCompound: true, difficulty: 'advanced' },
  { name: 'Goblet Squat', category: 'knee-dominant', equipment: 'dumbbell', primaryMuscles: ['quads', 'glutes', 'core'], isCompound: true, difficulty: 'beginner' },
  { name: 'Bodyweight Squat', category: 'knee-dominant', equipment: 'bodyweight', primaryMuscles: ['quads', 'glutes'], isCompound: true, difficulty: 'beginner' },
  { name: 'Leg Press', category: 'knee-dominant', equipment: 'machine', primaryMuscles: ['quads', 'glutes'], isCompound: true, difficulty: 'beginner' },

  // Hip Dominant (Deadlifts & Hip Hinges)
  { name: 'Deadlift', category: 'hip-dominant', equipment: 'barbell', primaryMuscles: ['hamstrings', 'glutes', 'erectors', 'core'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Romanian Deadlift', category: 'hip-dominant', equipment: 'barbell', primaryMuscles: ['hamstrings', 'glutes', 'erectors'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Sumo Deadlift', category: 'hip-dominant', equipment: 'barbell', primaryMuscles: ['hamstrings', 'glutes', 'quads', 'core'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Hip Thrust', category: 'hip-dominant', equipment: 'barbell', primaryMuscles: ['glutes', 'hamstrings'], isCompound: true, difficulty: 'beginner' },
  { name: 'Glute Bridge', category: 'hip-dominant', equipment: 'bodyweight', primaryMuscles: ['glutes', 'hamstrings'], isCompound: true, difficulty: 'beginner' },

  // Single Leg
  { name: 'Bulgarian Split Squat', category: 'single-leg', equipment: 'bodyweight', primaryMuscles: ['quads', 'glutes'], isCompound: true, difficulty: 'intermediate' },
  { name: 'Walking Lunges', category: 'single-leg', equipment: 'bodyweight', primaryMuscles: ['quads', 'glutes'], isCompound: true, difficulty: 'beginner' },
  { name: 'Step-ups', category: 'single-leg', equipment: 'bodyweight', primaryMuscles: ['quads', 'glutes'], isCompound: true, difficulty: 'beginner' },
  { name: 'Single Leg RDL', category: 'single-leg', equipment: 'bodyweight', primaryMuscles: ['hamstrings', 'glutes', 'core'], isCompound: true, difficulty: 'intermediate' },

  // Accessory Movements
  { name: 'Bicep Curls', category: 'accessory', equipment: 'dumbbell', primaryMuscles: ['biceps'], isCompound: false, difficulty: 'beginner' },
  { name: 'Barbell Curls', category: 'accessory', equipment: 'barbell', primaryMuscles: ['biceps'], isCompound: false, difficulty: 'beginner' },
  { name: 'Tricep Pushdowns', category: 'accessory', equipment: 'machine', primaryMuscles: ['triceps'], isCompound: false, difficulty: 'beginner' },
  { name: 'Lateral Raises', category: 'accessory', equipment: 'dumbbell', primaryMuscles: ['side-delts'], isCompound: false, difficulty: 'beginner' },
  { name: 'Calf Raises', category: 'accessory', equipment: 'bodyweight', primaryMuscles: ['calves'], isCompound: false, difficulty: 'beginner' },

  // Core
  { name: 'Plank', category: 'core', equipment: 'bodyweight', primaryMuscles: ['core'], isCompound: false, difficulty: 'beginner' },
  { name: 'Dead Bug', category: 'core', equipment: 'bodyweight', primaryMuscles: ['core'], isCompound: false, difficulty: 'beginner' },
  { name: 'Russian Twists', category: 'core', equipment: 'bodyweight', primaryMuscles: ['obliques'], isCompound: false, difficulty: 'beginner' },
];

/**
 * Extract all exercises from a workout program
 */
export function extractProgramExercises(aiPlan: any): string[] {
  const exercises = new Set<string>();
  
  if (aiPlan.rotationCycles) {
    aiPlan.rotationCycles.forEach((cycle: any) => {
      cycle.workouts?.forEach((workout: any) => {
        workout.exercises?.forEach((exercise: any) => {
          exercises.add(exercise.name);
          // Also add alternatives
          exercise.alternatives?.forEach((alt: string) => exercises.add(alt));
        });
      });
    });
  }
  
  return Array.from(exercises);
}

/**
 * Find exercise mapping in database (fuzzy matching)
 */
export function findExerciseMapping(exerciseName: string): ExerciseMapping | null {
  // Direct match first
  const directMatch = EXERCISE_DATABASE.find(ex => 
    ex.name.toLowerCase() === exerciseName.toLowerCase()
  );
  if (directMatch) return directMatch;
  
  // Fuzzy matching for variations
  const fuzzyMatch = EXERCISE_DATABASE.find(ex => 
    exerciseName.toLowerCase().includes(ex.name.toLowerCase()) ||
    ex.name.toLowerCase().includes(exerciseName.toLowerCase())
  );
  
  return fuzzyMatch || null;
}

/**
 * Group exercises by movement patterns and select representatives
 */
export function selectAssessmentExercises(
  programExercises: string[],
  userProfile: UserProfile
): AssessmentExercise[] {
  const exercisesByCategory = new Map<MovementPattern, ExerciseMapping[]>();
  
  // Categorize all program exercises
  programExercises.forEach(exerciseName => {
    const mapping = findExerciseMapping(exerciseName);
    if (mapping) {
      if (!exercisesByCategory.has(mapping.category)) {
        exercisesByCategory.set(mapping.category, []);
      }
      exercisesByCategory.get(mapping.category)!.push(mapping);
    }
  });
  
  const assessmentExercises: AssessmentExercise[] = [];
  let priority = 1;
  
  // Define category priorities based on training fundamentals
  const categoryPriority: MovementPattern[] = [
    'knee-dominant',      // Squat pattern - fundamental
    'hip-dominant',       // Deadlift pattern - fundamental  
    'horizontal-push',    // Bench/push pattern - fundamental
    'vertical-push',      // Overhead press - important compound
    'horizontal-pull',    // Rowing - balance pushing
    'vertical-pull',      // Pull-ups/pulldowns - important compound
    'single-leg',         // Unilateral training
    'accessory',          // Isolation work
    'core'               // Core stability
  ];
  
  categoryPriority.forEach(category => {
    const categoryExercises = exercisesByCategory.get(category);
    if (!categoryExercises || categoryExercises.length === 0) return;
    
    // Select the most appropriate representative exercise
    const representative = selectBestRepresentative(categoryExercises, userProfile);
    if (representative) {
      const assessmentExercise = createAssessmentExercise(
        representative, 
        categoryExercises.map(ex => ex.name),
        priority++
      );
      assessmentExercises.push(assessmentExercise);
    }
  });
  
  return assessmentExercises;
}

/**
 * Select the best representative exercise for a category
 */
function selectBestRepresentative(
  exercises: ExerciseMapping[], 
  userProfile: UserProfile
): ExerciseMapping | null {
  if (exercises.length === 0) return null;
  if (exercises.length === 1) return exercises[0];
  
  const userExperience = userProfile.experience.trainingExperience;
  const equipment = userProfile.experience.equipmentAccess || [];
  
  // Score exercises based on suitability
  const scored = exercises.map(ex => {
    let score = 0;
    
    // Equipment availability - map EquipmentAccess to actual equipment
    const hasFullGym = equipment.includes('full-gym');
    const hasBasic = equipment.includes('basic');
    const hasAdvanced = equipment.includes('advanced');
    
    if (hasFullGym || hasAdvanced) {
      score += 3; // Can do any exercise
    } else if (hasBasic && (ex.equipment === 'dumbbell' || ex.equipment === 'bodyweight')) {
      score += 3; // Basic equipment supports dumbbells and bodyweight
    } else if (ex.equipment === 'bodyweight') {
      score += 2; // Bodyweight exercises always available
    } else if (!hasFullGym && ex.equipment === 'barbell') {
      score -= 1; // Penalize barbell exercises without full gym
    }
    
    // Experience match
    if (ex.difficulty === userExperience) {
      score += 2;
    } else if ((ex.difficulty === 'beginner' && userExperience !== 'advanced') ||
               (ex.difficulty === 'intermediate')) {
      score += 1;
    }
    
    // Prefer compound movements for assessment
    if (ex.isCompound) {
      score += 2;
    }
    
    // Prefer common exercises (barbell/dumbbell over machines)
    if (ex.equipment === 'barbell') score += 1;
    if (ex.equipment === 'dumbbell') score += 0.5;
    
    return { exercise: ex, score };
  });
  
  // Return highest scoring exercise
  scored.sort((a, b) => b.score - a.score);
  return scored[0].exercise;
}

/**
 * Create assessment exercise with proper configuration
 */
function createAssessmentExercise(
  mapping: ExerciseMapping,
  representsExercises: string[],
  priority: number
): AssessmentExercise {
  const icons: Record<MovementPattern, string> = {
    'horizontal-push': '🏋️',
    'vertical-push': '💪',
    'horizontal-pull': '🔙',
    'vertical-pull': '🆙',
    'knee-dominant': '🦵',
    'hip-dominant': '🍑',
    'single-leg': '🚶',
    'accessory': '💪',
    'core': '🎯'
  };
  
  const descriptions: Record<MovementPattern, string> = {
    'horizontal-push': 'Horizontal pushing strength assessment',
    'vertical-push': 'Overhead pushing strength assessment', 
    'horizontal-pull': 'Horizontal pulling strength assessment',
    'vertical-pull': 'Vertical pulling strength assessment',
    'knee-dominant': 'Knee-dominant leg strength assessment',
    'hip-dominant': 'Hip-dominant posterior chain assessment',
    'single-leg': 'Unilateral leg strength assessment',
    'accessory': 'Accessory movement strength assessment',
    'core': 'Core stability assessment'
  };
  
  return {
    id: mapping.name.toLowerCase().replace(/\s+/g, '-'),
    name: mapping.name,
    category: mapping.category,
    description: descriptions[mapping.category],
    equipment: mapping.equipment,
    placeholder: getPlaceholderWeight(mapping),
    icon: icons[mapping.category],
    tips: getTipsForExercise(mapping),
    representsExercises,
    priority
  };
}

/**
 * Get placeholder weight based on exercise and equipment
 */
function getPlaceholderWeight(mapping: ExerciseMapping): string {
  const weights: Record<string, string> = {
    'Bench Press': 'e.g., 60',
    'Squat': 'e.g., 80', 
    'Deadlift': 'e.g., 100',
    'Overhead Press': 'e.g., 40',
    'Bent-over Row': 'e.g., 60',
    'Pull-up': 'Bodyweight',
    'Dips': 'Bodyweight',
    'Bulgarian Split Squat': 'Bodyweight + 10kg',
    'Hip Thrust': 'e.g., 80'
  };
  
  return weights[mapping.name] || 'e.g., 50';
}

/**
 * Get assessment tips for specific exercises
 */
function getTipsForExercise(mapping: ExerciseMapping): string[] {
  const baseTips = [
    `Enter a weight you can comfortably ${mapping.name.toLowerCase()} for 6-8 repetitions`,
    'Use strict form with controlled movement',
    'This should feel moderately challenging, not your maximum'
  ];
  
  const specificTips: Record<string, string[]> = {
    'Squat': [
      'Weight for 6-8 full-depth squats with good form',
      'Descend below parallel if mobility allows',
      'Choose a weight that challenges you but maintains technique'
    ],
    'Deadlift': [
      'Weight you can deadlift from the floor for 5-6 reps',
      'Focus on proper hip hinge and neutral spine', 
      'Should be challenging but allow perfect form'
    ],
    'Pull-up': [
      'If you can do bodyweight pull-ups, enter your bodyweight',
      'If you need assistance, use assisted pull-up machine weight',
      'Focus on full range of motion'
    ]
  };
  
  return specificTips[mapping.name] || baseTips;
}

/**
 * Generate workout program and create dynamic assessment
 */
export async function createDynamicAssessment(
  userProfile: UserProfile
): Promise<{
  assessmentExercises: AssessmentExercise[];
  programExercises: string[];
  estimatedCompletionTime: number;
}> {
  try {
    // Generate the user's workout program
    const { aiGeneratedPlan } = await generateWorkoutPlan(userProfile);
    
    // Extract all exercises from the program
    const programExercises = extractProgramExercises(aiGeneratedPlan);
    
    // Select representative exercises for assessment
    const assessmentExercises = selectAssessmentExercises(programExercises, userProfile);
    
    // Estimate completion time (2-3 minutes per exercise)
    const estimatedCompletionTime = assessmentExercises.length * 2.5;
    
    return {
      assessmentExercises,
      programExercises,
      estimatedCompletionTime
    };
    
  } catch (error) {
    console.error('Failed to create dynamic assessment:', error);
    
    // Fallback to basic assessment if program generation fails
    return createFallbackAssessment(userProfile);
  }
}

/**
 * Fallback assessment when program generation fails
 */
function createFallbackAssessment(userProfile: UserProfile): {
  assessmentExercises: AssessmentExercise[];
  programExercises: string[];
  estimatedCompletionTime: number;
} {
  const basicExercises = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];
  const assessmentExercises = selectAssessmentExercises(basicExercises, userProfile);
  
  return {
    assessmentExercises,
    programExercises: basicExercises,
    estimatedCompletionTime: assessmentExercises.length * 2.5
  };
}

/**
 * Generate protocols for all program exercises based on assessment data
 */
export function generateAllProtocols(
  assessmentData: Record<string, { weight: number; experienceLevel: string; goal: WorkoutGoal }>,
  assessmentExercises: AssessmentExercise[],
  programExercises: string[]
): Record<string, ExerciseProtocol> {
  const protocols: Record<string, ExerciseProtocol> = {};
  
  programExercises.forEach(exerciseName => {
    const mapping = findExerciseMapping(exerciseName);
    if (!mapping) return;
    
    // Find the assessment exercise that represents this program exercise
    const representativeAssessment = assessmentExercises.find(ae => 
      ae.representsExercises.includes(exerciseName) || ae.name === exerciseName
    );
    
    if (representativeAssessment && assessmentData[representativeAssessment.name]) {
      const assessment = assessmentData[representativeAssessment.name];
      
      // Adjust weight based on exercise difficulty and similarity
      const adjustedWeight = adjustWeightForExercise(
        assessment.weight,
        representativeAssessment.name,
        exerciseName,
        mapping
      );
      
      protocols[exerciseName] = createExerciseProtocol(
        exerciseName,
        adjustedWeight,
        assessment.goal === 'strength' ? 6 : assessment.goal === 'hypertrophy' ? 10 : 15,
        mapping.equipment,
        assessment.goal,
        mapping.primaryMuscles,
        []
      );
    }
  });
  
  return protocols;
}

/**
 * Adjust weight when applying assessment to different but similar exercises
 */
function adjustWeightForExercise(
  assessmentWeight: number,
  assessmentExercise: string,
  targetExercise: string,
  targetMapping: ExerciseMapping
): number {
  // If it's the same exercise, use the same weight
  if (assessmentExercise.toLowerCase() === targetExercise.toLowerCase()) {
    return assessmentWeight;
  }
  
  // Adjustment factors for different exercises within same category
  const adjustmentFactors: Record<string, Record<string, number>> = {
    // Horizontal Push adjustments
    'Bench Press': {
      'Incline Bench Press': 0.85,
      'Incline Dumbbell Press': 0.75,
      'Dumbbell Bench Press': 0.8,
      'Dips': 1.0, // bodyweight exercise
      'Push-up': 1.0  // bodyweight exercise
    },
    
    // Squat adjustments  
    'Squat': {
      'Front Squat': 0.8,
      'Goblet Squat': 0.6,
      'Bulgarian Split Squat': 0.5,
      'Leg Press': 1.4
    },
    
    // Deadlift adjustments
    'Deadlift': {
      'Romanian Deadlift': 0.85,
      'Sumo Deadlift': 0.95,
      'Hip Thrust': 1.1
    }
  };
  
  const factor = adjustmentFactors[assessmentExercise]?.[targetExercise] || 0.9;
  return Math.round(assessmentWeight * factor);
}