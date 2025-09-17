import { Timestamp } from 'firebase/firestore';
import { 
  getUserPerformanceRecords, 
  getUserProgressions, 
  getUserAnalytics,
  createPerformanceRecord,
  updateExerciseProgression,
  createWeeklyAnalytics,
  recordExerciseSubstitution,
  type Exercise,
  type WorkoutSession,
  type PerformanceRecord,
  type ExerciseProgression,
  type ProgressAnalytics
} from './firestore';

import { 
  ProgressiveOverloadEngine,
  type ProgressionSuggestion,
  analyzeWorkoutPerformance
} from './progressiveOverload';

import { 
  ExerciseSubstitutionEngine,
  type ExerciseAlternative,
  type EquipmentType
} from './exerciseSubstitution';

import { 
  PerformanceAnalyticsEngine,
  type ProgressAnalytics as FullProgressAnalytics
} from './performanceAnalytics';

import { UserProfile } from './userProfiles';

export interface WorkoutEnhancementData {
  progressionSuggestions: Record<string, ProgressionSuggestion>;
  exerciseAlternatives: Record<string, ExerciseAlternative[]>;
  performanceInsights: string[];
  readinessRecommendations: string[];
  volumeAnalysis: {
    currentWeekVolume: number;
    previousWeekVolume: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
  };
}

export class WorkoutEnhancementEngine {
  
  /**
   * Generate comprehensive workout enhancements for a user
   */
  static async generateWorkoutEnhancements(
    userId: string,
    userProfile: UserProfile,
    availableEquipment: EquipmentType[] = [],
    userReadiness?: {
      energyLevel: number;
      sleepQuality: number;
      musclesoreness: number;
      timeAvailable: number;
    }
  ): Promise<WorkoutEnhancementData> {
    
    // Fetch user data
    const [performanceRecords, progressions, analytics] = await Promise.all([
      getUserPerformanceRecords(userId),
      getUserProgressions(userId),
      getUserAnalytics(userId, 4) // Last 4 weeks
    ]);

    // Generate progression suggestions
    const progressionSuggestions: Record<string, ProgressionSuggestion> = {};
    for (const progression of progressions) {
      const suggestion = ProgressiveOverloadEngine.calculateProgressionSuggestion(
        {
          ...progression,
          recentPerformance: [] // Add empty array as default
        },
        userProfile.experience.trainingExperience as 'beginner' | 'intermediate' | 'advanced',
        this.classifyExerciseType(progression.exerciseName)
      );
      
      if (suggestion) {
        progressionSuggestions[progression.exerciseId] = suggestion;
      }
    }

    // Generate exercise alternatives
    const exerciseAlternatives: Record<string, ExerciseAlternative[]> = {};
    const commonExercises = this.extractCommonExercises(performanceRecords);
    
    for (const exerciseName of commonExercises) {
      const alternatives = ExerciseSubstitutionEngine.generateAlternatives(
        exerciseName,
        availableEquipment.length > 0 ? availableEquipment : ['dumbbells', 'barbell', 'bodyweight'],
        userProfile.experience.trainingExperience as 'beginner' | 'intermediate' | 'advanced',
        userProfile.health.limitations || [],
        {
          preferredEquipment: userProfile.experience.equipmentAccess?.map(access => {
            // Map EquipmentAccess to EquipmentType
            const mapping: Record<string, string> = {
              'none': 'bodyweight',
              'basic': 'dumbbells',
              'full-gym': 'barbell',
              'advanced': 'machines'
            };
            return mapping[access] || 'dumbbells';
          }) as EquipmentType[],
          avoidedMovements: userProfile.preferences.dislikedExercises || []
        }
      );
      
      if (alternatives.length > 0) {
        exerciseAlternatives[exerciseName] = alternatives;
      }
    }

    // Generate performance insights
    const performanceInsights = this.generatePerformanceInsights(
      performanceRecords,
      progressions.map(prog => prog),
      analytics
    );

    // Generate readiness recommendations
    const readinessRecommendations = userReadiness 
      ? this.generateReadinessRecommendations(userReadiness)
      : [];

    // Analyze volume trends
    const volumeAnalysis = this.analyzeVolumeProgression(analytics);

    return {
      progressionSuggestions,
      exerciseAlternatives,
      performanceInsights,
      readinessRecommendations,
      volumeAnalysis
    };
  }

