import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, TrendingUp, Clock } from "lucide-react";

interface ProgramOverviewProps {
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  nextWorkout: string;
}

export const ProgramOverview = ({
  programName,
  currentWeek,
  totalWeeks,
  workoutsCompleted,
  totalWorkouts,
  nextWorkout
}: ProgramOverviewProps) => {
  const progressPercentage = (workoutsCompleted / totalWorkouts) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">{programName}</h2>
          <p className="text-muted-foreground">Research-based progression program</p>
        </div>
        <Badge className="bg-gradient-to-r from-accent to-accent/80">
          Week {currentWeek}
        </Badge>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Program Progress</span>
            <span className="text-sm text-muted-foreground">
              {workoutsCompleted}/{totalWorkouts} workouts
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Current Week</span>
          </div>
          <p className="text-2xl font-bold">{currentWeek}/{totalWeeks}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span className="text-sm">Completion</span>
          </div>
          <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
        </div>
      </div>

      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">Next Workout</span>
        </div>
        <p className="text-lg font-semibold">{nextWorkout}</p>
      </div>
    </Card>
  );
};