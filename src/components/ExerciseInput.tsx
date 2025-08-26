import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, CheckCircle, Target, TrendingUp } from "lucide-react";

interface ExerciseInputProps {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  lastWeight?: number;
  suggestedWeight: number;
  onComplete: (weight: number, actualReps: number) => void;
  currentSet: number;
}

export const ExerciseInput = ({ 
  exerciseName, 
  targetSets, 
  targetReps, 
  lastWeight = 0,
  suggestedWeight,
  onComplete,
  currentSet
}: ExerciseInputProps) => {
  // Use 0 as default if no suggested weight, user will need to input their starting weight
  const [weight, setWeight] = useState(suggestedWeight > 0 ? suggestedWeight : 0);
  const [reps, setReps] = useState(targetReps);

  const handleWeightChange = (delta: number) => {
    setWeight(Math.max(0, weight + delta));
  };

  const handleRepsChange = (delta: number) => {
    setReps(Math.max(1, reps + delta));
  };

  const handleComplete = () => {
    onComplete(weight, reps);
  };

  const weightIncrease = suggestedWeight - lastWeight;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{exerciseName}</h2>
          <Badge variant="outline">
            Set {currentSet} of {targetSets}
          </Badge>
        </div>
        
        {lastWeight > 0 ? (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>Last: {lastWeight} lbs</span>
            </div>
            {weightIncrease > 0 && (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-4 h-4" />
                <span>+{weightIncrease} lbs progression</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>First time?</strong> Start with a weight you can comfortably lift for all sets. We'll track your progress for next time!
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Weight Input */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Weight (lbs)</Label>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleWeightChange(-2.5)}
              className="h-12 w-12"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))}
              className="text-center text-xl font-bold h-12"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleWeightChange(2.5)}
              className="h-12 w-12"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Reps</Label>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleRepsChange(-1)}
              className="h-12 w-12"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input 
              type="number" 
              value={reps} 
              onChange={(e) => setReps(Number(e.target.value))}
              className="text-center text-xl font-bold h-12"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleRepsChange(1)}
              className="h-12 w-12"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Target: {targetReps} reps at {suggestedWeight} lbs
        </p>
      </div>

      <Button 
        onClick={handleComplete}
        className="w-full h-14 text-lg bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Complete Set
      </Button>
    </Card>
  );
};