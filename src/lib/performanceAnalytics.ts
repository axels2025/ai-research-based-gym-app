import { Timestamp } from 'firebase/firestore';
import { PerformanceRecord, ExerciseProgression } from './progressiveOverload';

export interface StrengthMetric {
  exerciseName: string;
  date: Date;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  volume: number; // weight × reps × sets
  strengthScore: number; // normalized score 0-100
}

export interface VolumeMetric {
  date: Date;
  totalVolume: number;
  muscleGroupVolumes: Record<string, number>;
  exerciseVolumes: Record<string, number>;
  weeklyChange: number; // percentage change from previous week
}

export interface BodyMetric {
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface ProgressionPrediction {
  exerciseName: string;
  timeframe: 'week' | 'month' | 'quarter';
  predictedWeight: number;
  confidence: number; // 0-1
  factors: string[];
  recommendations: string[];
}

export interface ConsistencyMetric {
  period: 'week' | 'month' | 'quarter';
  scheduledWorkouts: number;
  completedWorkouts: number;
  consistency: number; // 0-1
  streaks: {
    current: number;
    longest: number;
  };
  missedWorkoutReasons?: Record<string, number>;
}

export interface ProgressAnalytics {
  strengthProgression: StrengthMetric[];
  volumeProgression: VolumeMetric[];
  consistencyScore: ConsistencyMetric;
  bodyCompositionTrends: BodyMetric[];
  predictiveInsights: ProgressionPrediction[];
  performancePhases: {
    phase: 'adaptation' | 'progress' | 'plateau' | 'peak';
    startDate: Date;
    duration: number; // days
    characteristics: string[];
  }[];
  recoveryMetrics: {
    averageRestBetweenSets: number;
    sleepQualityTrend: number[];
    rpeProgression: number[];
    injuryRisk: 'low' | 'moderate' | 'high';
  };
}

export class PerformanceAnalyticsEngine {
  
  static calculateOneRepMax(weight: number, reps: number): number {
    if (reps === 1) return weight;
    // Using Epley formula: 1RM = weight × (1 + reps/30)
    return Math.round(weight * (1 + reps / 30));
  }

