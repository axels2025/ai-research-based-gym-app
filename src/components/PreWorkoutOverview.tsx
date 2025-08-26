import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Clock, 
  Target, 
  TrendingUp, 
  Zap, 
  Thermometer,
  Activity,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  Timer,
  Dumbbell,
  ArrowRight
} from "lucide-react";
import { type Workout, type Exercise } from "@/lib/firestore";
import { ProgressionSuggestion } from "@/lib/progressiveOverload";

interface ExercisePreview extends Exercise {
  previousPerformance?: {
    weight: number;
    reps: number;
    sets: number;
    rpe?: number;
    date: Date;
  };
  progressionSuggestion?: ProgressionSuggestion;
  estimatedRestTime: number;
  muscleActivation: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  formCues: string[];
}

interface WorkoutOverview extends Workout {
  exercises: ExercisePreview[];
  warmupExercises: {
    name: string;
    duration: number;
    instructions: string;
  }[];
  cooldownExercises: {
    name: string;
    duration: number;
    instructions: string;
  }[];
  totalEstimatedTime: number;
  workoutIntensity: 'light' | 'moderate' | 'high' | 'very-high';
  targetMuscleGroups: string[];
  equipmentNeeded: string[];
  previousWorkoutComparison?: {
    lastCompleted: Date;
    performanceChange: 'improved' | 'maintained' | 'declined';
    volumeChange: number; // percentage
  };
}

interface PreWorkoutOverviewProps {
  workout: WorkoutOverview;
  onStartWorkout: () => void;
  onSubstituteExercise: (exerciseId: string) => void;
  onSkipWorkout: () => void;
  userReadiness?: {
    energyLevel: number; // 1-10
    sleepQuality: number; // 1-10
    musclesoreness: number; // 1-10
    timeAvailable: number; // minutes
  };
}

