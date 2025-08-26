import { Timestamp } from 'firebase/firestore';

export interface ProgressionStrategy {
  type: 'weight' | 'reps' | 'sets' | 'volume';
  trigger: ProgressionTrigger;
  increment: number;
  maxProgression: number;
  resetConditions: ResetCondition[];
}

export interface ProgressionTrigger {
  consecutiveSuccessfulSessions: number;
  rpeThreshold?: number; // Rate of Perceived Exertion (1-10)
  formQuality: 'excellent' | 'good' | 'acceptable';
  timeAtCurrentLevel: number; // weeks
}

export interface ResetCondition {
  type: 'plateau' | 'form_breakdown' | 'injury' | 'deload';
  threshold: number;
  action: 'reduce_weight' | 'reduce_volume' | 'change_exercise';
}

export interface PerformanceRecord {
  id: string;
  exerciseId: string;
  userId: string;
  sessionDate: Timestamp;
  weight?: number;
  reps: number;
  sets: number;
  rpe?: number; // Rate of Perceived Exertion
  formQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  restTime: number;
  notes?: string;
  wasProgression: boolean;
  progressionType?: 'weight' | 'reps' | 'sets';
}

export interface ProgressionSuggestion {
  type: 'weight' | 'reps' | 'sets' | 'rest';
  currentValue: number | string;
  suggestedValue: number | string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  implementationNotes: string;
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  currentWeight?: number;
  currentReps: string;
  currentSets: number;
  lastProgressionDate?: Timestamp;
  weeksSinceProgression: number;
  totalSessions: number;
  successfulSessions: number; // Sessions where all sets/reps completed
  recentPerformance: PerformanceRecord[];
  progressionHistory: ProgressionRecord[];
  nextSuggestion?: ProgressionSuggestion;
}

export interface ProgressionRecord {
  date: Timestamp;
  type: 'weight' | 'reps' | 'sets';
  fromValue: number | string;
  toValue: number | string;
  successful: boolean;
  reason: string;
}

export class ProgressiveOverloadEngine {
  private static readonly MIN_PROGRESSION_WEEKS = 2;
  private static readonly BEGINNER_WEIGHT_INCREMENT = 2.5; // kg
  private static readonly INTERMEDIATE_WEIGHT_INCREMENT = 1.25; // kg
  private static readonly ADVANCED_WEIGHT_INCREMENT = 0.625; // kg

  static calculateProgressionSuggestion(
    progression: ExerciseProgression,
    userExperience: 'beginner' | 'intermediate' | 'advanced',
    exerciseType: 'compound' | 'isolation' = 'compound'
  ): ProgressionSuggestion | null {
    
    if (progression.weeksSinceProgression < this.MIN_PROGRESSION_WEEKS) {
      return null; // Too early for progression
    }

    const recentSessions = progression.recentPerformance.slice(0, 3); // Last 3 sessions
    const successRate = progression.successfulSessions / progression.totalSessions;
    
    const averageRPE = recentSessions
      .filter(session => session.rpe)
      .reduce((sum, session) => sum + (session.rpe || 0), 0) / recentSessions.length;

    const averageForm = this.getFormScore(recentSessions);

    if (this.shouldProgressWeight(successRate, averageRPE, averageForm, progression.weeksSinceProgression)) {
      const increment = this.getWeightIncrement(userExperience, exerciseType);
      const currentWeight = progression.currentWeight || 0;
      
      return {
        type: 'weight',
        currentValue: currentWeight,
        suggestedValue: currentWeight + increment,
        reason: `Consistent performance for ${progression.weeksSinceProgression} weeks. Ready for weight increase.`,
        confidence: successRate >= 0.9 ? 'high' : successRate >= 0.8 ? 'medium' : 'low',
        implementationNotes: `Add ${increment}kg to current weight. Maintain current rep range.`
      };
    }

    if (this.shouldProgressReps(successRate, averageRPE, progression.currentReps)) {
      const currentReps = this.parseRepRange(progression.currentReps);
      const newReps = this.incrementRepRange(currentReps);
      
      return {
        type: 'reps',
        currentValue: progression.currentReps,
        suggestedValue: newReps,
        reason: 'Current weight feels manageable. Time to increase volume.',
        confidence: 'medium',
        implementationNotes: 'Increase reps by 1-2. When you can complete upper range, consider weight increase.'
      };
    }

    if (this.shouldProgressSets(progression.currentSets, progression.totalSessions)) {
      return {
        type: 'sets',
        currentValue: progression.currentSets,
        suggestedValue: progression.currentSets + 1,
        reason: 'Adding volume through additional set for further stimulus.',
        confidence: 'low',
        implementationNotes: 'Add one additional set. Monitor recovery and form quality.'
      };
    }

    return null; // No progression recommended
  }

  private static shouldProgressWeight(
    successRate: number, 
    averageRPE: number, 
    averageForm: number,
    weeksSinceProgression: number
  ): boolean {
    return (
      successRate >= 0.85 && // 85% success rate minimum
      averageRPE <= 8 && // RPE 8 or below
      averageForm >= 3 && // Good form
      weeksSinceProgression >= this.MIN_PROGRESSION_WEEKS
    );
  }

  private static shouldProgressReps(successRate: number, averageRPE: number, currentReps: string): boolean {
    const repRange = this.parseRepRange(currentReps);
    return (
      successRate >= 0.9 && // Higher success rate for rep progression
      averageRPE <= 7 && // Lower RPE for rep progression
      repRange.max < 15 // Don't progress reps beyond 15
    );
  }

