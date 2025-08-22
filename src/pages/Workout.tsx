import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExerciseInput } from "@/components/ExerciseInput";
import { ExerciseTimer } from "@/components/ExerciseTimer";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockWorkout = {
  name: "Push Day - Upper Body",
  exercises: [
    {
      name: "Barbell Bench Press",
      sets: 4,
      reps: 8,
      lastWeight: 185,
      suggestedWeight: 190,
      restTime: 180
    },
    {
      name: "Overhead Press",
      sets: 3,
      reps: 10,
      lastWeight: 95,
      suggestedWeight: 100,
      restTime: 120
    },
    {
      name: "Incline Dumbbell Press",
      sets: 3,
      reps: 12,
      lastWeight: 70,
      suggestedWeight: 75,
      restTime: 90
    },
    {
      name: "Lateral Raises",
      sets: 4,
      reps: 15,
      lastWeight: 20,
      suggestedWeight: 22.5,
      restTime: 60
    }
  ]
};

export const Workout = () => {
  const navigate = useNavigate();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [completedSets, setCompletedSets] = useState<Array<{weight: number, reps: number}>>([]);

  const currentExercise = mockWorkout.exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === mockWorkout.exercises.length - 1;
  const isLastSet = currentSet === currentExercise.sets;

  const handleSetComplete = (weight: number, reps: number) => {
    setCompletedSets([...completedSets, { weight, reps }]);
    
    if (isLastSet) {
      if (isLastExercise) {
        // Workout complete
        navigate("/");
      } else {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setShowTimer(true);
      }
    } else {
      // Next set of same exercise
      setCurrentSet(currentSet + 1);
      setShowTimer(true);
    }
  };

  const handleTimerComplete = () => {
    setShowTimer(false);
  };

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
          <div>
            <h1 className="text-2xl font-bold">{mockWorkout.name}</h1>
            <p className="text-muted-foreground">
              Exercise {currentExerciseIndex + 1} of {mockWorkout.exercises.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Workout Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentExerciseIndex + (currentSet / currentExercise.sets)) / mockWorkout.exercises.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${((currentExerciseIndex + (currentSet / currentExercise.sets)) / mockWorkout.exercises.length) * 100}%` 
              }}
            />
          </div>
        </Card>

        {/* Exercise Input */}
        <div className="mb-6">
          <ExerciseInput
            exerciseName={currentExercise.name}
            targetSets={currentExercise.sets}
            targetReps={currentExercise.reps}
            lastWeight={currentExercise.lastWeight}
            suggestedWeight={currentExercise.suggestedWeight}
            currentSet={currentSet}
            onComplete={handleSetComplete}
          />
        </div>

        {/* Timer */}
        <ExerciseTimer
          duration={currentExercise.restTime}
          onComplete={handleTimerComplete}
          isActive={showTimer}
        />

        {/* Exercise Queue */}
        <Card className="p-4 mt-6">
          <h3 className="font-semibold mb-3">Upcoming Exercises</h3>
          <div className="space-y-2">
            {mockWorkout.exercises.slice(currentExerciseIndex + 1).map((exercise, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{exercise.name}</span>
                <span className="text-muted-foreground">
                  {exercise.sets} × {exercise.reps} @ {exercise.suggestedWeight} lbs
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};