  /**
   * Process workout completion with enhanced analytics
   */
  static async processWorkoutCompletion(
    userId: string,
    workoutSession: WorkoutSession,
    userProfile: UserProfile
  ): Promise<{
    performanceRecords: PerformanceRecord[];
    progressionUpdates: ExerciseProgression[];
    insights: string[];
  }> {
    const performanceRecords: PerformanceRecord[] = [];
    const progressionUpdates: ExerciseProgression[] = [];
    const insights: string[] = [];

    // Create performance records for each exercise
    for (const exercise of workoutSession.exercises) {
      if (exercise.isCompleted && exercise.weight && exercise.sets > 0) {
        const reps = parseInt(exercise.reps.split('-')[0]) || 0;
        
        const performanceRecord = await createPerformanceRecord(userId, {
          exerciseId: exercise.id,
          sessionDate: workoutSession.completedAt || workoutSession.startedAt,
          weight: exercise.weight,
          reps,
          sets: exercise.sets,
          rpe: exercise.rpe,
          formQuality: exercise.formQuality || 'good',
          restTime: exercise.restTime,
          wasProgression: false, // Will be updated based on progression analysis
          notes: exercise.notes
        });
        
        performanceRecords.push(performanceRecord);

        // Update exercise progression
        const existingProgression = await this.updateExerciseProgressionData(
          userId,
          exercise,
          performanceRecord,
          userProfile
        );
        
        if (existingProgression) {
          progressionUpdates.push(existingProgression);
        }
      }
    }

    // Generate insights based on performance
    insights.push(...this.generateSessionInsights(workoutSession, performanceRecords));

    return {
      performanceRecords,
      progressionUpdates,
      insights
    };
  }

  /**
   * Recommend exercise substitutions based on user context
   */
  static recommendExerciseSubstitutions(
    exerciseName: string,
    userProfile: UserProfile,
    reason: 'equipment' | 'injury' | 'preference' | 'progression',
    availableEquipment: EquipmentType[]
  ): ExerciseAlternative[] {
    return ExerciseSubstitutionEngine.generateAlternatives(
      exerciseName,
      availableEquipment,
      userProfile.experience.trainingExperience as 'beginner' | 'intermediate' | 'advanced',
      userProfile.health.limitations || [],
      {
        preferredEquipment: userProfile.experience.equipmentAccess?.map(access => {
          // Map EquipmentAccess to EquipmentType
          const mapping: Record<string, string> = {
            'none': 'bodyweight',
            'basic': 'dumbbells',
            'full-gym': 'barbell',
            'advanced': 'machines'
          };
          return mapping[access] || 'dumbbells';
        }) as EquipmentType[],
        avoidedMovements: userProfile.preferences.dislikedExercises || []
      }
    );
  }