  private static shouldProgressSets(currentSets: number, totalSessions: number): boolean {
    return (
      currentSets < 5 && // Don't exceed 5 sets
      totalSessions >= 6 // Only after sufficient experience
    );
  }

  private static getWeightIncrement(
    userExperience: 'beginner' | 'intermediate' | 'advanced',
    exerciseType: 'compound' | 'isolation'
  ): number {
    const baseIncrement = {
      beginner: this.BEGINNER_WEIGHT_INCREMENT,
      intermediate: this.INTERMEDIATE_WEIGHT_INCREMENT,
      advanced: this.ADVANCED_WEIGHT_INCREMENT
    }[userExperience];

    return exerciseType === 'compound' ? baseIncrement : baseIncrement / 2;
  }

  private static getFormScore(sessions: PerformanceRecord[]): number {
    const formScores = { excellent: 4, good: 3, acceptable: 2, poor: 1 };
    return sessions.reduce((sum, session) => sum + formScores[session.formQuality], 0) / sessions.length;
  }

  private static parseRepRange(repString: string): { min: number; max: number } {
    const match = repString.match(/(\d+)[-–](\d+)/);
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) };
    }
    
    const singleRep = parseInt(repString);
    return { min: singleRep, max: singleRep };
  }

  private static incrementRepRange(repRange: { min: number; max: number }): string {
    const newMin = repRange.min + 1;
    const newMax = repRange.max + 2;
    return newMin === newMax ? newMin.toString() : `${newMin}-${newMax}`;
  }

  static shouldDeload(progression: ExerciseProgression): boolean {
    const recentFailures = progression.recentPerformance
      .slice(0, 3)
      .filter(session => !session.wasProgression).length;

    const averageRPE = progression.recentPerformance
      .slice(0, 3)
      .filter(session => session.rpe)
      .reduce((sum, session) => sum + (session.rpe || 0), 0) / 3;

    return (
      recentFailures >= 3 || // 3 consecutive failed progressions
      averageRPE >= 9.5 || // Very high RPE
      progression.weeksSinceProgression >= 8 // Plateau for 8+ weeks
    );
  }

  static calculateDeloadRecommendation(progression: ExerciseProgression): ProgressionSuggestion {
    const currentWeight = progression.currentWeight || 0;
    const deloadWeight = Math.max(currentWeight * 0.85, currentWeight - 5); // 15% reduction or 5kg, whichever is less

    return {
      type: 'weight',
      currentValue: currentWeight,
      suggestedValue: deloadWeight,
      reason: 'Signs of overreaching detected. Deload recommended for recovery.',
      confidence: 'high',
      implementationNotes: 'Reduce weight by 10-15% for 1-2 weeks, focus on form and technique.'
    };
  }

  static generateProgressionPlan(
    progressions: ExerciseProgression[],
    userExperience: 'beginner' | 'intermediate' | 'advanced'
  ): {
    readyForProgression: ExerciseProgression[];
    needDeload: ExerciseProgression[];
    maintain: ExerciseProgression[];
  } {
    const readyForProgression: ExerciseProgression[] = [];
    const needDeload: ExerciseProgression[] = [];
    const maintain: ExerciseProgression[] = [];

    progressions.forEach(progression => {
      if (this.shouldDeload(progression)) {
        needDeload.push(progression);
      } else {
        const suggestion = this.calculateProgressionSuggestion(progression, userExperience);
        if (suggestion) {
          progression.nextSuggestion = suggestion;
          readyForProgression.push(progression);
        } else {
          maintain.push(progression);
        }
      }
    });

    return { readyForProgression, needDeload, maintain };
  }

  static getProgressionInsights(progression: ExerciseProgression): string[] {
    const insights: string[] = [];
    
    const successRate = progression.successfulSessions / progression.totalSessions;
    if (successRate < 0.7) {
      insights.push('Consider reducing weight or volume to improve consistency');
    }

    if (progression.weeksSinceProgression >= 4) {
      insights.push('Ready for progression or may need exercise variation');
    }

    const recentRPE = progression.recentPerformance[0]?.rpe;
    if (recentRPE && recentRPE >= 9) {
      insights.push('High effort levels - monitor for overreaching signs');
    }

    if (progression.recentPerformance.some(session => session.formQuality === 'poor')) {
      insights.push('Form breakdown detected - focus on technique before progression');
    }

    return insights;
  }
}

export function createProgressionRecord(
  exerciseId: string,
  userId: string,
  type: 'weight' | 'reps' | 'sets',
  fromValue: number | string,
  toValue: number | string,
  successful: boolean,
  reason: string
): ProgressionRecord {
  return {
    date: Timestamp.now(),
    type,
    fromValue,
    toValue,
    successful,
    reason
  };
}

export function analyzeWorkoutPerformance(
  exercises: Array<{
    id: string;
    name: string;
    weight?: number;
    reps: string;
    sets: number;
    completed: boolean;
    rpe?: number;
    formQuality?: 'excellent' | 'good' | 'acceptable' | 'poor';
  }>
): PerformanceRecord[] {
  return exercises.map(exercise => ({
    id: `${exercise.id}_${Date.now()}`,
    exerciseId: exercise.id,
    userId: '',
    sessionDate: Timestamp.now(),
    weight: exercise.weight,
    reps: parseInt(exercise.reps.split('-')[0]) || 0,
    sets: exercise.sets,
    rpe: exercise.rpe,
    formQuality: exercise.formQuality || 'good',
    restTime: 90,
    wasProgression: false,
    notes: exercise.completed ? 'Completed all sets' : 'Incomplete'
  }));
}