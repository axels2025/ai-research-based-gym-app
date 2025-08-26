import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedProgramOverview } from "@/components/EnhancedProgramOverview";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getActiveProgram, 
  getUserWorkouts, 
  getUserAnalytics,
  type WorkoutProgram, 
  type Workout 
} from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

interface ProgramOverviewData {
  program: WorkoutProgram;
  workouts: Workout[];
  rotationCycles: {
    cycleNumber: number;
    weeks: number[];
    focus: string;
    workoutsCompleted: number;
    totalWorkouts: number;
    exercises: string[];
    progressionNotes: string;
  }[];
  weeklyProgress: {
    week: number;
    workoutsCompleted: number;
    totalWorkouts: number;
    volumeLifted: number;
    avgIntensity: number;
  }[];
  exerciseFrequency: Record<string, {
    frequency: number;
    lastPerformed: Date;
    progressionTrend: 'increasing' | 'stable' | 'decreasing';
  }>;
  upcomingWorkouts: Workout[];
  completionRate: number;
  averageWorkoutTime: number;
  strengthGains: {
    exercise: string;
    improvement: string;
    timeframe: string;
  }[];
}

const ProgramOverview = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programData, setProgramData] = useState<ProgramOverviewData | null>(null);

  useEffect(() => {
    async function loadProgramData() {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Get active program
        const activeProgram = await getActiveProgram(currentUser.uid);
        if (!activeProgram) {
          toast({
            title: 'No Program Found',
            description: 'Please create a program first.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        // Get workouts for this program
        const userWorkouts = await getUserWorkouts(currentUser.uid, activeProgram.id);
        
        // Get analytics data
        const analytics = await getUserAnalytics(currentUser.uid, 8); // Last 8 weeks

        // Generate rotation cycles data
        const rotationCycles = generateRotationCycles(activeProgram, userWorkouts);
        
        // Generate weekly progress data
        const weeklyProgress = generateWeeklyProgress(userWorkouts, analytics);
        
        // Generate exercise frequency data
        const exerciseFrequency = generateExerciseFrequency(userWorkouts);
        
        // Get upcoming workouts
        const upcomingWorkouts = userWorkouts
          .filter(w => !w.isCompleted)
          .sort((a, b) => a.week - b.week || a.day - b.day)
          .slice(0, 5);

        // Calculate completion rate
        const completionRate = Math.round((activeProgram.workoutsCompleted / activeProgram.totalWorkouts) * 100);
        
        // Calculate average workout time (mock data for now)
        const averageWorkoutTime = userWorkouts.length > 0 ? 
          Math.round(userWorkouts.reduce((sum, w) => sum + w.estimatedTime, 0) / userWorkouts.length) : 0;

        // Generate strength gains (mock data for now)
        const strengthGains = [
          { exercise: 'Bench Press', improvement: '+10kg', timeframe: 'Last 4 weeks' },
          { exercise: 'Squat', improvement: '+15kg', timeframe: 'Last 6 weeks' },
          { exercise: 'Deadlift', improvement: '+20kg', timeframe: 'Last 8 weeks' },
        ];

        setProgramData({
          program: activeProgram,
          workouts: userWorkouts,
          rotationCycles,
          weeklyProgress,
          exerciseFrequency,
          upcomingWorkouts,
          completionRate,
          averageWorkoutTime,
          strengthGains
        });

      } catch (error) {
        console.error('Error loading program data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load program overview data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadProgramData();
  }, [currentUser, navigate]);

  const handleStartWorkout = (workoutId: string) => {
    navigate(`/pre-workout?id=${workoutId}`);
  };

  const handleRegenerateProgram = () => {
    // This would trigger the program regeneration flow
    navigate('/?regenerate=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading program overview...</span>
        </div>
      </div>
    );
  }

  if (!programData) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No program data available</h2>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-background)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Program Overview</h1>
            <p className="text-muted-foreground">Comprehensive analysis of your training progress</p>
          </div>
        </div>

        {/* Enhanced Program Overview */}
        <EnhancedProgramOverview
          data={programData}
          onStartWorkout={handleStartWorkout}
          onRegenerateProgram={handleRegenerateProgram}
        />
      </div>
    </div>
  );
};

// Helper functions to generate mock data for demonstration
function generateRotationCycles(program: WorkoutProgram, workouts: Workout[]) {
  const cycles = [];
  
  for (let i = 1; i <= program.totalRotations; i++) {
    const cycleWorkouts = workouts.filter(w => w.rotation === i);
    const completedWorkouts = cycleWorkouts.filter(w => w.isCompleted);
    
    cycles.push({
      cycleNumber: i,
      weeks: [(i - 1) * 2 + 1, (i - 1) * 2 + 2],
      focus: getFocusForCycle(i),
      workoutsCompleted: completedWorkouts.length,
      totalWorkouts: cycleWorkouts.length,
      exercises: getExercisesForCycle(i),
      progressionNotes: getProgressionNotesForCycle(i)
    });
  }
  
  return cycles;
}

function generateWeeklyProgress(workouts: Workout[], analytics: any[]) {
  const progress = [];
  const totalWeeks = Math.max(...workouts.map(w => w.week), 1);
  
  for (let week = 1; week <= totalWeeks; week++) {
    const weekWorkouts = workouts.filter(w => w.week === week);
    const completedWorkouts = weekWorkouts.filter(w => w.isCompleted);
    
    progress.push({
      week,
      workoutsCompleted: completedWorkouts.length,
      totalWorkouts: weekWorkouts.length,
      volumeLifted: Math.random() * 5000 + 2000, // Mock data
      avgIntensity: Math.random() * 3 + 7 // Mock RPE 7-10
    });
  }
  
  return progress;
}

function generateExerciseFrequency(workouts: Workout[]) {
  const exercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull-ups', 'Rows'];
  const frequency: Record<string, any> = {};
  
  exercises.forEach((exercise, index) => {
    frequency[exercise] = {
      frequency: Math.floor(Math.random() * 20) + 5,
      lastPerformed: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      progressionTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as any
    };
  });
  
  return frequency;
}

function getFocusForCycle(cycle: number): string {
  const phases = ['Foundation Phase', 'Build Phase', 'Strength Phase', 'Peak Phase'];
  return phases[cycle - 1] || `Phase ${cycle}`;
}

function getExercisesForCycle(cycle: number): string[] {
  const exerciseGroups = [
    ['Bench Press', 'Squat', 'Row', 'Press'],
    ['Incline Press', 'Front Squat', 'Pull-ups', 'DB Press'],
    ['Close Grip Press', 'Box Squat', 'Barbell Row', 'Push Press'],
    ['Floor Press', 'Pin Squat', 'T-Bar Row', 'Seated Press']
  ];
  return exerciseGroups[cycle - 1] || exerciseGroups[0];
}

function getProgressionNotesForCycle(cycle: number): string {
  const notes = [
    'Focus on movement quality and establishing base strength',
    'Increase training volume and add variation',
    'Peak strength development with heavy loads',
    'Final peak phase with competition movements'
  ];
  return notes[cycle - 1] || 'Continue progressive overload';
}

export default ProgramOverview;