// Research-Based Workout Calculations
// Based on evidence from exercise science literature

export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';
export type WorkoutGoal = 'strength' | 'hypertrophy' | 'endurance';
export type SetType = 'warmup' | 'working' | 'dropset' | 'cluster';

export interface WarmupSet {
  id: string;
  weight: number;
  reps: string; // e.g., "6-8"
  percentage: number; // % of working weight
  restTime: number; // seconds
  description: string;
  type: 'warmup';
  stage: 'movement-prep' | 'activation' | 'potentiation';
}

export interface WorkingSet {
  id: string;
  weight: number;
  reps: string | number;
  restTime: number;
  description: string;
  type: 'working';
  targetRPE?: number; // Rate of Perceived Exertion 1-10
}

export interface ExerciseProtocol {
  exerciseName: string;
  equipmentType: EquipmentType;
  workingWeight: number;
  targetReps: number;
  goal: WorkoutGoal;
  warmupSets: WarmupSet[];
  workingSets: WorkingSet[];
  totalEstimatedTime: number; // minutes
  muscleActivation: string[];
  formCues: string[];
}

// Research-based constants from exercise science literature
const EQUIPMENT_EMPTY_WEIGHTS = {
  barbell: 20, // kg (45 lbs)
  dumbbell: 0, // varies too much
  machine: 0,  // pin-loaded or different mechanisms
  bodyweight: 0
} as const;

// Rest period recommendations based on research (Willardson & Burkett, 2005)
const REST_PERIODS = {
  strength: {
    warmup: { light: 30, moderate: 60, heavy: 90, potentiation: 180 },
    working: 180 // 3-5 minutes for strength training
  },
  hypertrophy: {
    warmup: { light: 30, moderate: 45, heavy: 60, potentiation: 90 },
    working: 90 // 60-90 seconds for hypertrophy
  },
  endurance: {
    warmup: { light: 20, moderate: 30, heavy: 45, potentiation: 60 },
    working: 60 // 30-60 seconds for endurance
  }
} as const;

/**
 * Calculate research-based warm-up progression
 * Based on Joe Kenn's Tier System and ACSM recommendations
 * 
 * @param workingWeight - User's comfortable working weight
 * @param equipmentType - Type of equipment being used
 * @param goal - Training goal (strength, hypertrophy, endurance)
 * @returns Array of warm-up sets with calculated weights and rest periods
 */
export function calculateWarmupSets(
  workingWeight: number, 
  equipmentType: EquipmentType = 'barbell',
  goal: WorkoutGoal = 'strength'
): WarmupSet[] {
  const emptyWeight = EQUIPMENT_EMPTY_WEIGHTS[equipmentType];
  const restPeriods = REST_PERIODS[goal].warmup;
  
  // Ensure working weight is reasonable for calculations with more conservative minimum
  if (workingWeight <= emptyWeight) {
    workingWeight = emptyWeight + 10; // More conservative minimum working weight
  }
  
  // Safety check: ensure working weight is not dangerously high
  // Only warn, don't cap - let users decide but warn them
  const reasonableMaximums = {
    barbell: 300,  // Very experienced lifters might use this
    dumbbell: 80,  // Heavy dumbbells exist
    machine: 200,  // Machine stacks can be high
    bodyweight: 100 // With added weight
  };
  
  if (workingWeight > reasonableMaximums[equipmentType]) {
    console.warn(`Working weight ${workingWeight}kg is very high for ${equipmentType}. Please ensure this is correct.`);
  }
  
  const warmupSets: WarmupSet[] = [];
  
  // Stage 1: Movement Preparation (empty bar/light weight)
  if (emptyWeight > 0) {
    warmupSets.push({
      id: 'warmup-1',
      weight: emptyWeight,
      reps: '8-10',
      percentage: Math.round((emptyWeight / workingWeight) * 100),
      restTime: restPeriods.light,
      description: 'Movement preparation',
      type: 'warmup',
      stage: 'movement-prep'
    });
  }
  
  // Stage 2: Muscle Activation (50% of working weight)
  const fiftyPercent = Math.round(workingWeight * 0.5);
  if (fiftyPercent > emptyWeight) {
    warmupSets.push({
      id: 'warmup-2',
      weight: fiftyPercent,
      reps: '6-8',
      percentage: 50,
      restTime: restPeriods.moderate,
      description: '50% working weight - muscle activation',
      type: 'warmup',
      stage: 'activation'
    });
  }
  
  // Stage 3: Progressive Loading (65% of working weight)
  const sixtyFivePercent = Math.round(workingWeight * 0.65);
  warmupSets.push({
    id: 'warmup-3',
    weight: sixtyFivePercent,
    reps: '4-5',
    percentage: 65,
    restTime: restPeriods.moderate,
    description: '65% working weight - progressive loading',
    type: 'warmup',
    stage: 'activation'
  });
  
  // Stage 4: Neural Preparation (80% of working weight)
  const eightyPercent = Math.round(workingWeight * 0.8);
  warmupSets.push({
    id: 'warmup-4',
    weight: eightyPercent,
    reps: '2-3',
    percentage: 80,
    restTime: restPeriods.heavy,
    description: '80% working weight - neural preparation',
    type: 'warmup',
    stage: 'potentiation'
  });
  
  // Stage 5: Potentiation (90% of working weight) - Only for strength goals
  if (goal === 'strength') {
    const ninetyPercent = Math.round(workingWeight * 0.9);
    warmupSets.push({
      id: 'warmup-5',
      weight: ninetyPercent,
      reps: '1-2',
      percentage: 90,
      restTime: restPeriods.potentiation,
      description: '90% working weight - potentiation',
      type: 'warmup',
      stage: 'potentiation'
    });
  }
  
  return warmupSets;
}

