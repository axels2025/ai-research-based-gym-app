import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, CheckCircle, Target, TrendingUp, Scale } from "lucide-react";

type WeightUnit = 'kg' | 'lbs';

interface ExerciseInputProps {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  lastWeight?: number;
  suggestedWeight: number;
  onComplete: (weight: number, actualReps: number) => void;
  currentSet: number;
}

// Weight conversion constants
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

// Weight conversion functions
const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round((weight * KG_TO_LBS) * 4) / 4; // Round to nearest 0.25 lbs
  } else {
    return Math.round((weight * LBS_TO_KG) * 4) / 4; // Round to nearest 0.25 kg
  }
};

// Get weight increment based on unit
const getWeightIncrement = (unit: WeightUnit): number => {
  return unit === 'kg' ? 2.5 : 5;
};

// Format weight display
const formatWeight = (weight: number): string => {
  return weight % 1 === 0 ? weight.toString() : weight.toFixed(2);
};

export const ExerciseInput = ({ 
  exerciseName, 
  targetSets, 
  targetReps, 
  lastWeight = 0,
  suggestedWeight,
  onComplete,
  currentSet
}: ExerciseInputProps) => {
  // Get persisted weight unit for this exercise (default to lbs)
  const getStoredUnit = (): WeightUnit => {
    const stored = localStorage.getItem(`weight-unit-${exerciseName}`);
    return (stored === 'kg' || stored === 'lbs') ? stored : 'lbs';
  };

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(getStoredUnit());
  const [weight, setWeight] = useState(suggestedWeight > 0 ? suggestedWeight : 0);
  const [reps, setReps] = useState(targetReps);

  // Convert weight values to display unit
  const displayWeight = convertWeight(weight, 'lbs', weightUnit); // Internal storage is always lbs
  const displayLastWeight = lastWeight > 0 ? convertWeight(lastWeight, 'lbs', weightUnit) : 0;
  const displaySuggestedWeight = suggestedWeight > 0 ? convertWeight(suggestedWeight, 'lbs', weightUnit) : 0;
  const displayWeightIncrease = displaySuggestedWeight - displayLastWeight;

  // Update weight unit and save to localStorage
  const toggleWeightUnit = () => {
    const newUnit: WeightUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    setWeightUnit(newUnit);
    localStorage.setItem(`weight-unit-${exerciseName}`, newUnit);
  };

  // Handle weight changes with proper unit increment
  const handleWeightChange = (delta: number) => {
    const increment = getWeightIncrement(weightUnit);
    const currentDisplayWeight = convertWeight(weight, 'lbs', weightUnit);
    const newDisplayWeight = Math.max(0, currentDisplayWeight + (delta > 0 ? increment : -increment));
    const newInternalWeight = convertWeight(newDisplayWeight, weightUnit, 'lbs');
    setWeight(newInternalWeight);
  };

  const handleWeightInputChange = (value: number) => {
    // Convert from display unit to internal storage (lbs)
    const internalWeight = convertWeight(value, weightUnit, 'lbs');
    setWeight(internalWeight);
  };

  const handleRepsChange = (delta: number) => {
    setReps(Math.max(1, reps + delta));
  };

  const handleComplete = () => {
    onComplete(weight, reps); // Always store weight in lbs internally
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{exerciseName}</h2>
          <Badge variant="outline">
            Set {currentSet} of {targetSets}
          </Badge>
        </div>
        
        {displayLastWeight > 0 ? (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>Last: {formatWeight(displayLastWeight)} {weightUnit}</span>
            </div>
            {displayWeightIncrease > 0 && (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-4 h-4" />
                <span>+{formatWeight(displayWeightIncrease)} {weightUnit} progression</span>
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

      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Target: {targetReps} reps at {displaySuggestedWeight > 0 ? `${formatWeight(displaySuggestedWeight)} ${weightUnit}` : 'your starting weight'}
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