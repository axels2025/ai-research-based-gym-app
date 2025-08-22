import { useState } from 'react';
import { OnboardingLayout } from '../OnboardingLayout';
import { MultiSelectGoals } from '../MultiSelectGoals';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { defaultOptions, type Goals, type PrimaryGoal, type SecondaryGoal } from '@/lib/userProfiles';

export function Step2GoalsTimeline() {
  const { profile, saveStepData, nextStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Goals>({
    primaryGoals: profile?.goals?.primaryGoals || [],
    secondaryGoals: profile?.goals?.secondaryGoals || [],
    targetTimeline: profile?.goals?.targetTimeline || 6,
    bodyCompositionGoals: profile?.goals?.bodyCompositionGoals || {},
    specificGoals: profile?.goals?.specificGoals || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.primaryGoals.length) {
      newErrors.primaryGoals = 'Please select at least one primary goal';
    }

    if (!formData.targetTimeline || formData.targetTimeline < 1 || formData.targetTimeline > 24) {
      newErrors.targetTimeline = 'Please select a valid timeline between 1 and 24 months';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete required fields",
        description: "Make sure you've selected your primary goals and timeline.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await saveStepData({
        goals: formData,
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

  const timelineLabels = {
    1: '1 month',
    3: '3 months',
    6: '6 months',
    12: '1 year',
    18: '1.5 years',
    24: '2 years',
  };

  const getTimelineLabel = (months: number) => {
    if (months <= 1) return '1 month';
    if (months <= 3) return `${months} months`;
    if (months <= 12) return `${months} months`;
    if (months <= 18) return `${(months / 12).toFixed(1)} years`;
    return `${(months / 12).toFixed(1)} years`;
  };

  return (
    <OnboardingLayout
      title="What are your fitness goals?"
      description="Help us understand what you want to achieve so we can create the perfect program for you"
      onNext={handleNext}
      isLoading={loading}
    >
      <div className="space-y-8">
        {/* Primary Goals */}
        <div>
          <MultiSelectGoals
            goals={defaultOptions.primaryGoals}
            selectedGoals={formData.primaryGoals}
            onChange={(selectedGoals) => 
              setFormData({ ...formData, primaryGoals: selectedGoals as PrimaryGoal[] })
            }
            maxSelections={3}
            title="Primary Goals"
            description="Choose up to 3 main objectives (these will be the focus of your program)"
          />
          {errors.primaryGoals && (
            <p className="text-xs text-destructive mt-2">{errors.primaryGoals}</p>
          )}
        </div>

        {/* Secondary Goals */}
        <div>
          <MultiSelectGoals
            goals={defaultOptions.secondaryGoals}
            selectedGoals={formData.secondaryGoals}
            onChange={(selectedGoals) => 
              setFormData({ ...formData, secondaryGoals: selectedGoals as SecondaryGoal[] })
            }
            maxSelections={3}
            title="Secondary Goals"
            description="Optional: Choose additional benefits you'd like to achieve"
          />
        </div>

        {/* Target Timeline */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Target Timeline</Label>
            <p className="text-sm text-muted-foreground">
              How long do you want to work toward these goals?
            </p>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {getTimelineLabel(formData.targetTimeline)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your target timeline
                  </p>
                </div>
                
                <Slider
                  value={[formData.targetTimeline]}
                  onValueChange={(value) => 
                    setFormData({ ...formData, targetTimeline: value[0] })
                  }
                  max={24}
                  min={1}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 month</span>
                  <span>6 months</span>
                  <span>1 year</span>
                  <span>2 years</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {errors.targetTimeline && (
            <p className="text-xs text-destructive">{errors.targetTimeline}</p>
          )}
        </div>

        {/* Body Composition Goals (conditional) */}
        {(formData.primaryGoals.includes('fat-loss') || 
          formData.primaryGoals.includes('muscle-gain') ||
          formData.primaryGoals.includes('body-composition')) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Body Composition Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    placeholder="Optional"
                    value={formData.bodyCompositionGoals?.targetWeight || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bodyCompositionGoals: {
                        ...formData.bodyCompositionGoals,
                        targetWeight: parseInt(e.target.value) || undefined,
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetBodyFat">Target Body Fat % (optional)</Label>
                  <Input
                    id="targetBodyFat"
                    type="number"
                    placeholder="e.g., 15"
                    value={formData.bodyCompositionGoals?.targetBodyFat || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bodyCompositionGoals: {
                        ...formData.bodyCompositionGoals,
                        targetBodyFat: parseInt(e.target.value) || undefined,
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="muscleGainTarget">Muscle Gain Target</Label>
                <Input
                  id="muscleGainTarget"
                  placeholder="e.g., 'Gain 5kg lean muscle' or 'Increase arm size by 2cm'"
                  value={formData.bodyCompositionGoals?.muscleGainTarget || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    bodyCompositionGoals: {
                      ...formData.bodyCompositionGoals,
                      muscleGainTarget: e.target.value,
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Specific Goals */}
        <div className="space-y-2">
          <Label htmlFor="specificGoals">Specific Goals (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Is there anything specific you want to achieve that wasn't covered above?
          </p>
          <Textarea
            id="specificGoals"
            placeholder="e.g., 'Run a 5K', 'Bench press my bodyweight', 'Improve posture for desk work'"
            value={formData.specificGoals}
            onChange={(e) => setFormData({ ...formData, specificGoals: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}