/**
 * Calculate research-based working sets
 * Based on periodization principles and training adaptations
 * 
 * @param workingWeight - User's comfortable working weight
 * @param targetReps - Target repetitions for the exercise
 * @param goal - Training goal
 * @returns Array of working sets with rep ranges and rest periods
 */
export function calculateWorkingSets(
  workingWeight: number,
  targetReps: number,
  goal: WorkoutGoal = 'strength'
): WorkingSet[] {
  const restTime = REST_PERIODS[goal].working;
  
  const workingSets: WorkingSet[] = [
    {
      id: 'working-1',
      weight: workingWeight,
      reps: targetReps,
      restTime,
      description: `Working set 1 - ${targetReps} reps`,
      type: 'working',
      targetRPE: goal === 'strength' ? 8 : goal === 'hypertrophy' ? 7 : 6
    },
    {
      id: 'working-2',
      weight: workingWeight,
      reps: goal === 'strength' ? targetReps : `${Math.max(1, targetReps - 2)}-${targetReps}`,
      restTime,
      description: `Working set 2 - maintain quality`,
      type: 'working',
      targetRPE: goal === 'strength' ? 9 : goal === 'hypertrophy' ? 8 : 7
    },
    {
      id: 'working-3',
      weight: workingWeight,
      reps: goal === 'strength' ? 
        `${Math.max(1, targetReps - 1)}-${targetReps}` : 
        `${Math.max(1, targetReps - 3)}-${targetReps - 1}`,
      restTime,
      description: `Working set 3 - to near failure`,
      type: 'working',
      targetRPE: goal === 'strength' ? 9 : goal === 'hypertrophy' ? 9 : 8
    }
  ];
  
  return workingSets;
}

/**
 * Calculate scientific rest duration based on set type and training goal
 * Based on research from Willardson & Burkett (2005) and ACSM guidelines
 */
export function getScientificRestDuration(
  setType: SetType,
  percentage?: number,
  userGoal: WorkoutGoal = 'strength'
): number {
  if (setType === 'warmup') {
    if (!percentage) return 60; // default
    
    if (percentage <= 30) return REST_PERIODS[userGoal].warmup.light;
    if (percentage <= 60) return REST_PERIODS[userGoal].warmup.moderate;
    if (percentage <= 85) return REST_PERIODS[userGoal].warmup.heavy;
    return REST_PERIODS[userGoal].warmup.potentiation;
  }
  
  return REST_PERIODS[userGoal].working;
}

/**
 * Create complete exercise protocol with research-based calculations
 */
