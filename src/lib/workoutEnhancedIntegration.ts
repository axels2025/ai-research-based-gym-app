// Integration functions for research-based workouts with existing Firebase structure
import { 
  Exercise,
  createWorkoutSession,
  updateWorkoutSession,
  createPerformanceRecord,
  type WorkoutSession 
} from './firestore';
import { 
  createExerciseProtocol,
  type ExerciseProtocol,
  type WarmupSet,
  type WorkingSet 
} from './researchBasedWorkout';
import { Timestamp } from 'firebase/firestore';

/**
 * Convert ExerciseProtocol to enhanced Exercise format for Firebase storage
 */
export function protocolToFirebaseExercise(
  exerciseId: string,
  workoutId: string,
  protocol: ExerciseProtocol
): Exercise {
  return {
    id: exerciseId,
    workoutId,
    name: protocol.exerciseName,
    sets: protocol.warmupSets.length + protocol.workingSets.length,
    reps: protocol.workingSets[0]?.reps?.toString() || '8',
    weight: protocol.workingWeight,
    restTime: protocol.workingSets[0]?.restTime || 180,
    isCompleted: false,
    
    // Enhanced fields
    workingWeight: protocol.workingWeight,
    equipmentType: protocol.equipmentType,
    trainingGoal: protocol.goal,
    muscleActivation: protocol.muscleActivation,
    formCues: protocol.formCues,
    
    // Research-based protocol data
    warmupProtocol: {
      sets: protocol.warmupSets.map(set => ({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
        percentage: set.percentage,
        restTime: set.restTime,
        description: set.description,
        stage: set.stage,
        isCompleted: false,
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
        isCompleted: false,
      }))
    },
    calculationMethod: 'research-based',
    lastComfortableWeight: {
      weight: protocol.workingWeight,
      reps: protocol.targetReps,
      date: Timestamp.now(),
    }
  };
}

/**
 * Convert Firebase Exercise back to ExerciseProtocol for workout execution
 */
export function firebaseExerciseToProtocol(exercise: Exercise): ExerciseProtocol | null {
  if (!exercise.warmupProtocol || !exercise.workingSetProtocol) {
    return null;
  }

  const warmupSets: WarmupSet[] = exercise.warmupProtocol.sets.map(set => ({
    id: set.id,
    weight: set.weight,
    reps: set.reps,
    percentage: set.percentage,
    restTime: set.restTime,
    description: set.description,
    type: 'warmup',
    stage: set.stage
  }));

  const workingSets: WorkingSet[] = exercise.workingSetProtocol.sets.map(set => ({
    id: set.id,
    weight: set.weight,
    reps: set.reps,
    restTime: set.restTime,
    description: set.description,
    type: 'working',
    targetRPE: set.targetRPE
  }));

  return {
    exerciseName: exercise.name,
    equipmentType: exercise.equipmentType || 'barbell',
    workingWeight: exercise.workingWeight || exercise.weight || 0,
    targetReps: exercise.lastComfortableWeight?.reps || 8,
    goal: exercise.trainingGoal || 'strength',
    warmupSets,
    workingSets,
    totalEstimatedTime: Math.round((
      warmupSets.reduce((sum, set) => sum + set.restTime, 0) +
      workingSets.reduce((sum, set) => sum + set.restTime, 0) +
      (warmupSets.length + workingSets.length) * 45 // execution time
    ) / 60),
    muscleActivation: exercise.muscleActivation || [],
    formCues: exercise.formCues || []
  };
}

/**
 * Create a complete workout session with research-based data
 */
export async function createEnhancedWorkoutSession(
  userId: string,
  workoutId: string,
  exercises: Exercise[]
): Promise<WorkoutSession> {
  const session = await createWorkoutSession(userId, {
    workoutId,
    startedAt: Timestamp.now(),
    exercises: exercises.map(ex => ({ ...ex, isCompleted: false })),
    exercisesCompleted: 0,
    // Enhanced fields for research-based tracking
    energyLevelPre: undefined,
    energyLevelPost: undefined,
    sleepQuality: undefined,
    musclesoreness: undefined,
    sessionRPE: undefined,
    totalVolume: 0,
    averageRestTime: 0,
    exercisesSkipped: [],
    substitutionsMade: []
  });

  return session;
}

/**
 * Record individual set completion with research-based data
 */
