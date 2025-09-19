import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EnhancedExerciseInput } from "@/components/EnhancedExerciseInput";
import { EnhancedRestTimer } from "@/components/EnhancedRestTimer";
import { ExerciseSubstitutionModal } from "@/components/ExerciseSubstitutionModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, RotateCcw, Flame, Zap, Target, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { type ExerciseAlternative } from "@/lib/exerciseSubstitution";
import { 
  getWorkoutById,
  createPerformanceRecord,
  type Exercise
} from "@/lib/firestore";
import { 
  createExerciseProtocol,
  getScientificRestDuration,
  getCoachingTips,
  type ExerciseProtocol,
  type WarmupSet,
  type WorkingSet,
  type SetType 
} from "@/lib/researchBasedWorkout";
import { toast } from "@/hooks/use-toast";

interface EnhancedExercise {
  id: string;
  name: string;
  researchProtocol?: ExerciseProtocol;
  // Fallback for exercises without research protocols
  sets: number;
  reps: number | string;
  lastWeight: number;
  suggestedWeight: number;
  restTime: number;
  equipmentType?: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';
  trainingGoal?: 'strength' | 'hypertrophy' | 'endurance';
}

// Enhanced workout structure - requires assessment data or user input for safe weights
const getEnhancedWorkout = (): { name: string; exercises: EnhancedExercise[]; totalEstimatedTime: number } => {
  // This function should not be used anymore - workouts should come from proper data flow
  console.warn('getEnhancedWorkout called - workouts should come from assessment data or database');
  
  return {
    name: "Workout Setup Required",
    exercises: [],
    totalEstimatedTime: 0
  };
};

