import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PreWorkoutOverview } from "@/components/PreWorkoutOverview";
import { ExerciseSubstitutionModal } from "@/components/ExerciseSubstitutionModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getWorkoutById, 
  getUserPerformanceRecords,
  type Workout as BaseWorkout
} from "@/lib/firestore";
import { getUserProfile } from "@/lib/userProfiles";
import { 
  ProgressiveOverloadEngine,
  type ProgressionSuggestion,
  type ExerciseProgression 
} from "@/lib/progressiveOverload";
import { type ExerciseAlternative } from "@/lib/exerciseSubstitution";
import { type UserProfile } from "@/lib/userProfiles";
import { toast } from "@/hooks/use-toast";

interface ExercisePreview {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restTime: number;
  notes?: string;
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

interface WorkoutOverview extends BaseWorkout {
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
    volumeChange: number;
  };
}

const PreWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const workoutId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<WorkoutOverview | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [selectedExerciseForSubstitution, setSelectedExerciseForSubstitution] = useState<string | null>(null);
  const [userReadiness, setUserReadiness] = useState({
    energyLevel: 7,
    sleepQuality: 8,
    musclesoreness: 3,
    timeAvailable: 75
  });

  useEffect(() => {
    if (!workoutId) {
      toast({
        title: 'No Workout Selected',
        description: 'Please select a workout from the dashboard.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    loadWorkoutData();
  }, [workoutId, currentUser]);

  const loadWorkoutData = async () => {
    if (!currentUser || !workoutId) return;

    try {
      setLoading(true);

      // Load workout data
      const workoutData = await getWorkoutById(workoutId);
      if (!workoutData) {
        throw new Error('Workout not found');
      }

      // Load user profile
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);

      // Load performance records for progression suggestions
      const performanceRecords = await getUserPerformanceRecords(currentUser.uid);

      // Transform workout data to include enhanced exercise information
      const enhancedWorkout = await transformToWorkoutOverview(
        workoutData, 
        performanceRecords, 
        profile
      );

      setWorkout(enhancedWorkout);

    } catch (error) {
      console.error('Error loading workout data:', error);
      toast({
        title: 'Loading Error',
        description: 'Failed to load workout data. Using fallback.',
        variant: 'destructive',
      });
      
      // Create fallback workout data
      setWorkout(createFallbackWorkout(workoutId));
    } finally {
      setLoading(false);
    }
  };

  const transformToWorkoutOverview = async (
    baseWorkout: any,
    performanceRecords: any[],
    profile: UserProfile | null
  ): Promise<WorkoutOverview> => {
    // Transform exercises to include enhanced data
    const enhancedExercises: ExercisePreview[] = [
      {
        id: '1',
        name: 'Barbell Bench Press',
        sets: 4,
        reps: '8-10',
        weight: 185,
        restTime: 180,
        notes: 'Focus on controlled eccentric',
        previousPerformance: {
          weight: 180,
          reps: 8,
          sets: 4,
          rpe: 8,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        progressionSuggestion: {
          type: 'weight',
          currentValue: 180,
          suggestedValue: 185,
          reason: 'Consistent performance over 3 weeks - ready for 5lb increase',
          confidence: 'high',
          implementationNotes: 'Add 5lbs to current weight. Maintain rep range.'
        },
        estimatedRestTime: 180,
        muscleActivation: ['chest', 'shoulders', 'triceps'],
        difficultyLevel: 'intermediate',
        formCues: [
          'Retract shoulder blades before lifting',
          'Lower bar to chest with control',
          'Drive feet into floor during press',
          'Maintain tight core throughout movement'
        ]
      },
      {
        id: '2', 
        name: 'Overhead Press',
        sets: 3,
        reps: '10-12',
        weight: 95,
        restTime: 120,
        notes: 'Strict form - no leg drive',
        estimatedRestTime: 120,
        muscleActivation: ['shoulders', 'triceps', 'core'],
        difficultyLevel: 'intermediate',
        formCues: [
          'Start with bar at shoulder height',
          'Press straight up, not forward',
          'Keep core tight throughout',
          'Full lockout at top'
        ]
      },
      {
        id: '3',
        name: 'Incline Dumbbell Press',
        sets: 3,
        reps: '12-15',
        weight: 70,
        restTime: 90,
        notes: '45-degree incline',
        estimatedRestTime: 90,
        muscleActivation: ['upper chest', 'shoulders', 'triceps'],
        difficultyLevel: 'beginner',
        formCues: [
          'Set bench to 45-degree angle',
          'Control dumbbells throughout range',
          'Squeeze chest at top of movement',
          'Don\'t let dumbbells touch at top'
        ]
      }
    ];

    return {
      ...baseWorkout,
      exercises: enhancedExercises,
      warmupExercises: [
        { name: 'Arm Circles', duration: 2, instructions: '10 forward, 10 backward each arm' },
        { name: 'Band Pull-Aparts', duration: 3, instructions: '15-20 reps with resistance band' },
        { name: 'Push-up to Downward Dog', duration: 3, instructions: '8-10 reps focusing on shoulder mobility' },
        { name: 'Light Bench Press', duration: 5, instructions: '2 sets of 10 with empty barbell' }
      ],
      cooldownExercises: [
        { name: 'Chest Doorway Stretch', duration: 3, instructions: 'Hold for 30 seconds each arm' },
        { name: 'Shoulder Cross-Body Stretch', duration: 2, instructions: '30 seconds each arm' },
        { name: 'Tricep Overhead Stretch', duration: 2, instructions: '30 seconds each arm' }
      ],
      totalEstimatedTime: 75,
      workoutIntensity: 'moderate' as const,
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      equipmentNeeded: ['barbell', 'bench', 'dumbbells'],
      previousWorkoutComparison: {
        lastCompleted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        performanceChange: 'improved' as const,
        volumeChange: 8.5
      }
    };
  };

  const createFallbackWorkout = (workoutId: string): WorkoutOverview => {
    return {
      id: workoutId,
      userId: currentUser?.uid || '',
      programId: 'fallback',
      title: 'Push Day - Upper Body',
      week: 1,
      day: 1,
      exercises: [],
      estimatedTime: 75,
      isCompleted: false,
      rotation: 1,
      rotationWeek: 1,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      warmupExercises: [],
      cooldownExercises: [],
      totalEstimatedTime: 75,
      workoutIntensity: 'moderate' as const,
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      equipmentNeeded: ['barbell', 'bench', 'dumbbells']
    };
  };

  const handleStartWorkout = () => {
    if (workout) {
      navigate(`/workout?id=${workout.id}`);
    }
  };

  const handleSubstituteExercise = (exerciseId: string) => {
    setSelectedExerciseForSubstitution(exerciseId);
    setShowSubstitutionModal(true);
  };

  const handleSkipWorkout = () => {
    // Handle skipping workout
    toast({
      title: 'Workout Skipped',
      description: 'You can always come back to complete this workout later.',
    });
    navigate('/');
  };

  const handleExerciseSubstitution = (selectedAlternative: ExerciseAlternative) => {
    if (!workout || !selectedExerciseForSubstitution) return;

    // Update the workout with the substituted exercise
    const updatedExercises = workout.exercises.map(exercise => {
      if (exercise.id === selectedExerciseForSubstitution) {
        return {
          ...exercise,
          name: selectedAlternative.name,
          muscleActivation: selectedAlternative.targetMuscles,
          formCues: [selectedAlternative.instructions],
          // Reset progression data for new exercise
          previousPerformance: undefined,
          progressionSuggestion: undefined
        };
      }
      return exercise;
    });

    setWorkout({
      ...workout,
      exercises: updatedExercises,
      equipmentNeeded: [...new Set([...workout.equipmentNeeded, ...selectedAlternative.equipment])]
    });

    setShowSubstitutionModal(false);
    setSelectedExerciseForSubstitution(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading workout details...</span>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Workout Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested workout could not be loaded.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const selectedExercise = workout.exercises.find(e => e.id === selectedExerciseForSubstitution);

  return (
    <div className="min-h-screen bg-[var(--gradient-background)]">
      <div className="container mx-auto px-4 py-8">
        {/* Pre-Workout Overview */}
        <PreWorkoutOverview
          workout={workout}
          onStartWorkout={handleStartWorkout}
          onSubstituteExercise={handleSubstituteExercise}
          onSkipWorkout={handleSkipWorkout}
          userReadiness={userReadiness}
        />
      </div>

      {/* Exercise Substitution Modal */}
      {selectedExercise && (
        <ExerciseSubstitutionModal
          open={showSubstitutionModal}
          onOpenChange={setShowSubstitutionModal}
          exerciseName={selectedExercise.name}
          targetMuscles={selectedExercise.muscleActivation}
          userProfile={userProfile || undefined}
          availableEquipment={['barbell', 'dumbbells', 'bodyweight', 'bench']}
          onSubstitute={handleExerciseSubstitution}
          reason="equipment"
        />
      )}
    </div>
  );
};

export default PreWorkout;