export async function recordSetCompletion(
  userId: string,
  sessionId: string,
  exerciseId: string,
  setData: {
    setId: string;
    setType: 'warmup' | 'working';
    weight: number;
    reps: number;
    rpe?: number;
    restTime: number;
    stage?: 'movement-prep' | 'activation' | 'potentiation';
  }
) {
  // Only record performance data for working sets
  if (setData.setType === 'working') {
    await createPerformanceRecord(userId, {
      exerciseId,
      sessionDate: Timestamp.now(),
      weight: setData.weight,
      reps: setData.reps,
      sets: 1,
      rpe: setData.rpe,
      formQuality: 'good', // Could be enhanced with user input
      restTime: setData.restTime,
      wasProgression: false, // Could be calculated based on previous performance
    });
  }

  // Update the session with set completion
  // This would typically update the specific set in the session's exercise data
  // For now, we'll increment the completion counters
  await updateWorkoutSession(sessionId, {
    // Would update specific set completion status in the exercises array
  });
}

/**
 * Calculate workout summary statistics
 */
export function calculateWorkoutSummary(
  completedSets: Array<{
    exerciseId: string;
    setId: string;
    weight: number;
    reps: number;
    setType: 'warmup' | 'working';
    rpe?: number;
  }>
) {
  const workingSets = completedSets.filter(set => set.setType === 'working');
  const warmupSets = completedSets.filter(set => set.setType === 'warmup');

  const totalVolume = workingSets.reduce((sum, set) => {
    return sum + (set.weight * set.reps);
  }, 0);

  const averageRPE = workingSets.reduce((sum, set, _, arr) => {
    return sum + (set.rpe || 0) / arr.length;
  }, 0);

  const averageWorkingWeight = workingSets.reduce((sum, set, _, arr) => {
    return sum + set.weight / arr.length;
  }, 0);

  return {
    totalSets: completedSets.length,
    workingSets: workingSets.length,
    warmupSets: warmupSets.length,
    totalVolume: Math.round(totalVolume),
    averageRPE: Math.round(averageRPE * 10) / 10,
    averageWorkingWeight: Math.round(averageWorkingWeight * 10) / 10,
    exercises: [...new Set(completedSets.map(set => set.exerciseId))].length
  };
}

/**
 * Generate progression suggestions based on completed workout data
 */
export function generateProgressionSuggestions(
  exerciseId: string,
  completedSets: Array<{
    weight: number;
    reps: number;
    rpe?: number;
    setType: 'warmup' | 'working';
  }>,
  previousSessions?: Array<{
    weight: number;
    reps: number;
    rpe?: number;
  }>
): {
  shouldProgress: boolean;
  progressionType: 'weight' | 'reps';
  suggestion: string;
  newWeight?: number;
  newReps?: number;
} {
  const workingSets = completedSets.filter(set => set.setType === 'working');
  
  if (workingSets.length === 0) {
    return {
      shouldProgress: false,
      progressionType: 'weight',
      suggestion: 'Complete working sets to receive progression recommendations'
    };
  }

  const averageRPE = workingSets.reduce((sum, set) => sum + (set.rpe || 8), 0) / workingSets.length;
  const currentWeight = workingSets[0].weight;
  const currentReps = workingSets[0].reps;

  // Simple progression logic - could be enhanced with more complex algorithms
  if (averageRPE <= 7) {
    // RPE too low - can progress
    return {
      shouldProgress: true,
      progressionType: 'weight',
      suggestion: 'RPE indicates room for progression. Increase weight by 2.5kg.',
      newWeight: currentWeight + 2.5
    };
  } else if (averageRPE >= 9.5) {
    // RPE too high - reduce load or increase recovery
    return {
      shouldProgress: false,
      progressionType: 'weight',
      suggestion: 'High RPE indicates fatigue. Maintain current weight and focus on form.'
    };
  } else {
    // RPE in good range - maintain for consistency
    return {
      shouldProgress: false,
      progressionType: 'weight',
      suggestion: 'Perfect RPE range. Maintain current load for 1-2 more sessions before progressing.'
    };
  }
}

/**
 * Export workout data for analysis or sharing
 */
export function exportWorkoutData(
  workoutSession: WorkoutSession,
  completedSets: Array<{
    exerciseId: string;
    setId: string;
    weight: number;
    reps: number;
    setType: 'warmup' | 'working';
    rpe?: number;
  }>
) {
  const summary = calculateWorkoutSummary(completedSets);
  
  return {
    date: workoutSession.startedAt,
    duration: workoutSession.duration,
    exercises: workoutSession.exercises.map(exercise => ({
      name: exercise.name,
      protocol: exercise.calculationMethod === 'research-based' ? 'Research-Based' : 'Standard',
      sets: completedSets.filter(set => set.exerciseId === exercise.id),
      muscleActivation: exercise.muscleActivation,
      equipment: exercise.equipmentType
    })),
    summary,
    notes: workoutSession.notes
  };
}