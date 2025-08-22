import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Target } from "lucide-react";

interface WorkoutCardProps {
  title: string;
  week: number;
  day: number;
  exercises: number;
  estimatedTime: number;
  isActive?: boolean;
  onStart: () => void;
}

export const WorkoutCard = ({ 
  title, 
  week, 
  day, 
  exercises, 
  estimatedTime, 
  isActive = false,
  onStart 
}: WorkoutCardProps) => {
  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-lg ${
      isActive ? 'ring-2 ring-primary shadow-[var(--shadow-glow)]' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{title}</h3>
          <p className="text-muted-foreground">Week {week} • Day {day}</p>
        </div>
        {isActive && (
          <div className="px-3 py-1 bg-gradient-to-r from-accent to-accent/80 rounded-full">
            <span className="text-accent-foreground text-sm font-medium">Active</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>{exercises} exercises</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{estimatedTime} min estimated</span>
        </div>
      </div>
      
      <Button 
        onClick={onStart}
        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Workout
      </Button>
    </Card>
  );
};