export const Workout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const workoutId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(getEnhancedWorkout());
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(() => {
    const startFrom = searchParams.get('startFrom');
    return startFrom ? parseInt(startFrom, 10) : 0;
  });
  const [currentSetIndex, setCurrentSetIndex] = useState(0); // Overall set index (warmup + working)
  const [showTimer, setShowTimer] = useState(false);
  const [completedSets, setCompletedSets] = useState<Array<{
    exerciseId: string;
    setId: string;
    weight: number; 
    reps: number;
    rpe?: number;
    setType: 'warmup' | 'working';
  }>>([]);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [currentRestDuration, setCurrentRestDuration] = useState(0);
  const [currentSetType, setCurrentSetType] = useState<'warmup' | 'working'>('warmup');

  const currentExercise = workout.exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
  
  // Get current exercise's sets (either from research protocol or fallback)
  const getCurrentExerciseSets = () => {
    if (!currentExercise) {
      return [];
    }
    
    if (currentExercise.researchProtocol) {
      return [...currentExercise.researchProtocol.warmupSets, ...currentExercise.researchProtocol.workingSets];
    }
    // Fallback: create simple working sets
    const fallbackSets: Array<WarmupSet | WorkingSet> = [];
    for (let i = 0; i < currentExercise.sets; i++) {
      fallbackSets.push({
        id: `working-${i + 1}`,
        weight: currentExercise.suggestedWeight || 0,
        reps: currentExercise.reps,
        restTime: currentExercise.restTime,
        description: `Working set ${i + 1}`,
        type: 'working'
      } as WorkingSet);
    }
    return fallbackSets;
  };

  const currentExerciseSets = getCurrentExerciseSets();
  const currentSet = currentExerciseSets[currentSetIndex];
  const isLastSetOfExercise = currentSetIndex === currentExerciseSets.length - 1;

  // Load workout data on mount - require proper data or redirect to assessment
  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId && !currentUser) {
        setLoading(false);
        toast({
          title: 'Setup Required',
          description: 'Please complete your assessment first.',
          variant: 'destructive'
        });
        navigate('/pre-workout');
        return;
      }

      try {
        // Try to load workout from database/assessment data
        // This should come from proper data flow, not hardcoded data
        if (workoutId) {
          const workoutData = await getWorkoutById(workoutId);
          if (workoutData) {
            // Convert database workout to enhanced format
            setWorkout({
              name: workoutData.title || 'Workout',
              exercises: [], // This should be populated from proper data
              totalEstimatedTime: workoutData.estimatedTime || 45
            });
          } else {
            throw new Error('Workout not found');
          }
        } else {
          throw new Error('No workout ID provided');
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        toast({
          title: 'Setup Required',
          description: 'Please complete your strength assessment first to get safe weight recommendations.',
          variant: 'destructive'
        });
        navigate('/pre-workout');
        return;
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId, currentUser, navigate]);

  const handleSetComplete = (weight: number, actualReps: number, rpe?: number) => {
    if (!currentSet) return;

    // Record the completed set
    const completedSet = {
      exerciseId: currentExercise.id,
      setId: currentSet.id,
      weight,
      reps: actualReps,
      rpe,
      setType: currentSet.type as 'warmup' | 'working'
    };
    
    setCompletedSets([...completedSets, completedSet]);

    // Save performance record
    if (currentUser) {
      createPerformanceRecord(currentUser.uid, {
        exerciseId: currentExercise.id,
        sessionDate: new Date() as any,
        weight,
        reps: actualReps,
        sets: 1,
        rpe,
        formQuality: 'good',
        restTime: currentExercise.restTime,
        wasProgression: weight > currentExercise.lastWeight,
      }).catch(console.error);
    }
    
    // Set rest duration
    setCurrentRestDuration(currentExercise.restTime);
    setCurrentSetType('working');

    if (isLastSetOfExercise) {
      if (isLastExercise) {
        // Workout complete
        toast({
          title: 'Workout Complete! 🎉',
          description: 'Great job finishing your workout.',
        });
        navigate("/");
      } else {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
        setShowTimer(true);
      }
    } else {
      // Next set of same exercise
      setCurrentSetIndex(currentSetIndex + 1);
      setShowTimer(true);
    }
  };

  const handleTimerComplete = () => {
    setShowTimer(false);
    // Auto-decrease rest time for countdown
    const interval = setInterval(() => {
      setCurrentRestDuration(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Clear interval when timer completes
    setTimeout(() => {
      clearInterval(interval);
    }, currentRestDuration * 1000);
  };

  const handleSkipSet = () => {
    // Skip current set and move to next
    if (isLastSetOfExercise) {
      if (isLastExercise) {
        navigate("/");
      } else {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      }
    } else {
      setCurrentSetIndex(currentSetIndex + 1);
    }
  };

  const handleSubstituteExercise = () => {
    setShowSubstitutionModal(true);
  };

  const handleExerciseSubstitution = (selectedAlternative: ExerciseAlternative) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises[currentExerciseIndex] = {
      ...updatedExercises[currentExerciseIndex],
      name: selectedAlternative.name,
      // Reset research protocol for substituted exercise
      researchProtocol: undefined
    };
    
    setWorkout({
      ...workout,
      exercises: updatedExercises
    });
    
    setShowSubstitutionModal(false);
    
    toast({
      title: 'Exercise Substituted',
      description: `Switched to ${selectedAlternative.name}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!currentExercise || !currentSet || workout.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assessment Required</h2>
          <p className="text-muted-foreground mb-4">
            To ensure your safety, please complete the strength assessment to get personalized weight recommendations.
          </p>
          <Button onClick={() => navigate('/pre-workout')} className="w-full">
            Complete Assessment
          </Button>
        </Card>
      </div>
    );
  }

  const totalSetsInWorkout = workout.exercises.reduce((total, exercise) => {
    if (!exercise) return total;
    if (exercise.researchProtocol) {
      return total + exercise.researchProtocol.warmupSets.length + exercise.researchProtocol.workingSets.length;
    }
    return total + (exercise.sets || 0);
  }, 0);
  
  const completedSetsCount = completedSets.length;
  const overallProgress = (completedSetsCount / totalSetsInWorkout) * 100;

  return (
    <div className="min-h-screen bg-[var(--gradient-background)] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{workout.name}</h1>
            <p className="text-muted-foreground">
              Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
            </p>
          </div>
        </div>

        {/* Exercise Progress */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Exercise Progress</span>
            <span className="text-sm text-muted-foreground">
              Set {currentSetIndex + 1} of {currentExerciseSets.length}
            </span>
          </div>
          <Progress value={(currentSetIndex / currentExerciseSets.length) * 100} className="h-2" />
        </Card>

        {/* Current Exercise */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
              {currentExerciseIndex + 1}
            </div>
            <h2 className="text-2xl font-bold mb-2">{currentExercise.name}</h2>
            <p className="text-muted-foreground mb-6">
              Set {currentSetIndex + 1} of {currentExerciseSets.length}
            </p>
            
            {/* Set Details */}
            <div className="bg-background/50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{currentSet.weight || currentExercise.suggestedWeight}kg</div>
                  <div className="text-sm text-muted-foreground">Weight</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{currentSet.reps || currentExercise.reps}</div>
                  <div className="text-sm text-muted-foreground">Reps</div>
                </div>
              </div>
              
              {currentExercise.lastWeight && (
                <div className="mt-4 pt-4 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Last time: {currentExercise.lastWeight}kg
                    {currentExercise.suggestedWeight > currentExercise.lastWeight && (
                      <span className="ml-2 text-green-600 font-medium">
                        (+{currentExercise.suggestedWeight - currentExercise.lastWeight}kg increase!)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkipSet}
                className="flex-1"
              >
                Skip Set
              </Button>
              <Button
                onClick={() => {
                  const weight = Number(currentSet.weight || currentExercise.suggestedWeight);
                  const reps = typeof currentSet.reps === 'number' ? currentSet.reps : Number(currentExercise.reps);
                  handleSetComplete(weight, reps);
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isLastSetOfExercise && isLastExercise ? 'Finish Workout' : 
                 isLastSetOfExercise ? 'Next Exercise' : 'Next Set'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Enhanced Rest Timer */}
        <EnhancedRestTimer
          duration={currentRestDuration}
          onComplete={handleTimerComplete}
          isActive={showTimer}
          setType={currentSetType}
          setDescription={currentSet?.description}
          percentage={'percentage' in currentSet ? (currentSet as WarmupSet).percentage : undefined}
          stage={'stage' in currentSet ? (currentSet as WarmupSet).stage : undefined}
          targetRPE={'targetRPE' in currentSet ? (currentSet as WorkingSet).targetRPE : undefined}
          autoStart={true}
          showCoachingTips={true}
        />

        {/* Exercise Overview */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold">Exercise Overview</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
            <div>
              <div className="font-semibold">{currentExercise.sets}</div>
              <div className="text-muted-foreground">Total Sets</div>
            </div>
            <div>
              <div className="font-semibold">{currentExercise.restTime}s</div>
              <div className="text-muted-foreground">Rest Time</div>
            </div>
            <div>
              <div className="font-semibold capitalize">{currentExercise.trainingGoal}</div>
              <div className="text-muted-foreground">Goal</div>
            </div>
          </div>
          
          {/* Next Exercises */}
          {workout.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 3).length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">Coming Up:</div>
              <div className="space-y-1">
                {workout.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 3).map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{exercise.name}</span>
                    <span>{exercise.sets} × {exercise.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Exercise Substitution Modal */}
      <ExerciseSubstitutionModal
        open={showSubstitutionModal}
        onOpenChange={setShowSubstitutionModal}
        exerciseName={currentExercise.name}
        targetMuscles={currentExercise.researchProtocol?.muscleActivation || ['chest', 'shoulders', 'triceps']}
        availableEquipment={['barbell', 'dumbbells', 'bodyweight', 'bench']}
        onSubstitute={handleExerciseSubstitution}
        reason="preference"
      />
    </div>
  );
};