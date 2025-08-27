// Research-Based Workout Integration
// Utilities to integrate research-based protocols with existing database and UI

import { 
  Exercise, 
  PerformanceRecord, 
  createPerformanceRecord,
  updateExercise 
} from './firestore';
import { 
  createExerciseProtocol,
  validateComfortableWeight,
  calculateProgression,
  type ExerciseProtocol,
  type EquipmentType,
  type WorkoutGoal,
  type WarmupSet,
  type WorkingSet
} from './researchBasedWorkout';
import { Timestamp } from 'firebase/firestore';

/**
 * Convert research-based protocol to firestore Exercise format
 */
export function convertProtocolToExercise(
  protocol: ExerciseProtocol,
  exerciseId: string,
  workoutId: string
): Partial<Exercise> {
  return {
    id: exerciseId,
    workoutId,
    name: protocol.exerciseName,
    sets: protocol.warmupSets.length + protocol.workingSets.length,
    reps: `${protocol.targetReps}`,
    weight: protocol.workingWeight,
    restTime: protocol.workingSets[0]?.restTime || 180,
    targetMuscles: protocol.muscleActivation,
    workingWeight: protocol.workingWeight,
    equipmentType: protocol.equipmentType,
    trainingGoal: protocol.goal,
    formCues: protocol.formCues,
    calculationMethod: 'research-based',
    warmupProtocol: {
      sets: protocol.warmupSets.map(set => ({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
        percentage: set.percentage,
        restTime: set.restTime,
        description: set.description,
        stage: set.stage,
        isCompleted: false
      }))
    },
    workingSetProtocol: {
      sets: protocol.workingSets.map(set => ({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
        restTime: set.restTime,
        description: set.description,
        targetRPE: set.targetRPE,
        isCompleted: false
      }))
    }
  };
}

/**
 * Generate research-based protocol from user input
 */
export async function generateProtocolFromUserInput(
  exerciseName: string,
  comfortableWeight: number,
  comfortableReps: number,
  equipmentType: EquipmentType,
  goal: WorkoutGoal,
  muscleActivation: string[] = [],
  formCues: string[] = []
): Promise<{ success: boolean; protocol?: ExerciseProtocol; error?: string }> {
  // Validate user input
  const validation = validateComfortableWeight(
    exerciseName,
    comfortableWeight,
    comfortableReps,
    equipmentType
  );

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.message
    };
  }

  // Create research-based protocol
  const protocol = createExerciseProtocol(
    exerciseName,
    comfortableWeight,
    comfortableReps,
    equipmentType,
    goal,
    muscleActivation,
    formCues
  );

  return {
    success: true,
    protocol
  };
}

/**
 * Update exercise with research-based protocol
 */
export async function updateExerciseWithProtocol(
  userId: string,
  exercise: Exercise,
  protocol: ExerciseProtocol
): Promise<boolean> {
  try {
    const updatedExercise = {
      ...exercise,
      ...convertProtocolToExercise(protocol, exercise.id, exercise.workoutId)
    };

    await updateExercise(userId, updatedExercise as Exercise);
    return true;
  } catch (error) {
    console.error('Error updating exercise with protocol:', error);
    return false;
  }
}

/**
 * Get workout readiness based on recent performance
 */