export function createExerciseProtocol(
  exerciseName: string,
  workingWeight: number,
  targetReps: number,
  equipmentType: EquipmentType = 'barbell',
  goal: WorkoutGoal = 'strength',
  muscleActivation: string[] = [],
  formCues: string[] = []
): ExerciseProtocol {
  const warmupSets = calculateWarmupSets(workingWeight, equipmentType, goal);
  const workingSets = calculateWorkingSets(workingWeight, targetReps, goal);
  
  // Calculate total estimated time (including transition time between sets)
  const warmupTime = warmupSets.reduce((total, set) => total + set.restTime, 0);
  const workingTime = workingSets.reduce((total, set) => total + set.restTime, 0);
  const executionTime = (warmupSets.length + workingSets.length) * 45; // 45 seconds per set execution
  const totalEstimatedTime = Math.round((warmupTime + workingTime + executionTime) / 60); // convert to minutes
  
  return {
    exerciseName,
    equipmentType,
    workingWeight,
    targetReps,
    goal,
    warmupSets,
    workingSets,
    totalEstimatedTime,
    muscleActivation,
    formCues
  };
}

/**
 * Get coaching tips based on current set and training phase
 */
export function getCoachingTips(setType: SetType, percentage?: number, stage?: string): string[] {
  if (setType === 'warmup') {
    switch (stage) {
      case 'movement-prep':
        return [
          'Focus on movement quality and range of motion',
          'Activate target muscles and joints',
          'Start slow, increase tempo gradually'
        ];
      case 'activation':
        return [
          'Feel the target muscles working',
          'Maintain perfect form as load increases',
          'Focus on movement rhythm and breathing'
        ];
      case 'potentiation':
        return [
          'Prime your nervous system for heavy lifting',
          'Focus on speed and explosiveness',
          'Visualize your working sets'
        ];
      default:
        return ['Prepare your body for the working sets ahead'];
    }
  } else {
    return [
      'Maintain excellent form throughout the set',
      'Control the weight, don\'t let it control you',
      'Push hard but save 1-2 reps in reserve',
      'Focus on quality over quantity'
    ];
  }
}

/**
 * Validate user input for comfortable working weight
 */
export function validateComfortableWeight(
  exerciseName: string,
  weight: number,
  reps: number,
  equipmentType: EquipmentType
): { isValid: boolean; message?: string; suggestedWeight?: number } {
  const minWeight = EQUIPMENT_EMPTY_WEIGHTS[equipmentType];
  
  if (weight < minWeight) {
    return {
      isValid: false,
      message: `Weight should be at least ${minWeight}kg for ${equipmentType} exercises`,
      suggestedWeight: minWeight + 10
    };
  }
  
  if (reps < 3 || reps > 20) {
    return {
      isValid: false,
      message: 'Rep range should be between 3-20 for optimal training adaptation'
    };
  }
  
  // Check if weight seems reasonable for the rep range
  if (reps <= 5 && weight < 40) {
    return {
      isValid: false,
      message: 'For low rep ranges, consider using heavier weight',
      suggestedWeight: 50
    };
  }
  
  return { isValid: true };
}

/**
 * Calculate progression suggestions based on performance data
 */
export function calculateProgression(
  currentWeight: number,
  currentReps: number,
  lastSessionRPE: number,
  consecutiveSuccessfulSessions: number,
  goal: WorkoutGoal
): {
  shouldProgress: boolean;
  progressionType: 'weight' | 'reps';
  newWeight?: number;
  newReps?: number;
  reason: string;
} {
  // Base progression on RPE and consistency
  if (lastSessionRPE <= 7 && consecutiveSuccessfulSessions >= 2) {
    if (goal === 'strength') {
      // Strength: increase weight by 2.5-5kg
      const increment = currentWeight > 100 ? 5 : 2.5;
      return {
        shouldProgress: true,
        progressionType: 'weight',
        newWeight: currentWeight + increment,
        reason: `RPE ${lastSessionRPE} indicates room for progression. Ready for ${increment}kg increase.`
      };
    } else if (goal === 'hypertrophy') {
      // Hypertrophy: increase reps first, then weight
      if (currentReps < 12) {
        return {
          shouldProgress: true,
          progressionType: 'reps',
          newReps: currentReps + 1,
          reason: `RPE ${lastSessionRPE} allows for additional reps. Increase volume first.`
        };
      } else {
        return {
          shouldProgress: true,
          progressionType: 'weight',
          newWeight: currentWeight + 2.5,
          newReps: Math.max(8, currentReps - 2),
          reason: `Hit rep ceiling. Increase weight and reduce reps for continued progression.`
        };
      }
    }
  }
  
  return {
    shouldProgress: false,
    progressionType: 'weight',
    reason: consecutiveSuccessfulSessions < 2 
      ? 'Need more consistent performance before progressing'
      : `RPE ${lastSessionRPE} too high. Focus on form and consistency.`
  };
}