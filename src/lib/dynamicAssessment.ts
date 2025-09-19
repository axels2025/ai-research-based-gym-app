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
 * Get placeholder weight based on exercise and equipment - conservative estimates only
 */
function getPlaceholderWeight(mapping: ExerciseMapping): string {
  // Provide conservative examples based on equipment type, not specific weights
  if (mapping.equipment === 'bodyweight') {
    return 'Bodyweight only';
  } else if (mapping.equipment === 'barbell') {
    return 'e.g., 30-40kg';
  } else if (mapping.equipment === 'dumbbell') {
    return 'e.g., 10-15kg';
  } else if (mapping.equipment === 'machine') {
    return 'e.g., 20-30kg';
  }
  
  return 'Enter comfortable weight';
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
    
    // Fallback with basic exercises - NO HARDCODED WEIGHTS
    const basicExercises: AssessmentExercise[] = [
      {
        id: 'squat',
        name: 'Squat',
        category: 'knee-dominant',
        description: 'Fundamental leg strength assessment',
        equipment: 'bodyweight',
        placeholder: 'Bodyweight only',
        icon: '🦵',
        tips: [
          'Start with bodyweight squats',
          'Focus on full range of motion',
          'Enter bodyweight if comfortable with squats'
        ],
        representsExercises: ['Squat', 'Leg Press', 'Goblet Squat'],
        priority: 1
      }
    ];
    
    return {
      assessmentExercises: basicExercises,
      programExercises: ['Squat'],
      estimatedCompletionTime: 5
    };
  }
}

/**
 * Generate safe exercise protocols with strict weight validation
 */
export function generateAllProtocols(
  assessmentData: Record<string, { weight: number; experienceLevel: string; goal: WorkoutGoal }>,
  assessmentExercises: AssessmentExercise[],
  programExercises: string[]
): Record<string, ExerciseProtocol> {
  const protocols: Record<string, ExerciseProtocol> = {};
  
  // Generate protocols with safety validation - no dangerous weights
  Object.keys(assessmentData).forEach(exerciseName => {
    const { weight, experienceLevel, goal } = assessmentData[exerciseName];
    
    // Safety check: validate weight is reasonable (max 10% increase from assessment)
    const maxSafeWeight = weight * 1.1;
    const safeWeight = Math.min(weight, maxSafeWeight);
    
    if (safeWeight !== weight) {
      console.warn(`Capping ${exerciseName} from ${weight}kg to ${safeWeight}kg for safety`);
    }
    
    protocols[exerciseName] = createExerciseProtocol(
      exerciseName,
      safeWeight, // Use safe weight
      getTargetRepsForGoal(goal),
      findExerciseMapping(exerciseName)?.equipment || 'barbell',
      goal
    );
  });

  // Handle program exercises not in assessment with safety
  programExercises.forEach(exerciseName => {
    if (!protocols[exerciseName]) {
      // Find assessment exercise that can represent this one
      const representativeAssessment = assessmentExercises.find(
        ex => ex.representsExercises.includes(exerciseName)
      );
      
      if (representativeAssessment && assessmentData[representativeAssessment.name]) {
        const assessmentWeight = assessmentData[representativeAssessment.name].weight;
        const targetMapping = findExerciseMapping(exerciseName);
        
        if (targetMapping) {
          const adjustedWeight = adjustWeightForExercise(
            assessmentWeight,
            representativeAssessment.name,
            exerciseName,
            targetMapping
          );
          
          protocols[exerciseName] = createExerciseProtocol(
            exerciseName,
            adjustedWeight,
            getTargetRepsForGoal(assessmentData[representativeAssessment.name].goal),
            targetMapping.equipment,
            assessmentData[representativeAssessment.name].goal
          );
        }
      } else {
        // No assessment data available - require user input
        console.warn(`No assessment data for ${exerciseName} - user must input weight manually`);
      }
    }
  });

  return protocols;
}

/**
 * Adjust weight between different exercises with conservative safety limits
 */