export const PreWorkoutOverview = ({ 
  workout, 
  onStartWorkout, 
  onSubstituteExercise,
  onSkipWorkout,
  userReadiness 
}: PreWorkoutOverviewProps) => {
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'light': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'very-high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getReadinessInsights = () => {
    if (!userReadiness) return null;

    const insights = [];
    const { energyLevel, sleepQuality, musclesoreness, timeAvailable } = userReadiness;

    if (energyLevel < 5) {
      insights.push({
        type: 'warning',
        message: 'Low energy detected. Consider reducing intensity by 10-15%.'
      });
    }

    if (sleepQuality < 6) {
      insights.push({
        type: 'warning',
        message: 'Poor sleep quality may affect performance and recovery.'
      });
    }

    if (musclesoreness >= 7) {
      insights.push({
        type: 'alert',
        message: 'High muscle soreness. Consider focusing on mobility and light movement.'
      });
    }

    if (timeAvailable < workout.totalEstimatedTime) {
      insights.push({
        type: 'info',
        message: `Limited time available. Consider shortened version (${timeAvailable} min).`
      });
    }

    return insights;
  };

  const readinessInsights = getReadinessInsights();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{workout.title}</h1>
            <p className="text-muted-foreground">Week {workout.week} • Day {workout.day}</p>
          </div>
          <div className="text-right">
            <Badge className={getIntensityColor(workout.workoutIntensity)}>
              {workout.workoutIntensity.replace('-', ' ')} intensity
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {workout.rotation && `Rotation ${workout.rotation}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Exercises</span>
            </div>
            <p className="text-xl font-bold">{workout.exercises.length}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-xl font-bold">{workout.totalEstimatedTime}min</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Muscle Groups</span>
            </div>
            <p className="text-xl font-bold">{workout.targetMuscleGroups.length}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Dumbbell className="w-4 h-4" />
              <span className="text-sm">Equipment</span>
            </div>
            <p className="text-xl font-bold">{workout.equipmentNeeded.length}</p>
          </div>
        </div>

        {/* Target Muscle Groups */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Target Muscle Groups:</p>
          <div className="flex flex-wrap gap-2">
            {workout.targetMuscleGroups.map((muscle) => (
              <Badge key={muscle} variant="secondary">{muscle}</Badge>
            ))}
          </div>
        </div>

        {/* Equipment Needed */}
        <div>
          <p className="text-sm font-medium mb-2">Equipment Needed:</p>
          <div className="flex flex-wrap gap-2">
            {workout.equipmentNeeded.map((equipment) => (
              <Badge key={equipment} variant="outline">{equipment}</Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Readiness Insights */}
      {readinessInsights && readinessInsights.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Readiness Check
          </h3>
          <div className="space-y-2">
            {readinessInsights.map((insight, index) => (
              <Alert key={index} className={
                insight.type === 'alert' ? 'border-red-200 bg-red-50' :
                insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }>
                {insight.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                {insight.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                {insight.type === 'info' && <Info className="h-4 w-4" />}
                <AlertDescription>{insight.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        </Card>
      )}

      {/* Previous Performance Comparison OR First Time Message */}
      {workout.previousWorkoutComparison ? (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress Since Last Session
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Last completed: {workout.previousWorkoutComparison.lastCompleted.toLocaleDateString()}
              </p>
              <p className="text-sm">
                Performance trend: 
                <Badge 
                  className="ml-2"
                  variant={
                    workout.previousWorkoutComparison.performanceChange === 'improved' ? 'default' :
                    workout.previousWorkoutComparison.performanceChange === 'maintained' ? 'secondary' :
                    'destructive'
                  }
                >
                  {workout.previousWorkoutComparison.performanceChange}
                </Badge>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Volume Change</p>
              <p className={`text-lg font-bold ${
                workout.previousWorkoutComparison.volumeChange > 0 ? 'text-green-600' :
                workout.previousWorkoutComparison.volumeChange < 0 ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {workout.previousWorkoutComparison.volumeChange > 0 ? '+' : ''}
                {workout.previousWorkoutComparison.volumeChange}%
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            First Time Setup
          </h3>
          <p className="text-sm text-muted-foreground">
            This is your first time doing this workout! 🎉 
            We'll track your performance and provide personalized progression suggestions for next time.
          </p>
        </Card>
      )}

      {/* Workout Timeline */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Workout Timeline
        </h3>
        
        <div className="space-y-4">
          {/* Warmup */}
          <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <h4 className="font-medium">Warmup</h4>
              <p className="text-sm text-muted-foreground">
                {workout.warmupExercises.length} exercises • {workout.warmupExercises.reduce((sum, ex) => sum + ex.duration, 0)} min
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}>
              Details
            </Button>
          </div>

          {showAdvancedInfo && (
            <div className="ml-9 space-y-2">
              {workout.warmupExercises.map((exercise, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-sm text-muted-foreground">{exercise.duration} min</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{exercise.instructions}</p>
                </div>
              ))}
            </div>
          )}

          {/* Main Exercises */}
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
            <Dumbbell className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <h4 className="font-medium">Main Workout</h4>
              <p className="text-sm text-muted-foreground">
                {workout.exercises.length} exercises • {workout.exercises.reduce((sum, ex) => sum + ex.estimatedRestTime * ex.sets, 0)} min est.
              </p>
            </div>
          </div>

          {/* Cooldown */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium">Cooldown & Stretching</h4>
              <p className="text-sm text-muted-foreground">
                {workout.cooldownExercises.length} exercises • {workout.cooldownExercises.reduce((sum, ex) => sum + ex.duration, 0)} min
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Exercise Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Exercise Breakdown</h3>
        <div className="space-y-4">
          {workout.exercises.map((exercise, index) => (
            <div 
              key={exercise.id} 
              className={`p-4 rounded-lg border transition-colors ${
                selectedExercise === exercise.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedExercise(selectedExercise === exercise.id ? null : exercise.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets • {exercise.reps} reps
                      {exercise.weight && ` • ${exercise.weight}kg`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {exercise.progressionSuggestion && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Progress Ready
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onSubstituteExercise(exercise.id)}>
                    Substitute
                  </Button>
                </div>
              </div>

              {exercise.previousPerformance && (
                <div className="text-sm text-muted-foreground mb-2">
                  Last time: {exercise.previousPerformance.weight}kg × {exercise.previousPerformance.reps} × {exercise.previousPerformance.sets}
                  {exercise.previousPerformance.rpe && ` (RPE: ${exercise.previousPerformance.rpe})`}
                </div>
              )}

              {exercise.progressionSuggestion && (
                <Alert className="mb-3 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Progression Suggestion:</strong> {exercise.progressionSuggestion.reason}
                    <br />
                    <span className="text-sm">
                      {exercise.progressionSuggestion.implementationNotes}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {selectedExercise === exercise.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Target Muscles:</p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscleActivation.map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs">{muscle}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Form Cues:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {exercise.formCues.map((cue, cueIndex) => (
                        <li key={cueIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">Rest Time</p>
                      <p className="text-sm text-muted-foreground">{exercise.estimatedRestTime}s</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Difficulty</p>
                      <Badge variant="secondary">{exercise.difficultyLevel}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={onStartWorkout}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Workout
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onSkipWorkout}
            size="lg"
          >
            Skip Today
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground text-center mt-3">
          Estimated total time: {workout.totalEstimatedTime} minutes
        </p>
      </Card>
    </div>
  );
};