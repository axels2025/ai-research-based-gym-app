import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Clock, Sun, Sunrise, Sunset, Moon } from 'lucide-react';

interface TimePreference {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface TimePreferenceSelectorProps {
  selectedTimes: string[];
  onChange: (selectedTimes: string[]) => void;
  title: string;
  description?: string;
}

const timePreferences: TimePreference[] = [
  {
    value: 'early-morning',
    label: 'Early Morning',
    icon: <Sunrise className="w-5 h-5" />,
    description: '5:00 AM - 7:00 AM',
  },
  {
    value: 'morning',
    label: 'Morning',
    icon: <Sun className="w-5 h-5" />,
    description: '7:00 AM - 11:00 AM',
  },
  {
    value: 'afternoon',
    label: 'Afternoon',
    icon: <Sun className="w-5 h-5" />,
    description: '11:00 AM - 5:00 PM',
  },
  {
    value: 'evening',
    label: 'Evening',
    icon: <Sunset className="w-5 h-5" />,
    description: '5:00 PM - 8:00 PM',
  },
  {
    value: 'night',
    label: 'Night',
    icon: <Moon className="w-5 h-5" />,
    description: '8:00 PM - 11:00 PM',
  },
];

const daysOfWeek = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

interface ExtendedTimePreferenceSelectorProps extends TimePreferenceSelectorProps {
  selectedDays: string[];
  onDaysChange: (selectedDays: string[]) => void;
  flexibleSchedule: boolean;
  onFlexibleChange: (flexible: boolean) => void;
}

export function TimePreferenceSelector({
  selectedTimes,
  onChange,
  selectedDays,
  onDaysChange,
  flexibleSchedule,
  onFlexibleChange,
  title,
  description,
}: ExtendedTimePreferenceSelectorProps) {
  const handleTimeToggle = (timeValue: string) => {
    if (selectedTimes.includes(timeValue)) {
      onChange(selectedTimes.filter(time => time !== timeValue));
    } else {
      onChange([...selectedTimes, timeValue]);
    }
  };

  const handleDayToggle = (dayValue: string) => {
    if (selectedDays.includes(dayValue)) {
      onDaysChange(selectedDays.filter(day => day !== dayValue));
    } else {
      onDaysChange([...selectedDays, dayValue]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Preferences */}
      <div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {timePreferences.map((time) => (
            <Card
              key={time.value}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedTimes.includes(time.value) && "border-primary bg-primary/5"
              )}
              onClick={() => handleTimeToggle(time.value)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="text-primary">{time.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{time.label}</h4>
                      {selectedTimes.includes(time.value) && (
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {time.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Days */}
      <div>
        <h3 className="font-semibold text-lg mb-2">Available Days</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select the days you're typically available for workouts
        </p>

        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map((day) => (
            <Button
              key={day.value}
              variant={selectedDays.includes(day.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleDayToggle(day.value)}
              className="w-12 h-12 p-0"
            >
              {day.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Flexible Schedule */}
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="flexible"
            checked={flexibleSchedule}
            onCheckedChange={onFlexibleChange}
          />
          <label htmlFor="flexible" className="text-sm font-medium">
            I have a flexible schedule
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          Check this if your workout times can vary from week to week
        </p>
      </div>

      {/* Summary */}
      {(selectedTimes.length > 0 || selectedDays.length > 0) && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Your Preferences:</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            {selectedTimes.length > 0 && (
              <p>
                <strong>Preferred Times:</strong> {selectedTimes.join(', ')}
              </p>
            )}
            {selectedDays.length > 0 && (
              <p>
                <strong>Available Days:</strong> {selectedDays.length} days selected
              </p>
            )}
            {flexibleSchedule && (
              <p>
                <strong>Schedule:</strong> Flexible timing
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}