export function adjustWeightForExercise(
  assessmentWeight: number,
  assessmentExercise: string,
  targetExercise: string,
  targetMapping: ExerciseMapping
): number {
  // Conservative adjustment - maximum 10% difference between similar exercises
  let adjustmentFactor = 1.0;
  
  // Same exercise = no adjustment
  if (assessmentExercise.toLowerCase() === targetExercise.toLowerCase()) {
    return assessmentWeight;
  }
  
  // Conservative adjustments between exercise variations
  const assessmentLower = assessmentExercise.toLowerCase();
  const targetLower = targetExercise.toLowerCase();
  
  // Only make very small adjustments for safety
  if (assessmentLower.includes('barbell') && targetLower.includes('dumbbell')) {
    adjustmentFactor = 0.7; // Dumbbells typically lighter per hand
  } else if (assessmentLower.includes('dumbbell') && targetLower.includes('barbell')) {
    adjustmentFactor = 1.2; // Barbell can be slightly heavier
  } else if (assessmentLower.includes('machine') && !targetLower.includes('machine')) {
    adjustmentFactor = 0.8; // Free weights typically require less weight than machines
  } else if (!assessmentLower.includes('machine') && targetLower.includes('machine')) {
    adjustmentFactor = 1.1; // Machines can handle slightly more weight
  }
  
  // Apply adjustment and safety limits
  const adjustedWeight = assessmentWeight * adjustmentFactor;
  return applySafetyLimits(adjustedWeight, assessmentWeight, targetMapping);
}

/**
 * Apply strict safety limits to prevent dangerous weight suggestions
 */
export function applySafetyLimits(adjustedWeight: number, originalWeight: number, targetMapping: ExerciseMapping): number {
  // Never allow more than 10% increase from assessment weight
  const maxSafeWeight = originalWeight * 1.1;
  const minSafeWeight = originalWeight * 0.7;
  
  // Also ensure weight is within reasonable bounds for equipment
  const equipmentMaximums = {
    barbell: 150,   // Conservative maximum for most users
    dumbbell: 40,   // Per dumbbell
    machine: 100,   // Machine stack limit
    bodyweight: 50  // Added weight limit
  };
  
  const equipmentMax = equipmentMaximums[targetMapping.equipment];
  
  // Apply all safety constraints
  let safeWeight = Math.min(adjustedWeight, maxSafeWeight, equipmentMax);
  safeWeight = Math.max(safeWeight, minSafeWeight);
  
  // Round to nearest 2.5kg for practical loading
  return Math.round(safeWeight / 2.5) * 2.5;
}

/**
 * Apply conservative experience limits to prevent unrealistic weights
 */
export function applyExperienceLimits(weight: number, experience: 'beginner' | 'intermediate' | 'advanced', mapping: ExerciseMapping): number {
  const experienceLimits = {
    beginner: {
      barbell: 60,    // Conservative for beginners
      dumbbell: 20,   // Per dumbbell
      machine: 50,    // Machine assistance helps beginners
      bodyweight: 10  // Minimal added weight
    },
    intermediate: {
      barbell: 100,
      dumbbell: 30,
      machine: 75,
      bodyweight: 25
    },
    advanced: {
      barbell: 150,   // Still conservative even for advanced
      dumbbell: 40,
      machine: 100,
      bodyweight: 50
    }
  };
  
  const limit = experienceLimits[experience][mapping.equipment];
  return Math.min(weight, limit);
}

/**
 * Get target repetitions based on training goal
 */
export function getTargetRepsForGoal(goal: WorkoutGoal): number {
  const repRanges = {
    strength: 5,      // Low reps for strength
    hypertrophy: 10,  // Moderate reps for hypertrophy  
    endurance: 15     // Higher reps for endurance
  };
  
  return repRanges[goal];
}

/**
 * Get form cues for specific exercises
 */
export function getFormCuesForExercise(mapping: ExerciseMapping): string[] {
  const specificCues: Record<string, string[]> = {
    'Squat': [
      'Feet shoulder-width apart',
      'Knees track over toes', 
      'Chest up, core braced',
      'Descend as if sitting back into chair'
    ],
    'Deadlift': [
      'Bar close to shins',
      'Neutral spine throughout movement',
      'Drive through heels',
      'Hinge at hips, not knees'
    ],
    'Bench Press': [
      'Retract shoulder blades',
      'Feet flat on floor',
      'Control the descent',
      'Drive up through chest'
    ]
  };
  
  return specificCues[mapping.name] || [
    'Maintain good posture',
    'Control the movement',
    'Focus on target muscles',
    'Breathe properly throughout'
  ];
}