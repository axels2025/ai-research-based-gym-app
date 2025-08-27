import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, CheckCircle, Target, TrendingUp, Scale, Timer, Flame, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  getCoachingTips,
  getScientificRestDuration,
  type WarmupSet,
  type WorkingSet 
} from "@/lib/researchBasedWorkout";

type WeightUnit = 'kg' | 'lbs';
type SetPhase = 'warmup' | 'working';

interface EnhancedExerciseInputProps {
  exerciseName: string;
  warmupSets: WarmupSet[];
  workingSets: WorkingSet[];
  currentSetIndex: number; // Overall set index (warmup + working combined)
  onSetComplete: (weight: number, actualReps: number, rpe?: number) => void;
  onSkipSet: () => void;
}

// Weight conversion constants and functions (same as original ExerciseInput)
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round((weight * KG_TO_LBS) * 4) / 4;
  } else {
    return Math.round((weight * LBS_TO_KG) * 4) / 4;
  }
};

const getWeightIncrement = (unit: WeightUnit): number => {
  return unit === 'kg' ? 2.5 : 5;
};

const formatWeight = (weight: number): string => {
  return weight % 1 === 0 ? weight.toString() : weight.toFixed(2);
};

export const EnhancedExerciseInput = ({
  exerciseName,
  warmupSets,
  workingSets,
  currentSetIndex,
  onSetComplete,
  onSkipSet
}: EnhancedExerciseInputProps) => {
  const allSets = [...warmupSets, ...workingSets];
  const currentSet = allSets[currentSetIndex];
  const totalSets = allSets.length;
  
  // Determine current phase and set details
  const currentPhase: SetPhase = currentSetIndex < warmupSets.length ? 'warmup' : 'working';
  const currentPhaseIndex = currentPhase === 'warmup' 
    ? currentSetIndex 
    : currentSetIndex - warmupSets.length;
  
  // Get persisted weight unit
  const getStoredUnit = (): WeightUnit => {
    const stored = localStorage.getItem(`weight-unit-${exerciseName}`);
    return (stored === 'kg' || stored === 'lbs') ? stored : 'kg';
  };

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(getStoredUnit());
  const [weight, setWeight] = useState(currentSet?.weight || 0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState<number | undefined>();

  // Update weight unit and save to localStorage
  const toggleWeightUnit = () => {
    const newUnit: WeightUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    setWeightUnit(newUnit);
    localStorage.setItem(`weight-unit-${exerciseName}`, newUnit);
  };

  // Convert weight values to display unit (internal storage is always kg)
  const displayWeight = convertWeight(weight, 'kg', weightUnit);
  
  // Update state when currentSet changes
  useEffect(() => {
    if (currentSet) {
      setWeight(currentSet.weight);
      
      // Parse target reps (handle both string ranges like "6-8" and numbers)
      const targetRepsStr = currentSet.reps.toString();
      if (targetRepsStr.includes('-')) {
        const [min] = targetRepsStr.split('-').map(Number);
        setReps(min);
      } else {
        setReps(Number(targetRepsStr));
      }
    }
  }, [currentSet, currentSetIndex]);

  // Handle weight changes with proper unit increment
  const handleWeightChange = (delta: number) => {
    const increment = getWeightIncrement(weightUnit);
    const currentDisplayWeight = convertWeight(weight, 'kg', weightUnit);
    const newDisplayWeight = Math.max(0, currentDisplayWeight + (delta > 0 ? increment : -increment));
    const newInternalWeight = convertWeight(newDisplayWeight, weightUnit, 'kg');
    setWeight(newInternalWeight);
  };

  const handleWeightInputChange = (value: number) => {
    const internalWeight = convertWeight(value, weightUnit, 'kg');
    setWeight(internalWeight);
  };

  const handleRepsChange = (delta: number) => {
    setReps(Math.max(1, reps + delta));
  };

  const handleComplete = () => {
    onSetComplete(weight, reps, rpe);
  };

  if (!currentSet) {
    return null;
  }

  // Get coaching tips for current set
  const coachingTips = getCoachingTips(
    currentSet.type,
    'percentage' in currentSet ? currentSet.percentage : undefined,
    'stage' in currentSet ? currentSet.stage : undefined
  );

  const progress = ((currentSetIndex) / totalSets) * 100;

  // Phase-specific styling
  const phaseStyles = {
    warmup: {
      gradient: "from-orange-500/20 to-orange-600/20",
      badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
      iconColor: "text-orange-600",
      icon: Flame
    },
    working: {
      gradient: "from-blue-500/20 to-blue-600/20", 
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      iconColor: "text-blue-600",
      icon: Zap
    }
  };

  const phaseStyle = phaseStyles[currentPhase];
  const PhaseIcon = phaseStyle.icon;

  return (
    <Card className={`p-6 bg-gradient-to-br ${phaseStyle.gradient} border-2 border-primary/20`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <PhaseIcon className={`w-6 h-6 ${phaseStyle.iconColor}`} />
            <h2 className="text-2xl font-bold">{exerciseName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={phaseStyle.badgeColor}>
              {currentPhase === 'warmup' ? 'Warm-up' : 'Working Set'}
            </Badge>
            <Badge variant="outline">
              Set {currentSetIndex + 1} of {totalSets}
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Workout Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Set Description */}
        <div className="p-3 bg-card/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" />
            <span className="font-medium">Current Set:</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentSet.description}
          </p>
          {'percentage' in currentSet && currentSet.percentage && (
            <p className="text-xs text-muted-foreground mt-1">
              {currentSet.percentage}% of working weight
            </p>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Weight Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">Weight ({weightUnit})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleWeightUnit}
              className="h-6 px-2 text-xs"
            >
              <Scale className="w-3 h-3 mr-1" />
              {weightUnit === 'kg' ? 'LBS' : 'KG'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleWeightChange(-1)}
              className="h-12 w-12"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input 
              type="number" 
              value={formatWeight(displayWeight)} 
              onChange={(e) => handleWeightInputChange(Number(e.target.value))}
              className="text-center text-xl font-bold h-12"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleWeightChange(1)}
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

      {/* RPE Input for Working Sets */}
      {currentPhase === 'working' && (
        <div className="mb-6">
          <Label className="text-lg font-semibold mb-3 block">
            Rate of Perceived Exertion (RPE) - Optional
          </Label>
          <div className="flex gap-2">
            {[6, 7, 8, 9, 10].map((rating) => (
              <Button
                key={rating}
                variant={rpe === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setRpe(rating)}
                className="flex-1"
              >
                {rating}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            6=Easy, 7=Moderate, 8=Hard, 9=Very Hard, 10=Max Effort
          </p>
        </div>
      )}

      {/* Target Info */}
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Target: {currentSet.reps} reps at {formatWeight(convertWeight(currentSet.weight, 'kg', weightUnit))} {weightUnit}
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            <span>Rest: {Math.floor(currentSet.restTime / 60)}:{(currentSet.restTime % 60).toString().padStart(2, '0')}</span>
          </div>
          {'targetRPE' in currentSet && currentSet.targetRPE && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>Target RPE: {currentSet.targetRPE}</span>
            </div>
          )}
        </div>
      </div>

      {/* Coaching Tips */}
      {coachingTips.length > 0 && (
        <Alert className="mb-4">
          <Target className="w-4 h-4" />
          <AlertDescription>
            <strong>Form Focus:</strong> {coachingTips[0]}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleComplete}
          className="flex-1 h-14 text-lg bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Complete Set
        </Button>
        
        <Button 
          onClick={onSkipSet}
          variant="outline"
          className="px-6"
        >
          Skip
        </Button>
      </div>
    </Card>
  );
};