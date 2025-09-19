import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Plus, Minus, Check, X } from 'lucide-react';

interface WeightAdjustmentControlsProps {
  exerciseName: string;
  currentWeight: number;
  suggestedWeight?: number;
  onWeightChange: (newWeight: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WeightAdjustmentControls: React.FC<WeightAdjustmentControlsProps> = ({
  exerciseName,
  currentWeight,
  suggestedWeight,
  onWeightChange,
  onConfirm,
  onCancel
}) => {
  const [tempWeight, setTempWeight] = useState(currentWeight);
  const [showWarning, setShowWarning] = useState(false);

  const validateWeight = (weight: number): { isValid: boolean; warning?: string } => {
    if (weight <= 0) {
      return { isValid: false, warning: 'Weight must be greater than 0kg' };
    }
    
    if (weight > 300) {
      return { isValid: false, warning: 'Weight seems extremely high. Please double-check.' };
    }
    
    if (suggestedWeight && weight > suggestedWeight * 1.5) {
      return { 
        isValid: true, 
        warning: `This is 50% heavier than suggested (${suggestedWeight}kg). Are you sure?` 
      };
    }
    
    // Check for dangerous jumps from last weight
    const jumpPercentage = suggestedWeight ? ((weight - suggestedWeight) / suggestedWeight) * 100 : 0;
    if (jumpPercentage > 20) {
      return {
        isValid: true,
        warning: `This is ${Math.round(jumpPercentage)}% heavier than suggested. Consider a smaller increase.`
      };
    }
    
    return { isValid: true };
  };

  const handleWeightChange = (newWeight: number) => {
    setTempWeight(newWeight);
    const validation = validateWeight(newWeight);
    setShowWarning(!!validation.warning);
    onWeightChange(newWeight);
  };

  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(0, tempWeight + delta);
    handleWeightChange(newWeight);
  };

  const validation = validateWeight(tempWeight);

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="font-medium mb-3">Adjust Weight for {exerciseName}</h3>
      
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustWeight(-2.5)}
          disabled={tempWeight <= 2.5}
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <Input
          type="number"
          value={tempWeight}
          onChange={(e) => handleWeightChange(Number(e.target.value))}
          className="w-20 text-center"
          step="2.5"
          min="0"
        />
        <span className="text-sm text-muted-foreground">kg</span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustWeight(2.5)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {suggestedWeight && (
        <div className="text-sm text-muted-foreground mb-3">
          Suggested: {suggestedWeight}kg
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleWeightChange(suggestedWeight)}
            className="ml-2 h-6 px-2 text-xs"
          >
            Use Suggested
          </Button>
        </div>
      )}

      {validation.warning && (
        <Alert className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {validation.warning}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={!validation.isValid}
          className="flex-1"
          size="sm"
        >
          <Check className="w-3 h-3 mr-1" />
          Confirm
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          size="sm"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
};