  /**
   * Generate weekly analytics summary
   */
  static async generateWeeklyAnalytics(
    userId: string,
    weekEndDate: Date,
    userBodyWeight: number = 75
  ): Promise<ProgressAnalytics> {
    const weekStart = new Date(weekEndDate);
    weekStart.setDate(weekEndDate.getDate() - 7);

    // Get performance records for the week
    const performanceRecords = await getUserPerformanceRecords(userId);
    const weekRecords = performanceRecords.filter(record => {
      const recordDate = record.sessionDate.toDate();
      return recordDate >= weekStart && recordDate <= weekEndDate;
    });

    // Analyze strength metrics
    const strengthMetrics = PerformanceAnalyticsEngine
      .analyzeStrengthProgression(weekRecords, userBodyWeight)
      .map(metric => ({
        exerciseName: metric.exerciseName,
        oneRepMaxEstimate: metric.estimatedOneRepMax,
        strengthScore: metric.strengthScore,
        volumeLifted: metric.volume,
        sessionsCompleted: 1 // Simplified for weekly view
      }));

    // Analyze volume metrics
    const volumeProgression = PerformanceAnalyticsEngine.analyzeVolumeProgression(weekRecords);
    const weekVolume = volumeProgression.length > 0 ? volumeProgression[volumeProgression.length - 1] : {
      totalVolume: 0,
      muscleGroupVolumes: {},
      weeklyChange: 0
    };

    // Create analytics record
    return await createWeeklyAnalytics(userId, {
      weekEnding: Timestamp.fromDate(new Date(weekEndDate)),
      strengthMetrics,
      volumeMetrics: {
        totalVolume: weekVolume.totalVolume,
        muscleGroupVolumes: weekVolume.muscleGroupVolumes,
        weeklyVolumeChange: weekVolume.weeklyChange
      },
      consistencyMetrics: {
        scheduledWorkouts: 3, // This should be calculated based on user's program
        completedWorkouts: weekRecords.length,
        consistencyScore: weekRecords.length / 3, // Simplified calculation
        currentStreak: 1, // Would need to calculate from historical data
        longestStreak: 1 // Would need to calculate from historical data
      }
    });
  }

  // Helper methods
  private static classifyExerciseType(exerciseName: string): 'compound' | 'isolation' {
    const compoundKeywords = ['squat', 'deadlift', 'bench', 'press', 'row', 'pull-up', 'chin-up'];
    const name = exerciseName.toLowerCase();
    return compoundKeywords.some(keyword => name.includes(keyword)) ? 'compound' : 'isolation';
  }

  private static extractCommonExercises(performanceRecords: PerformanceRecord[]): string[] {
    const exerciseFrequency: Record<string, number> = {};
    
    performanceRecords.forEach(record => {
      exerciseFrequency[record.exerciseId] = (exerciseFrequency[record.exerciseId] || 0) + 1;
    });

    return Object.entries(exerciseFrequency)
      .filter(([_, frequency]) => frequency >= 3) // Exercises performed at least 3 times
      .map(([exerciseId, _]) => exerciseId)
      .slice(0, 10); // Top 10 most common exercises
  }

  private static generatePerformanceInsights(
    performanceRecords: PerformanceRecord[],
    progressions: ExerciseProgression[],
    analytics: ProgressAnalytics[]
  ): string[] {
    const insights: string[] = [];

    // Progression insights
    const progressingExercises = progressions.filter(p => p.nextSuggestion?.confidence === 'high');
    if (progressingExercises.length > 0) {
      insights.push(`${progressingExercises.length} exercises ready for progression`);
    }

    // Volume insights
    if (analytics.length >= 2) {
      const currentWeek = analytics[0];
      const previousWeek = analytics[1];
      const volumeChange = ((currentWeek.volumeMetrics.totalVolume - previousWeek.volumeMetrics.totalVolume) / previousWeek.volumeMetrics.totalVolume) * 100;
      
      if (volumeChange > 10) {
        insights.push('Training volume increased significantly - monitor recovery');
      } else if (volumeChange < -10) {
        insights.push('Training volume decreased - consider intensity adjustments');
      }
    }

    // Consistency insights
    if (analytics.length > 0) {
      const consistency = analytics[0].consistencyMetrics.consistencyScore;
      if (consistency >= 0.9) {
        insights.push('Excellent workout consistency maintained');
      } else if (consistency < 0.7) {
        insights.push('Consistency could be improved for better results');
      }
    }

    return insights;
  }

  private static generateReadinessRecommendations(readiness: {
    energyLevel: number;
    sleepQuality: number;
    musclesoreness: number;
    timeAvailable: number;
  }): string[] {
    const recommendations: string[] = [];

    if (readiness.energyLevel < 5) {
      recommendations.push('Consider reducing intensity by 10-15% due to low energy');
    }

    if (readiness.sleepQuality < 6) {
      recommendations.push('Poor sleep may affect performance - prioritize recovery exercises');
    }

    if (readiness.musclesoreness >= 7) {
      recommendations.push('High soreness detected - focus on mobility and light movement');
    }

    if (readiness.timeAvailable < 45) {
      recommendations.push('Limited time available - consider compound movements for efficiency');
    }

    return recommendations;
  }