export function assessWorkoutReadiness(
  recentPerformance: PerformanceRecord[],
  sleepQuality: number = 8,
  energyLevel: number = 7,
  musclesoreness: number = 3
): {
  readiness: 'excellent' | 'good' | 'moderate' | 'poor';
  recommendations: string[];
  suggestedIntensity: number; // 0.7-1.1 multiplier for working weights
} {
  let readinessScore = 0;
  const recommendations: string[] = [];

  // Sleep quality assessment (30% weight)
  if (sleepQuality >= 8) readinessScore += 30;
  else if (sleepQuality >= 6) readinessScore += 20;
  else if (sleepQuality >= 4) readinessScore += 10;
  else recommendations.push("Poor sleep detected - consider lighter intensity today");

  // Energy level assessment (25% weight)  
  if (energyLevel >= 8) readinessScore += 25;
  else if (energyLevel >= 6) readinessScore += 18;
  else if (energyLevel >= 4) readinessScore += 10;
  else recommendations.push("Low energy - focus on movement quality over intensity");

  // Muscle soreness assessment (20% weight)
  if (musclesoreness <= 2) readinessScore += 20;
  else if (musclesoreness <= 4) readinessScore += 15;
  else if (musclesoreness <= 6) readinessScore += 8;
  else recommendations.push("High muscle soreness - extend warm-up and reduce intensity");

  // Recent performance trend (25% weight)
  if (recentPerformance.length >= 2) {
    const recentAvgRPE = recentPerformance.slice(0, 3)
      .reduce((sum, record) => sum + (record.rpe || 7), 0) / Math.min(3, recentPerformance.length);
    
    if (recentAvgRPE <= 7) readinessScore += 25;
    else if (recentAvgRPE <= 8) readinessScore += 18;
    else if (recentAvgRPE <= 9) readinessScore += 10;
    else recommendations.push("Recent high RPE sessions - consider deload or rest day");
  } else {
    readinessScore += 15; // Neutral score for new users
  }

  // Determine readiness level and intensity
  let readiness: 'excellent' | 'good' | 'moderate' | 'poor';
  let suggestedIntensity: number;

  if (readinessScore >= 85) {
    readiness = 'excellent';
    suggestedIntensity = 1.05; // 5% increase
    recommendations.unshift("You're primed for a great workout! Consider pushing intensity.");
  } else if (readinessScore >= 65) {
    readiness = 'good';
    suggestedIntensity = 1.0; // Normal intensity
    recommendations.unshift("Good readiness - stick to planned weights and intensities.");
  } else if (readinessScore >= 45) {
    readiness = 'moderate';
    suggestedIntensity = 0.9; // 10% reduction
    recommendations.unshift("Moderate readiness - consider reducing weight by 10%.");
  } else {
    readiness = 'poor';
    suggestedIntensity = 0.75; // 25% reduction
    recommendations.unshift("Poor readiness - focus on movement and recovery today.");
  }

  return {
    readiness,
    recommendations,
    suggestedIntensity
  };
}

/**
 * Smart progression suggestions based on research-based protocols
 */
export function getSmartProgression(
  exercise: Exercise,
  recentPerformance: PerformanceRecord[],
  currentProtocol?: ExerciseProtocol
): {
  shouldProgress: boolean;
  newProtocol?: ExerciseProtocol;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
} {
  if (!exercise.workingWeight || !exercise.trainingGoal) {
    return {
      shouldProgress: false,
      reason: 'Missing exercise data for progression calculation',
      confidence: 'low'
    };
  }

  // Get recent performance data
  const recentSessions = recentPerformance.slice(0, 3);
  const avgRPE = recentSessions.reduce((sum, session) => sum + (session.rpe || 7), 0) / recentSessions.length;
  const consecutiveSuccessful = recentSessions.filter(session => session.formQuality !== 'poor').length;

  // Use research-based progression logic
  const progression = calculateProgression(
    exercise.workingWeight,
    parseInt(exercise.reps),
    avgRPE,
    consecutiveSuccessful,
    exercise.trainingGoal
  );

  if (progression.shouldProgress && (progression.newWeight || progression.newReps)) {
    // Generate new protocol with progressed weights/reps
    const newWeight = progression.newWeight || exercise.workingWeight;
    const newReps = progression.newReps || parseInt(exercise.reps);
    
    const newProtocol = createExerciseProtocol(
      exercise.name,
      newWeight,
      newReps,
      exercise.equipmentType || 'barbell',
      exercise.trainingGoal,
      exercise.targetMuscles || [],
      exercise.formCues || []
    );

    return {
      shouldProgress: true,
      newProtocol,
      reason: progression.reason,
      confidence: avgRPE <= 7 && consecutiveSuccessful >= 2 ? 'high' : 'medium'
    };
  }

  return {
    shouldProgress: false,
    reason: progression.reason,
    confidence: 'medium'
  };
}

