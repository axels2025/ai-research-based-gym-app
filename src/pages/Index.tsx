import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { ProgramOverview } from "@/components/ProgramOverview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Brain, TrendingUp, Zap, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/gym-hero.jpg";

const mockWorkouts = [
  {
    title: "Push Day - Upper Body",
    week: 1,
    day: 1,
    exercises: 6,
    estimatedTime: 75,
    isActive: true
  },
  {
    title: "Pull Day - Back & Biceps",
    week: 1,
    day: 2,
    exercises: 5,
    estimatedTime: 65,
    isActive: false
  },
  {
    title: "Legs & Core",
    week: 1,
    day: 3,
    exercises: 7,
    estimatedTime: 85,
    isActive: false
  }
];

const Index = () => {
  const navigate = useNavigate();

  const handleStartWorkout = () => {
    navigate("/workout");
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
          <div className="mb-12">
            <ProgramOverview
              programName="Strength & Hypertrophy Program"
              currentWeek={1}
              totalWeeks={6}
              workoutsCompleted={3}
              totalWorkouts={18}
              nextWorkout="Push Day - Upper Body"
            />
          </div>

          {/* Current Week Workouts */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">This Week's Workouts</h2>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Program Settings
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockWorkouts.map((workout, index) => (
                <WorkoutCard
                  key={index}
                  title={workout.title}
                  week={workout.week}
                  day={workout.day}
                  exercises={workout.exercises}
                  estimatedTime={workout.estimatedTime}
                  isActive={workout.isActive}
                  onStart={handleStartWorkout}
                />
              ))}
            </div>
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
    </div>
  );
};

export default Index;