  static calculateStrengthScore(
    currentOneRepMax: number, 
    bodyWeight: number, 
    exerciseType: 'squat' | 'bench' | 'deadlift' | 'press' | 'other'
  ): number {
    // Strength standards relative to bodyweight
    const standards = {
      squat: { untrained: 0.5, novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.25 },
      deadlift: { untrained: 0.75, novice: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
      bench: { untrained: 0.5, novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 1.75 },
      press: { untrained: 0.3, novice: 0.5, intermediate: 0.75, advanced: 1.0, elite: 1.25 },
      other: { untrained: 0.25, novice: 0.5, intermediate: 0.75, advanced: 1.0, elite: 1.25 }
    };

    const ratio = currentOneRepMax / bodyWeight;
    const standard = standards[exerciseType];
    
    if (ratio >= standard.elite) return 100;
    if (ratio >= standard.advanced) return 85;
    if (ratio >= standard.intermediate) return 70;
    if (ratio >= standard.novice) return 50;
    if (ratio >= standard.untrained) return 30;
    return Math.max(10, (ratio / standard.untrained) * 30);
  }

  static analyzeStrengthProgression(
    performanceRecords: PerformanceRecord[],
    bodyWeight: number
  ): StrengthMetric[] {
    const exerciseGroups = this.groupRecordsByExercise(performanceRecords);
    const strengthMetrics: StrengthMetric[] = [];

    Object.entries(exerciseGroups).forEach(([exerciseName, records]) => {
      records.forEach(record => {
        if (record.weight && record.reps > 0) {
          const oneRepMax = this.calculateOneRepMax(record.weight, record.reps);
          const exerciseType = this.classifyExerciseType(exerciseName);
          const strengthScore = this.calculateStrengthScore(oneRepMax, bodyWeight, exerciseType);
          const volume = record.weight * record.reps * record.sets;

          strengthMetrics.push({
            exerciseName,
            date: record.sessionDate.toDate(),
            weight: record.weight,
            reps: record.reps,
            estimatedOneRepMax: oneRepMax,
            volume,
            strengthScore
          });
        }
      });
    });

    return strengthMetrics.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static analyzeVolumeProgression(
    performanceRecords: PerformanceRecord[]
  ): VolumeMetric[] {
    const weeklyGroups = this.groupRecordsByWeek(performanceRecords);
    const volumeMetrics: VolumeMetric[] = [];
    let previousVolume = 0;

    weeklyGroups.forEach(({ week, records }) => {
      const totalVolume = records.reduce((sum, record) => {
        return sum + (record.weight || 0) * record.reps * record.sets;
      }, 0);

      const muscleGroupVolumes: Record<string, number> = {};
      const exerciseVolumes: Record<string, number> = {};

      records.forEach(record => {
        const volume = (record.weight || 0) * record.reps * record.sets;
        
        // Muscle group volume (simplified mapping)
        const muscleGroups = this.getMuscleGroupsForExercise(record.exerciseId);
        muscleGroups.forEach(muscle => {
          muscleGroupVolumes[muscle] = (muscleGroupVolumes[muscle] || 0) + volume;
        });

        // Exercise volume
        exerciseVolumes[record.exerciseId] = (exerciseVolumes[record.exerciseId] || 0) + volume;
      });

      const weeklyChange = previousVolume > 0 
        ? ((totalVolume - previousVolume) / previousVolume) * 100 
        : 0;

      volumeMetrics.push({
        date: week,
        totalVolume,
        muscleGroupVolumes,
        exerciseVolumes,
        weeklyChange
      });

      previousVolume = totalVolume;
    });

    return volumeMetrics;
  }

  static analyzeConsistency(
    workoutSessions: Array<{ date: Date; completed: boolean; reason?: string }>,
    scheduledWorkouts: number
  ): ConsistencyMetric {
    const completedWorkouts = workoutSessions.filter(session => session.completed).length;
    const consistency = completedWorkouts / scheduledWorkouts;
    
    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedSessions = [...workoutSessions].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    for (let i = sortedSessions.length - 1; i >= 0; i--) {
      if (sortedSessions[i].completed) {
        tempStreak++;
        if (i === sortedSessions.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Analyze missed workout reasons
    const missedWorkoutReasons: Record<string, number> = {};
    workoutSessions.forEach(session => {
      if (!session.completed && session.reason) {
        missedWorkoutReasons[session.reason] = (missedWorkoutReasons[session.reason] || 0) + 1;
      }
    });

    return {
      period: 'month',
      scheduledWorkouts,
      completedWorkouts,
      consistency,
      streaks: {
        current: currentStreak,
        longest: longestStreak
      },
      missedWorkoutReasons
    };
  }

  static predictProgression(
    strengthMetrics: StrengthMetric[],
    exerciseName: string,
    timeframe: 'week' | 'month' | 'quarter'
  ): ProgressionPrediction | null {
    const exerciseMetrics = strengthMetrics
      .filter(metric => metric.exerciseName === exerciseName)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (exerciseMetrics.length < 3) return null; // Need at least 3 data points

    // Simple linear regression on 1RM progression
    const dataPoints = exerciseMetrics.map((metric, index) => ({
      x: index,
      y: metric.estimatedOneRepMax
    }));

    const { slope, intercept, rSquared } = this.linearRegression(dataPoints);
    
    // Predict future values
    const timeMultiplier = { week: 1, month: 4, quarter: 12 }[timeframe];
    const futureX = exerciseMetrics.length + timeMultiplier;
    const predictedWeight = Math.max(intercept + slope * futureX, 0);
    
    const factors = [];
    const recommendations = [];
    
    if (slope > 0) {
      factors.push('Positive progression trend detected');
      recommendations.push('Continue current programming');
    } else {
      factors.push('Plateau or declining trend detected');
      recommendations.push('Consider program variation or deload');
    }

    if (rSquared < 0.5) {
      factors.push('High variability in performance');
      recommendations.push('Focus on consistency in training');
    }

    return {
      exerciseName,
      timeframe,
      predictedWeight: Math.round(predictedWeight),
      confidence: Math.max(0.1, Math.min(0.9, rSquared)),
      factors,
      recommendations
    };
  }

  static identifyPerformancePhases(
    strengthMetrics: StrengthMetric[]
  ): Array<{ phase: 'adaptation' | 'progress' | 'plateau' | 'peak'; startDate: Date; duration: number; characteristics: string[] }> {
    // Simplified phase detection based on strength progression patterns
    const phases: Array<{ phase: 'adaptation' | 'progress' | 'plateau' | 'peak'; startDate: Date; duration: number; characteristics: string[] }> = [];
    
    if (strengthMetrics.length === 0) return phases;

    // Group by 2-week periods
    const periods = this.groupMetricsByPeriod(strengthMetrics, 14); // 14 days
    
    periods.forEach((period, index) => {
      const avgStrength = period.reduce((sum, metric) => sum + metric.strengthScore, 0) / period.length;
      const previousAvg = index > 0 ? 
        periods[index - 1].reduce((sum, metric) => sum + metric.strengthScore, 0) / periods[index - 1].length : 
        0;
      
      const improvement = previousAvg > 0 ? ((avgStrength - previousAvg) / previousAvg) * 100 : 0;
      
      let phase: 'adaptation' | 'progress' | 'plateau' | 'peak';
      const characteristics: string[] = [];
      
      if (index === 0 || improvement > 5) {
        phase = 'progress';
        characteristics.push('Significant strength gains');
      } else if (Math.abs(improvement) <= 2) {
        phase = 'plateau';
        characteristics.push('Minimal strength changes');
      } else if (improvement > 2) {
        phase = 'progress';
        characteristics.push('Steady improvement');
      } else {
        phase = 'adaptation';
        characteristics.push('Performance stabilization');
      }

      if (avgStrength > 85) {
        phase = 'peak';
        characteristics.push('High performance level achieved');
      }

      phases.push({
        phase,
        startDate: period[0].date,
        duration: 14,
        characteristics
      });
    });

    return phases;
  }

  static generateProgressReport(
    analytics: ProgressAnalytics
  ): {
    summary: string;
    highlights: string[];
    concerns: string[];
    recommendations: string[];
  } {
    const highlights: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Consistency analysis
    if (analytics.consistencyScore.consistency >= 0.8) {
      highlights.push(`Excellent consistency: ${Math.round(analytics.consistencyScore.consistency * 100)}% workout completion rate`);
    } else if (analytics.consistencyScore.consistency < 0.6) {
      concerns.push(`Low consistency: Only ${Math.round(analytics.consistencyScore.consistency * 100)}% of workouts completed`);
      recommendations.push('Focus on establishing a sustainable workout routine');
    }

    // Strength progression analysis
    const recentStrengthMetrics = analytics.strengthProgression.slice(-8); // Last 8 records
    if (recentStrengthMetrics.length >= 2) {
      const firstMetric = recentStrengthMetrics[0];
      const lastMetric = recentStrengthMetrics[recentStrengthMetrics.length - 1];
      const strengthImprovement = ((lastMetric.strengthScore - firstMetric.strengthScore) / firstMetric.strengthScore) * 100;

      if (strengthImprovement > 10) {
        highlights.push(`Strong progress: ${Math.round(strengthImprovement)}% strength improvement`);
      } else if (strengthImprovement < 2) {
        concerns.push('Minimal strength gains recently');
        recommendations.push('Consider increasing training intensity or changing exercise selection');
      }
    }

    // Volume progression analysis
    const recentVolume = analytics.volumeProgression.slice(-4); // Last 4 weeks
    const volumeTrend = recentVolume.reduce((sum, week) => sum + week.weeklyChange, 0) / recentVolume.length;
    
    if (volumeTrend > 5) {
      highlights.push('Progressive volume increase maintained');
    } else if (volumeTrend < -10) {
      concerns.push('Declining training volume');
      recommendations.push('Assess recovery and motivation factors');
    }

    // Recovery analysis
    if (analytics.recoveryMetrics.injuryRisk === 'high') {
      concerns.push('High injury risk detected');
      recommendations.push('Prioritize recovery and consider deload week');
    }

    const summary = `Overall progress shows ${highlights.length > concerns.length ? 'positive' : 'mixed'} trends. ${
      highlights.length > 0 ? 'Key achievements include consistent training and strength gains. ' : ''
    }${concerns.length > 0 ? 'Areas for improvement include consistency and recovery management.' : ''}`;

    return {
      summary,
      highlights,
      concerns,
      recommendations
    };
  }

  // Helper methods
  private static groupRecordsByExercise(records: PerformanceRecord[]): Record<string, PerformanceRecord[]> {
    return records.reduce((groups, record) => {
      if (!groups[record.exerciseId]) {
        groups[record.exerciseId] = [];
      }
      groups[record.exerciseId].push(record);
      return groups;
    }, {} as Record<string, PerformanceRecord[]>);
  }

  private static groupRecordsByWeek(records: PerformanceRecord[]): Array<{ week: Date; records: PerformanceRecord[] }> {
    const weeks: Record<string, PerformanceRecord[]> = {};
    
    records.forEach(record => {
      const date = record.sessionDate.toDate();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString();
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(record);
    });

    return Object.entries(weeks)
      .map(([weekKey, records]) => ({ week: new Date(weekKey), records }))
      .sort((a, b) => a.week.getTime() - b.week.getTime());
  }

  private static groupMetricsByPeriod(metrics: StrengthMetric[], days: number): StrengthMetric[][] {
    if (metrics.length === 0) return [];
    
    const periods: StrengthMetric[][] = [];
    const sortedMetrics = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let currentPeriod: StrengthMetric[] = [];
    let periodStart = sortedMetrics[0].date;
    
    sortedMetrics.forEach(metric => {
      const daysSinceStart = (metric.date.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceStart <= days) {
        currentPeriod.push(metric);
      } else {
        if (currentPeriod.length > 0) {
          periods.push(currentPeriod);
        }
        currentPeriod = [metric];
        periodStart = metric.date;
      }
    });
    
    if (currentPeriod.length > 0) {
      periods.push(currentPeriod);
    }
    
    return periods;
  }

  private static classifyExerciseType(exerciseName: string): 'squat' | 'bench' | 'deadlift' | 'press' | 'other' {
    const name = exerciseName.toLowerCase();
    if (name.includes('squat')) return 'squat';
    if (name.includes('bench') || name.includes('chest press')) return 'bench';
    if (name.includes('deadlift')) return 'deadlift';
    if (name.includes('press') && (name.includes('overhead') || name.includes('shoulder'))) return 'press';
    return 'other';
  }

  private static getMuscleGroupsForExercise(exerciseId: string): string[] {
    // Simplified muscle group mapping
    const name = exerciseId.toLowerCase();
    const muscleGroups: string[] = [];
    
    if (name.includes('squat') || name.includes('lunge')) {
      muscleGroups.push('legs', 'glutes');
    }
    if (name.includes('deadlift')) {
      muscleGroups.push('back', 'legs', 'glutes');
    }
    if (name.includes('bench') || name.includes('push')) {
      muscleGroups.push('chest', 'shoulders', 'triceps');
    }
    if (name.includes('pull') || name.includes('row')) {
      muscleGroups.push('back', 'biceps');
    }
    if (name.includes('press') && name.includes('shoulder')) {
      muscleGroups.push('shoulders', 'triceps');
    }
    
    return muscleGroups.length > 0 ? muscleGroups : ['other'];
  }

  private static linearRegression(points: Array<{ x: number; y: number }>): { slope: number; intercept: number; rSquared: number } {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = points.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, rSquared };
  }
}