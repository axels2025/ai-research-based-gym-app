import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PreWorkoutOverview } from "@/components/PreWorkoutOverview";
import { ExerciseSubstitutionModal } from "@/components/ExerciseSubstitutionModal";
import { ExerciseSetup } from "@/components/ExerciseSetup";
import { StrengthAssessment, type StrengthAssessmentData } from "@/components/StrengthAssessment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Settings, Eye, Flame, Zap } from "lucide-react";
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
import { 
  createExerciseProtocol,
  type ExerciseProtocol,
  type EquipmentType,
  type WorkoutGoal 
} from "@/lib/researchBasedWorkout";
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
  // Enhanced research-based fields
  researchProtocol?: ExerciseProtocol;
  setupRequired?: boolean;
  equipmentType?: EquipmentType;
  trainingGoal?: WorkoutGoal;
  lastComfortableWeight?: {
    weight: number;
    reps: number;
    date: Date;
  };
  // Quick setup data for exercises without full protocol
  quickSetupWeight?: number;
  hasHistoricalData?: boolean;
}

interface WorkoutOverview extends Omit<Workout, 'exercises'> {
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
  const [selectedExerciseForSetup, setSelectedExerciseForSetup] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showStrengthAssessment, setShowStrengthAssessment] = useState(false);
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
    // Check if user has any previous performance data
    const hasHistoricalData = performanceRecords && performanceRecords.length > 0;
    
    // Transform exercises to include enhanced data WITHOUT dummy values
    const enhancedExercises: ExercisePreview[] = [
      {
        id: '1',
        name: 'Barbell Bench Press',
        sets: 4,
        reps: '8-10',
        weight: hasHistoricalData ? 185 : undefined, // Only show weight if user has history
        restTime: 180,
        notes: 'Focus on controlled eccentric',
        // Only include previous performance if user actually has data
        previousPerformance: hasHistoricalData ? {
          weight: 180,
          reps: 8,
          sets: 4,
          rpe: 8,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        } : undefined,
        // Only show progression suggestions if user has performance history
        progressionSuggestion: hasHistoricalData ? {
          type: 'weight',
          currentValue: 180,
          suggestedValue: 185,
          reason: 'Consistent performance over 3 weeks - ready for 5lb increase',
          confidence: 'high',
          implementationNotes: 'Add 5lbs to current weight. Maintain rep range.'
        } : undefined,
        estimatedRestTime: 180,
        muscleActivation: ['chest', 'shoulders', 'triceps'],
        difficultyLevel: 'intermediate',
        formCues: [
          'Retract shoulder blades before lifting',
          'Lower bar to chest with control',
          'Drive feet into floor during press',
          'Maintain tight core throughout movement'
        ],
        // Research-based enhancements
        researchProtocol: hasHistoricalData ? createExerciseProtocol(
          'Barbell Bench Press',
          185, // working weight
          8,   // target reps
          'barbell',
          'strength'
        ) : undefined,
        setupRequired: !hasHistoricalData,
        equipmentType: 'barbell',
        trainingGoal: 'strength',
        quickSetupWeight: hasHistoricalData ? 185 : undefined,
        hasHistoricalData,
        lastComfortableWeight: hasHistoricalData ? {
          weight: 185,
          reps: 8,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        } : undefined
      },
      {
        id: '2', 
        name: 'Overhead Press',
        sets: 3,
        reps: '10-12',
        weight: hasHistoricalData ? 95 : undefined, // Only show weight if user has history
        restTime: 120,
        notes: 'Strict form - no leg drive',
        previousPerformance: undefined, // No dummy data for new users
        progressionSuggestion: undefined, // No suggestions without history
        estimatedRestTime: 120,
        muscleActivation: ['shoulders', 'triceps', 'core'],
        difficultyLevel: 'intermediate',
        formCues: [
          'Start with bar at shoulder height',
          'Press straight up, not forward',
          'Keep core tight throughout',
          'Full lockout at top'
        ],
        // Research-based enhancements  
        researchProtocol: hasHistoricalData ? createExerciseProtocol(
          'Overhead Press',
          100,
          10,
          'barbell', 
          'hypertrophy'
        ) : undefined,
        setupRequired: !hasHistoricalData,
        equipmentType: 'barbell',
        trainingGoal: 'hypertrophy',
        quickSetupWeight: hasHistoricalData ? 100 : undefined,
        hasHistoricalData
      },
      {
        id: '3',
        name: 'Incline Dumbbell Press',
        sets: 3,
        reps: '12-15',
        weight: hasHistoricalData ? 70 : undefined, // Only show weight if user has history
        restTime: 90,
        notes: '45-degree incline',
        previousPerformance: undefined, // No dummy data for new users
        progressionSuggestion: undefined, // No suggestions without history
        estimatedRestTime: 90,
        muscleActivation: ['upper chest', 'shoulders', 'triceps'],
        difficultyLevel: 'beginner',
        formCues: [
          'Set bench to 45-degree angle',
          'Control dumbbells throughout range',
          'Squeeze chest at top of movement',
          'Don\'t let dumbbells touch at top'
        ],
        // Research-based enhancements
        researchProtocol: hasHistoricalData ? createExerciseProtocol(
          'Incline Dumbbell Press',
          75,
          12,
          'dumbbell',
          'hypertrophy' 
        ) : undefined,
        setupRequired: !hasHistoricalData,
        equipmentType: 'dumbbell',
        trainingGoal: 'hypertrophy',
        quickSetupWeight: hasHistoricalData ? 75 : undefined,
        hasHistoricalData
      },
      {
        id: '4',
        name: 'Dips',
        sets: 3,
        reps: '10-12',
        weight: hasHistoricalData ? 25 : undefined, // Body weight + added weight
        restTime: 90,
        notes: 'Add weight if bodyweight is too easy',
        previousPerformance: undefined,
        progressionSuggestion: undefined,
        estimatedRestTime: 90,
        muscleActivation: ['lower chest', 'triceps', 'shoulders'],
        difficultyLevel: 'intermediate',
        formCues: [
          'Lean slightly forward',
          'Lower until shoulders below elbows',
          'Press up with control',
          'Avoid swinging or kipping'
        ],
        researchProtocol: hasHistoricalData ? createExerciseProtocol(
          'Dips',
          25,
          11,
          'bodyweight',
          'hypertrophy'
        ) : undefined,
        setupRequired: !hasHistoricalData,
        equipmentType: 'bodyweight',
        trainingGoal: 'hypertrophy',
        quickSetupWeight: hasHistoricalData ? 25 : undefined,
        hasHistoricalData
      },
      {
        id: '5',
        name: 'Lateral Raises',
        sets: 3,
        reps: '15-20',
        weight: hasHistoricalData ? 20 : undefined,
        restTime: 60,
        notes: 'Light weight, focus on form',
        previousPerformance: undefined,
        progressionSuggestion: undefined,
        estimatedRestTime: 60,
        muscleActivation: ['side delts', 'traps'],
        difficultyLevel: 'beginner',
        formCues: [
          'Keep arms slightly bent',
          'Raise to shoulder height',
          'Control the descent',
          'Avoid using momentum'
        ],
        researchProtocol: hasHistoricalData ? createExerciseProtocol(
          'Lateral Raises',
          20,
          17,
          'dumbbell',
          'hypertrophy'
        ) : undefined,
        setupRequired: !hasHistoricalData,
        equipmentType: 'dumbbell',
        trainingGoal: 'hypertrophy',
        quickSetupWeight: hasHistoricalData ? 20 : undefined,
        hasHistoricalData
      },
      {
        id: '6',
        name: 'Tricep Pushdowns',
        sets: 3,
        reps: '12-15',
        weight: hasHistoricalData ? 50 : undefined,
        restTime: 60,
        notes: 'Cable machine or resistance band',
        previousPerformance: undefined,
        progressionSuggestion: undefined,
        estimatedRestTime: 60,
        muscleActivation: ['triceps'],
        difficultyLevel: 'beginner',
        formCues: [
          'Keep elbows at your sides',
          'Full extension at bottom',
          'Control the weight back up',
          'Don\'t lean into the movement'
        ],
        researchProtocol: hasHistoricalData ? createExerciseProtocol(
          'Tricep Pushdowns',
          50,
          13,
          'machine',
          'hypertrophy'
        ) : undefined,
        setupRequired: !hasHistoricalData,
        equipmentType: 'machine',
        trainingGoal: 'hypertrophy',
        quickSetupWeight: hasHistoricalData ? 50 : undefined,
        hasHistoricalData
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
      // Only show previous workout comparison if user has historical data
      previousWorkoutComparison: hasHistoricalData ? {
        lastCompleted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        performanceChange: 'improved' as const,
        volumeChange: 8.5
      } : undefined
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

  const handleStartWorkout = (exerciseIndex?: number) => {
    if (workout) {
      const startFromIndex = exerciseIndex !== undefined ? `&startFrom=${exerciseIndex}` : '';
      navigate(`/workout?id=${workout.id}${startFromIndex}`);
    }
  };

  const handleExerciseClick = (exerciseIndex: number) => {
    handleStartWorkout(exerciseIndex);
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
          progressionSuggestion: undefined,
          // Mark as requiring setup for new exercise
          setupRequired: true,
          researchProtocol: undefined
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

  const handleExerciseSetup = (exerciseId: string) => {
    setSelectedExerciseForSetup(exerciseId);
    setShowSetupModal(true);
  };

  const handleProtocolGenerated = (exerciseId: string, protocol: ExerciseProtocol) => {
    if (!workout) return;

    const updatedExercises = workout.exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          researchProtocol: protocol,
          setupRequired: false,
          workingWeight: protocol.workingWeight,
          equipmentType: protocol.equipmentType,
          trainingGoal: protocol.goal,
          // Update sets to reflect total (warmup + working)
          sets: protocol.warmupSets.length + protocol.workingSets.length,
          // Update estimated time
          restTime: protocol.totalEstimatedTime * 60
        };
      }
      return exercise;
    });

    setWorkout({
      ...workout,
      exercises: updatedExercises
    });

    // Close setup modal
    setShowSetupModal(false);
    setSelectedExerciseForSetup(null);

    toast({
      title: 'Protocol Generated',
      description: `Research-based training protocol created for ${protocol.exerciseName}`,
    });
  };

  const handleStrengthAssessmentComplete = (assessmentData: StrengthAssessmentData) => {
    if (!workout) return;

    // Update all exercises with protocols from the assessment
    const updatedExercises = workout.exercises.map(exercise => {
      const protocol = assessmentData.protocols[exercise.name];
      if (protocol) {
        return {
          ...exercise,
          researchProtocol: protocol,
          setupRequired: false,
          workingWeight: protocol.workingWeight,
          weight: protocol.workingWeight,
          quickSetupWeight: protocol.workingWeight,
          hasHistoricalData: true
        };
      }
      return exercise;
    });

    setWorkout({
      ...workout,
      exercises: updatedExercises
    });

    setShowStrengthAssessment(false);
    toast({
      title: 'Assessment Complete! 🎉',
      description: `Generated protocols for ${Object.keys(assessmentData.protocols).length} exercises.`,
    });
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
  const setupExercise = selectedExerciseForSetup ? workout.exercises.find(e => e.id === selectedExerciseForSetup) : null;

  return (
    <div className="min-h-screen bg-[var(--gradient-background)]">
      <div className="container mx-auto px-4 py-8">
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
            <h1 className="text-2xl font-bold">{workout.title}</h1>
            <p className="text-muted-foreground">
              Click on any exercise to start your workout
            </p>
          </div>
        </div>

        {/* Workout Overview */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{workout.totalEstimatedTime}</div>
              <div className="text-sm text-muted-foreground">minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{workout.exercises.length}</div>
              <div className="text-sm text-muted-foreground">exercises</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary capitalize">{workout.workoutIntensity}</div>
              <div className="text-sm text-muted-foreground">intensity</div>
            </div>
          </div>
        </Card>

        {/* Exercise List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Today's Program</h3>
            <Button onClick={() => handleStartWorkout()} className="bg-primary hover:bg-primary/90">
              Start Workout
            </Button>
          </div>
          
          {/* Strength Assessment Prompt for New Users */}
          {workout.exercises.some(e => e.setupRequired) && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">!</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Strength Assessment Needed</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Some exercises need weight setup. Complete our 2-minute assessment to get personalized, research-based protocols for all exercises.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowStrengthAssessment(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Assessment (2 min)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {}}
                    >
                      Set Up Individually
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {workout.exercises.map((exercise, index) => (
              <div 
                key={exercise.id} 
                className="p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleExerciseClick(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{exercise.name}</h4>
                      
                      {/* Research Protocol Display */}
                      {exercise.researchProtocol ? (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {exercise.researchProtocol.warmupSets.length} warm-up
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-blue-500" />
                            {exercise.researchProtocol.workingSets.length} working
                          </span>
                          <span>•</span>
                          <span className="font-medium text-primary">{exercise.researchProtocol.workingWeight}kg</span>
                          <span>•</span>
                          <span>{exercise.researchProtocol.totalEstimatedTime}min</span>
                        </div>
                      ) : exercise.setupRequired ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <Settings className="w-3 h-3" />
                          <span>Setup required - "What weight can you {exercise.name.toLowerCase()} comfortably?"</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{exercise.sets} sets</span>
                          <span>•</span>
                          <span>{exercise.reps} reps</span>
                          {exercise.quickSetupWeight && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-primary">{exercise.quickSetupWeight}kg</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{Math.floor(exercise.estimatedRestTime / 60)}:{(exercise.estimatedRestTime % 60).toString().padStart(2, '0')} rest</span>
                        </div>
                      )}
                      
                      {exercise.progressionSuggestion && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          ↗ Ready to progress: {exercise.progressionSuggestion.reason}
                        </div>
                      )}
                      
                      {/* Research Protocol Badge */}
                      {exercise.researchProtocol && (
                        <div className="mt-2">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-xs">
                            Research-Based Protocol Active
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {exercise.previousPerformance && (
                      <div className="text-sm text-muted-foreground mb-1">
                        Last: {exercise.previousPerformance.weight}kg × {exercise.previousPerformance.reps}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-xs">
                        {exercise.trainingGoal || exercise.difficultyLevel}
                      </Badge>
                      {exercise.setupRequired && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExerciseSetup(exercise.id);
                          }}
                          className="text-xs h-6"
                        >
                          Quick Setup
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleSkipWorkout} className="flex-1">
            Skip Today
          </Button>
          <Button onClick={() => handleStartWorkout()} className="flex-1 bg-primary hover:bg-primary/90">
            Start from Beginning
          </Button>
        </div>
      </div>

      {/* Exercise Setup Modal */}
      {selectedExerciseForSetup && setupExercise && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${showSetupModal ? '' : 'hidden'}`}>
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Exercise Setup</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSetupModal(false)}
                >
                  ×
                </Button>
              </div>
              <ExerciseSetup
                exerciseName={setupExercise.name}
                defaultEquipment={setupExercise.equipmentType || 'barbell'}
                defaultGoal={setupExercise.trainingGoal || 'strength'}
                previousComfortableWeight={setupExercise.lastComfortableWeight}
                onProtocolGenerated={(protocol) => handleProtocolGenerated(setupExercise.id, protocol)}
              />
            </div>
          </div>
        </div>
      )}

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
      
      {/* Strength Assessment Modal */}
      {showStrengthAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <StrengthAssessment
              onAssessmentComplete={handleStrengthAssessmentComplete}
              onSkip={() => setShowStrengthAssessment(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreWorkout;