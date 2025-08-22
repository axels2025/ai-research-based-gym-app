import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Goal {
  value: string;
  label: string;
  icon: string;
}

interface MultiSelectGoalsProps {
  goals: Goal[];
  selectedGoals: string[];
  onChange: (selectedGoals: string[]) => void;
  maxSelections?: number;
  title: string;
  description?: string;
}

export function MultiSelectGoals({
  goals,
  selectedGoals,
  onChange,
  maxSelections = 3,
  title,
  description,
}: MultiSelectGoalsProps) {
  const handleGoalToggle = (goalValue: string) => {
    if (selectedGoals.includes(goalValue)) {
      // Remove the goal
      onChange(selectedGoals.filter(goal => goal !== goalValue));
    } else if (selectedGoals.length < maxSelections) {
      // Add the goal if under the limit
      onChange([...selectedGoals, goalValue]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">
            {selectedGoals.length} of {maxSelections} selected
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {goals.map((goal) => (
          <Button
            key={goal.value}
            variant="outline"
            className={cn(
              "h-auto p-4 flex-col space-y-2 relative transition-all",
              selectedGoals.includes(goal.value) && "border-primary bg-primary/5 text-primary",
              selectedGoals.length >= maxSelections && 
              !selectedGoals.includes(goal.value) && 
              "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleGoalToggle(goal.value)}
            disabled={selectedGoals.length >= maxSelections && !selectedGoals.includes(goal.value)}
          >
            <div className="text-2xl">{goal.icon}</div>
            <div className="text-sm font-medium text-center leading-tight">
              {goal.label}
            </div>
            {selectedGoals.includes(goal.value) && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
              </div>
            )}
          </Button>
        ))}
      </div>

      {selectedGoals.length >= maxSelections && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum selections reached. Deselect a goal to choose a different one.
        </p>
      )}
    </div>
  );
}