/**
 * Generate user-friendly workout summary with research insights
 */
export function generateWorkoutSummary(
  exercises: Exercise[],
  protocols: ExerciseProtocol[]
): {
  totalEstimatedTime: number;
  warmupSets: number;
  workingSets: number;
  intensityDistribution: {
    strength: number;
    hypertrophy: number;
    endurance: number;
  };
  equipmentNeeded: string[];
  keyInsights: string[];
} {
  const totalWarmupSets = protocols.reduce((sum, p) => sum + p.warmupSets.length, 0);
  const totalWorkingSets = protocols.reduce((sum, p) => sum + p.workingSets.length, 0);
  const totalTime = protocols.reduce((sum, p) => sum + p.totalEstimatedTime, 0);

  const intensityDistribution = {
    strength: protocols.filter(p => p.goal === 'strength').length,
    hypertrophy: protocols.filter(p => p.goal === 'hypertrophy').length,
    endurance: protocols.filter(p => p.goal === 'endurance').length
  };

  const equipmentNeeded = [...new Set(protocols.map(p => p.equipmentType))];

  const keyInsights = [
    `${totalWarmupSets} research-based warm-up sets to optimize performance`,
    `${totalWorkingSets} working sets with scientific rest periods`,
    intensityDistribution.strength > 0 ? 
      `${intensityDistribution.strength} strength-focused exercise(s) with 3-5 minute rest periods` : '',
    intensityDistribution.hypertrophy > 0 ? 
      `${intensityDistribution.hypertrophy} hypertrophy exercise(s) with 60-90 second rest periods` : '',
    `Total estimated time: ${totalTime} minutes including optimal recovery periods`
  ].filter(insight => insight.length > 0);

  return {
    totalEstimatedTime: totalTime,
    warmupSets: totalWarmupSets,
    workingSets: totalWorkingSets,
    intensityDistribution,
    equipmentNeeded,
    keyInsights
  };
}

/**
 * Quick setup for exercises - simplified research-based protocol generation
 */
export async function quickExerciseSetup(
  exerciseName: string,
  lastKnownWeight?: number,
  userGoal: WorkoutGoal = 'strength'
): Promise<ExerciseProtocol> {
  // Use previous weight or reasonable defaults
  const workingWeight = lastKnownWeight || getDefaultWeight(exerciseName);
  const targetReps = userGoal === 'strength' ? 6 : userGoal === 'hypertrophy' ? 10 : 15;
  const equipmentType = inferEquipmentType(exerciseName);

  return createExerciseProtocol(
    exerciseName,
    workingWeight,
    targetReps,
    equipmentType,
    userGoal
  );
}

/**
 * Get reasonable default weights for common exercises
 */
function getDefaultWeight(exerciseName: string): number {
  const defaults = {
    'bench press': 60,
    'squat': 80,
    'deadlift': 100,
    'overhead press': 40,
    'barbell row': 60,
    'incline press': 50,
    'dumbbell press': 25, // per dumbbell
    'dumbbell row': 20,
    'bicep curl': 15,
    'tricep extension': 20
  };

  const exerciseLower = exerciseName.toLowerCase();
  for (const [exercise, weight] of Object.entries(defaults)) {
    if (exerciseLower.includes(exercise)) {
      return weight;
    }
  }

  return 40; // Conservative default
}

/**
 * Infer equipment type from exercise name
 */
function inferEquipmentType(exerciseName: string): EquipmentType {
  const exerciseLower = exerciseName.toLowerCase();
  
  if (exerciseLower.includes('dumbbell')) return 'dumbbell';
  if (exerciseLower.includes('machine')) return 'machine';
  if (exerciseLower.includes('bodyweight') || exerciseLower.includes('push-up') || exerciseLower.includes('pull-up')) {
    return 'bodyweight';
  }
  
  return 'barbell'; // Default to barbell
}

export default {
  convertProtocolToExercise,
  generateProtocolFromUserInput,
  updateExerciseWithProtocol,
  assessWorkoutReadiness,
  getSmartProgression,
  generateWorkoutSummary,
  quickExerciseSetup
};