  private static analyzeVolumeProgression(analytics: ProgressAnalytics[]): {
    currentWeekVolume: number;
    previousWeekVolume: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
  } {
    if (analytics.length < 2) {
      return {
        currentWeekVolume: analytics[0]?.volumeMetrics.totalVolume || 0,
        previousWeekVolume: 0,
        trend: 'stable',
        recommendation: 'Need more data for trend analysis'
      };
    }

    const current = analytics[0].volumeMetrics.totalVolume;
    const previous = analytics[1].volumeMetrics.totalVolume;
    const change = ((current - previous) / previous) * 100;

    let trend: 'increasing' | 'stable' | 'decreasing';
    let recommendation: string;

    if (change > 5) {
      trend = 'increasing';
      recommendation = 'Good progression! Monitor recovery and adjust if needed';
    } else if (change < -5) {
      trend = 'decreasing';
      recommendation = 'Volume declining - consider motivation and program adherence';
    } else {
      trend = 'stable';
      recommendation = 'Stable volume maintained - consider progressive overload';
    }

    return {
      currentWeekVolume: current,
      previousWeekVolume: previous,
      trend,
      recommendation
    };
  }

  private static async updateExerciseProgressionData(
    userId: string,
    exercise: Exercise,
    performanceRecord: PerformanceRecord,
    userProfile: UserProfile
  ): Promise<ExerciseProgression | null> {
    try {
      // This would fetch existing progression and update it
      // Simplified implementation for now
      const progression = await updateExerciseProgression(userId, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        currentWeight: exercise.weight,
        currentReps: exercise.reps,
        currentSets: exercise.sets,
        weeksSinceProgression: 0, // Would be calculated from last progression date
        totalSessions: 1, // Would be incremented from existing data
        successfulSessions: exercise.isCompleted ? 1 : 0,
        progressionHistory: [] // Would include historical data
      });

      return progression;
    } catch (error) {
      console.error('Error updating exercise progression:', error);
      return null;
    }
  }

  private static generateSessionInsights(
    session: WorkoutSession,
    performanceRecords: PerformanceRecord[]
  ): string[] {
    const insights: string[] = [];

    const completedExercises = session.exercises.filter(e => e.isCompleted);
    const completionRate = completedExercises.length / session.exercises.length;

    if (completionRate >= 0.95) {
      insights.push('Excellent workout completion!');
    } else if (completionRate < 0.8) {
      insights.push('Consider adjusting workout intensity or volume');
    }

    const averageRPE = performanceRecords
      .filter(r => r.rpe)
      .reduce((sum, r) => sum + (r.rpe || 0), 0) / performanceRecords.length;

    if (averageRPE >= 9) {
      insights.push('High intensity session - ensure adequate recovery');
    } else if (averageRPE <= 6) {
      insights.push('Moderate intensity - consider progressive overload opportunities');
    }

    return insights;
  }
}

// Export convenience functions
export async function getWorkoutEnhancements(
  userId: string,
  userProfile: UserProfile,
  availableEquipment: EquipmentType[] = []
): Promise<WorkoutEnhancementData> {
  return WorkoutEnhancementEngine.generateWorkoutEnhancements(userId, userProfile, availableEquipment);
}

export async function processCompletedWorkout(
  userId: string,
  workoutSession: WorkoutSession,
  userProfile: UserProfile
) {
  return WorkoutEnhancementEngine.processWorkoutCompletion(userId, workoutSession, userProfile);
}

export function getExerciseAlternatives(
  exerciseName: string,
  userProfile: UserProfile,
  availableEquipment: EquipmentType[]
): ExerciseAlternative[] {
  return WorkoutEnhancementEngine.recommendExerciseSubstitutions(
    exerciseName,
    userProfile,
    'equipment',
    availableEquipment
  );
}