import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  Brain, 
  Sparkles, 
  RotateCcw,
  Activity,
  Zap,
  Award,
  ChevronRight,
  BarChart3,
  Timer
} from "lucide-react";
import { type WorkoutProgram, type Workout } from "@/lib/firestore";

interface WeeklyProgressData {
  week: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  volumeLifted: number;
  avgIntensity: number;
}

interface RotationCycle {
  cycleNumber: number;
  weeks: number[];
  focus: string;
  workoutsCompleted: number;
  totalWorkouts: number;
  exercises: string[];
  progressionNotes: string;
}

interface ExerciseFrequencyMap {
  [exerciseName: string]: {
    frequency: number;
    lastPerformed: Date;
    progressionTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

interface ProgramOverviewData {
  program: WorkoutProgram;
  workouts: Workout[];
  rotationCycles: RotationCycle[];
  weeklyProgress: WeeklyProgressData[];
  exerciseFrequency: ExerciseFrequencyMap;
  upcomingWorkouts: Workout[];
  completionRate: number;
  averageWorkoutTime: number;
  strengthGains: {
    exercise: string;
    improvement: string;
    timeframe: string;
  }[];
}

interface EnhancedProgramOverviewProps {
  data: ProgramOverviewData;
  onStartWorkout: (workoutId: string) => void;
  onRegenerateProgram: () => void;
}

export const EnhancedProgramOverview = ({ 
  data, 
  onStartWorkout, 
  onRegenerateProgram 
}: EnhancedProgramOverviewProps) => {
  const { program, rotationCycles, weeklyProgress, upcomingWorkouts } = data;
  const progressPercentage = (program.workoutsCompleted / program.totalWorkouts) * 100;
  const currentCycle = rotationCycles[program.currentRotation - 1];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground">Research-based progression program</p>
              <div className="flex items-center gap-1">
                {program.aiGenerated && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    AI Generated
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Rotation {program.currentRotation}/{program.totalRotations}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-gradient-to-r from-accent to-accent/80 text-lg px-4 py-2">
              Week {program.currentWeek}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(progressPercentage)}% Complete
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {program.workoutsCompleted}/{program.totalWorkouts} workouts
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Week</span>
            </div>
            <p className="text-2xl font-bold">{program.currentWeek}/{program.totalWeeks}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Completion</span>
            </div>
            <p className="text-2xl font-bold">{data.completionRate}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Timer className="w-4 h-4" />
              <span className="text-sm">Avg Time</span>
            </div>
            <p className="text-2xl font-bold">{data.averageWorkoutTime}min</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Award className="w-4 h-4" />
              <span className="text-sm">Streak</span>
            </div>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rotations">Rotations</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Cycle */}
          {currentCycle && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Current Cycle: {currentCycle.focus}</h3>
                <Badge variant="outline">
                  Weeks {currentCycle.weeks.join('-')}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Workouts Completed</p>
                  <p className="text-lg font-semibold">{currentCycle.workoutsCompleted}/{currentCycle.totalWorkouts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Focus Area</p>
                  <p className="text-lg font-semibold">{currentCycle.focus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rotation Progress</p>
                  <Progress 
                    value={(currentCycle.workoutsCompleted / currentCycle.totalWorkouts) * 100} 
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{currentCycle.progressionNotes}</p>
            </Card>
          )}

          {/* Upcoming Workouts */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Upcoming Workouts</h3>
            <div className="space-y-3">
              {upcomingWorkouts.slice(0, 3).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{workout.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Week {workout.week} • Day {workout.day} • {workout.exercises} exercises • {workout.estimatedTime}min
                    </p>
                  </div>
                  <Button 
                    onClick={() => onStartWorkout(workout.id)}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    Start
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Strength Gains */}
          {data.strengthGains.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Recent Progress
              </h3>
              <div className="space-y-3">
                {data.strengthGains.slice(0, 3).map((gain, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">{gain.exercise}</p>
                      <p className="text-sm text-muted-foreground">{gain.timeframe}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      {gain.improvement}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rotations" className="space-y-4">
          <div className="grid gap-4">
            {rotationCycles.map((cycle) => (
              <Card key={cycle.cycleNumber} className={`p-6 ${
                cycle.cycleNumber === program.currentRotation ? 'ring-2 ring-primary' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Cycle {cycle.cycleNumber}: {cycle.focus}</h3>
                    <p className="text-sm text-muted-foreground">Weeks {cycle.weeks.join('-')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cycle.cycleNumber === program.currentRotation && (
                      <Badge>Current</Badge>
                    )}
                    {cycle.cycleNumber < program.currentRotation && (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <Progress 
                      value={(cycle.workoutsCompleted / cycle.totalWorkouts) * 100} 
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {cycle.workoutsCompleted}/{cycle.totalWorkouts} workouts
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Key Exercises</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cycle.exercises.slice(0, 3).map((exercise) => (
                        <Badge key={exercise} variant="outline" className="text-xs">
                          {exercise}
                        </Badge>
                      ))}
                      {cycle.exercises.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{cycle.exercises.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">{cycle.progressionNotes}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {/* Weekly Progress Chart */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Progress
            </h3>
            <div className="space-y-4">
              {weeklyProgress.map((week) => (
                <div key={week.week} className="flex items-center gap-4">
                  <div className="w-16">
                    <p className="text-sm font-medium">Week {week.week}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Workouts: {week.workoutsCompleted}/{week.totalWorkouts}</span>
                      <span>{Math.round((week.workoutsCompleted / week.totalWorkouts) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(week.workoutsCompleted / week.totalWorkouts) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-medium">{week.volumeLifted}kg</p>
                    <p className="text-xs text-muted-foreground">volume</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Exercise Frequency */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Exercise Frequency</h3>
            <div className="space-y-3">
              {Object.entries(data.exerciseFrequency).slice(0, 6).map(([exercise, data]) => (
                <div key={exercise} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">{exercise}</p>
                    <p className="text-sm text-muted-foreground">
                      Last performed: {data.lastPerformed.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{data.frequency}x</p>
                    <Badge 
                      variant={
                        data.progressionTrend === 'increasing' ? 'default' : 
                        data.progressionTrend === 'stable' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {data.progressionTrend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Consistency Score</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Strength Progress</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Volume Progression</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Insights
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">
                    Your squat strength has increased by 15% over the last 4 weeks. Consider progressing to a more challenging variation.
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm">
                    Excellent consistency! You've completed 90% of scheduled workouts this month.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm">
                    Consider adding more upper body volume in the next rotation for balanced development.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Program Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Program Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={onRegenerateProgram}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Sparkles className="w-4 h-4" />
                Regenerate Program
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};