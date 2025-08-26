import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { ProgramOverview } from "@/components/ProgramOverview";
import { ProgramRegenerationDialog } from "@/components/ProgramRegenerationDialog";
import { RotationStatus } from "@/components/RotationStatus";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dumbbell, Brain, TrendingUp, Zap, Settings, Sparkles, RotateCcw, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveProgram, getUserWorkouts, initializeDefaultProgram, type WorkoutProgram, type Workout } from "@/lib/firestore";
import { checkRegenerationEligibility } from "@/lib/programRegeneration";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/gym-hero.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegenerationDialog, setShowRegenerationDialog] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [regenerationReason, setRegenerationReason] = useState<string>('');

  useEffect(() => {
    async function loadUserData() {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Get active program
        const activeProgram = await getActiveProgram(currentUser.uid);
        
        if (!activeProgram) {
          // Initialize default program for new users
          const { program: newProgram, workouts: newWorkouts } = await initializeDefaultProgram(currentUser.uid);
          setProgram(newProgram);
          setWorkouts(newWorkouts);
        } else {
          setProgram(activeProgram);
          
          // Get workouts for this program
          const userWorkouts = await getUserWorkouts(currentUser.uid, activeProgram.id);
          setWorkouts(userWorkouts);
        }
        
        // Check regeneration eligibility
        if (activeProgram) {
          const eligibility = await checkRegenerationEligibility(currentUser.uid);
          setCanRegenerate(eligibility.canRegenerate);
          setRegenerationReason(eligibility.reason || '');
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load your program data. Using fallback.',
          variant: 'destructive',
        });
        
        // Fallback to mock data if there's an error
        setProgram({
          id: 'fallback',
          userId: currentUser.uid,
          name: "Strength & Hypertrophy Program",
          currentWeek: 1,
          totalWeeks: 8,
          workoutsCompleted: 0,
          totalWorkouts: 24,
          currentRotation: 1,
          totalRotations: 4,
          rotationCompletedWeeks: 0,
          isActive: true,
          regenerationCount: 0,
          aiGenerated: false,
          generationSource: 'default',
          createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
          updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
        });
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [currentUser]);

  const handleStartWorkout = (workoutId?: string) => {
    if (workoutId) {
      navigate(`/workout?id=${workoutId}`);
    } else {
      navigate("/workout");
    }
  };

  const handleRegenerationSuccess = (result: any) => {
    if (result.program) {
      setProgram(result.program);
    }
    if (result.workouts) {
      setWorkouts(result.workouts);
    }
    
    // Refresh eligibility status
    if (currentUser) {
      checkRegenerationEligibility(currentUser.uid).then((eligibility) => {
        setCanRegenerate(eligibility.canRegenerate);
        setRegenerationReason(eligibility.reason || '');
      });
    }
  };

  const handleRotationChange = () => {
    // Refresh program data when rotation changes
    if (currentUser && program) {
      getActiveProgram(currentUser.uid).then((updatedProgram) => {
        if (updatedProgram) {
          setProgram(updatedProgram);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-background)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-background/80" />
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Dumbbell className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Muscle Coach
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Research-based workout programs with AI-powered progression tracking. 
              Get stronger with science-backed weight suggestions and personalized coaching.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered
              </Badge>
              <Badge className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Progressive Overload
              </Badge>
              <Badge className="bg-gradient-to-r from-success to-success/80 text-success-foreground px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Research-Based
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Program Overview */}
          {loading ? (
            <div className="mb-12 animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ) : program ? (
            <div className="mb-12">
              <ProgramOverview
                programName={program.name}
                currentWeek={program.currentWeek}
                totalWeeks={program.totalWeeks}
                workoutsCompleted={program.workoutsCompleted}
                totalWorkouts={program.totalWorkouts}
                nextWorkout={workouts.find(w => !w.isCompleted)?.title || "No upcoming workouts"}
                program={program}
              />
            </div>
          ) : null}

          {/* Rotation Status */}
          {program && currentUser && (
            <div className="mb-8">
              <RotationStatus 
                program={program} 
                userId={currentUser.uid}
                onRotationChange={handleRotationChange}
              />
            </div>
          )}

          {/* Current Week Workouts */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">This Week's Workouts</h2>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={canRegenerate ? "default" : "outline"}
                        onClick={() => setShowRegenerationDialog(true)}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate New Program
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {canRegenerate 
                          ? `Ready for regeneration! ${regenerationReason}`
                          : regenerationReason || 'Create a new AI-powered workout program'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Program Settings
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : workouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map((workout, index) => (
                  <WorkoutCard
                    key={workout.id}
                    title={workout.title}
                    week={workout.week}
                    day={workout.day}
                    exercises={workout.exercises}
                    estimatedTime={workout.estimatedTime}
                    isActive={!workout.isCompleted && index === 0}
                    onStart={() => handleStartWorkout(workout.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Workouts Available</h3>
                    <p className="text-muted-foreground max-w-md">
                      It looks like you don't have any workouts in your current program. 
                      Generate a new AI-powered program to get started!
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowRegenerationDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate AI Program
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* AI Insights */}
          <Card className="p-8 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="flex items-start gap-6">
              <div className="p-3 bg-gradient-to-r from-accent to-accent/80 rounded-full">
                <Brain className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">AI Training Insights</h3>
                <p className="text-muted-foreground mb-4">
                  Based on your recent performance, here are some personalized recommendations:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
                    <span>Your bench press progression is excellent - consider adding 5lbs next week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                    <span>Rest times between squats could be increased to 3 minutes for better recovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Your shoulder mobility has improved - ready for overhead press progression</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Program Regeneration Dialog */}
      {currentUser && (
        <ProgramRegenerationDialog
          open={showRegenerationDialog}
          onOpenChange={setShowRegenerationDialog}
          userId={currentUser.uid}
          currentProgram={program}
          onSuccess={handleRegenerationSuccess}
        />
      )}
    </div>
  );
};

export default Index;