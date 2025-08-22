import { useState } from 'react';
import { OnboardingLayout } from '../OnboardingLayout';
import { TimePreferenceSelector } from '../TimePreferenceSelector';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { Availability, PreferredTime } from '@/lib/userProfiles';

export function Step4AvailabilitySchedule() {
  const { profile, saveStepData, nextStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Availability>({
    sessionsPerWeek: profile?.availability?.sessionsPerWeek || 3,
    sessionDuration: profile?.availability?.sessionDuration || 60,
    preferredTimes: profile?.availability?.preferredTimes || [],
    availableDays: profile?.availability?.availableDays || [],
    flexibleSchedule: profile?.availability?.flexibleSchedule || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sessionsPerWeek || formData.sessionsPerWeek < 1 || formData.sessionsPerWeek > 7) {
      newErrors.sessionsPerWeek = 'Please select between 1 and 7 sessions per week';
    }

    if (!formData.sessionDuration || formData.sessionDuration < 15 || formData.sessionDuration > 180) {
      newErrors.sessionDuration = 'Please select a session duration between 15 and 180 minutes';
    }

    if (!formData.preferredTimes.length) {
      newErrors.preferredTimes = 'Please select at least one preferred time';
    }

    if (!formData.availableDays.length) {
      newErrors.availableDays = 'Please select at least one available day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete required fields",
        description: "Make sure you've set your availability preferences.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await saveStepData({
        availability: formData,
      });
      nextStep();
    } catch (error) {
      toast({
        title: "Error saving data",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSessionFrequencyText = (sessions: number) => {
    if (sessions === 1) return '1 session per week';
    if (sessions <= 3) return `${sessions} sessions per week`;
    if (sessions <= 5) return `${sessions} sessions per week`;
    return `${sessions} sessions per week`;
  };

  const getDurationText = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes === 60) return '1 hour';
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <OnboardingLayout
      title="When can you work out?"
      description="Let's plan your workout schedule around your availability"
      onNext={handleNext}
      isLoading={loading}
    >
      <div className="space-y-8">
        {/* Sessions Per Week */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Workout Frequency</Label>
            <p className="text-sm text-muted-foreground">
              How many days per week can you commit to working out?
            </p>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {getSessionFrequencyText(formData.sessionsPerWeek)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommended for consistent progress
                  </p>
                </div>
                
                <Slider
                  value={[formData.sessionsPerWeek]}
                  onValueChange={(value) => 
                    setFormData({ ...formData, sessionsPerWeek: value[0] })
                  }
                  max={7}
                  min={1}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 day</span>
                  <span>3 days</span>
                  <span>5 days</span>
                  <span>7 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {errors.sessionsPerWeek && (
            <p className="text-xs text-destructive">{errors.sessionsPerWeek}</p>
          )}
        </div>

        {/* Session Duration */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Session Duration</Label>
            <p className="text-sm text-muted-foreground">
              How long do you want each workout session to be?
            </p>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {getDurationText(formData.sessionDuration)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Per workout session
                  </p>
                </div>
                
                <Slider
                  value={[formData.sessionDuration]}
                  onValueChange={(value) => 
                    setFormData({ ...formData, sessionDuration: value[0] })
                  }
                  max={180}
                  min={15}
                  step={15}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 min</span>
                  <span>45 min</span>
                  <span>90 min</span>
                  <span>3 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {errors.sessionDuration && (
            <p className="text-xs text-destructive">{errors.sessionDuration}</p>
          )}
        </div>

        {/* Time Preferences and Available Days */}
        <div>
          <TimePreferenceSelector
            selectedTimes={formData.preferredTimes}
            onChange={(selectedTimes) => 
              setFormData({ ...formData, preferredTimes: selectedTimes as PreferredTime[] })
            }
            selectedDays={formData.availableDays}
            onDaysChange={(selectedDays) => 
              setFormData({ ...formData, availableDays: selectedDays })
            }
            flexibleSchedule={formData.flexibleSchedule}
            onFlexibleChange={(flexible) => 
              setFormData({ ...formData, flexibleSchedule: flexible })
            }
            title="Preferred Workout Times"
            description="When do you prefer to work out? Select all that apply."
          />
          {(errors.preferredTimes || errors.availableDays) && (
            <div className="mt-2 space-y-1">
              {errors.preferredTimes && (
                <p className="text-xs text-destructive">{errors.preferredTimes}</p>
              )}
              {errors.availableDays && (
                <p className="text-xs text-destructive">{errors.availableDays}</p>
              )}
            </div>
          )}
        </div>

        {/* Schedule Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Your Workout Schedule Summary:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency:</span>
                <span className="font-medium">{getSessionFrequencyText(formData.sessionsPerWeek)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{getDurationText(formData.sessionDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weekly Time:</span>
                <span className="font-medium">
                  {getDurationText(formData.sessionsPerWeek * formData.sessionDuration)}
                </span>
              </div>
              {formData.preferredTimes.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Times:</span>
                  <span className="font-medium">{formData.preferredTimes.length} time slots</span>
                </div>
              )}
              {formData.availableDays.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Days:</span>
                  <span className="font-medium">{formData.availableDays.length} days</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
}