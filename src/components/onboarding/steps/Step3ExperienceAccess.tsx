import { useState } from 'react';
import { OnboardingLayout } from '../OnboardingLayout';
import { EquipmentSelector } from '../EquipmentSelector';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { defaultOptions, type Experience, type TrainingExperience, type EquipmentAccess, type WorkoutLocation } from '@/lib/userProfiles';

const workoutLocations = [
  { 
    value: 'home', 
    label: 'Home', 
    icon: '🏠',
    description: 'Working out in your living space' 
  },
  { 
    value: 'gym', 
    label: 'Gym', 
    icon: '🏢',
    description: 'Commercial gym or fitness center' 
  },
  { 
    value: 'outdoor', 
    label: 'Outdoor', 
    icon: '🌳',
    description: 'Parks, trails, or outdoor spaces' 
  },
  { 
    value: 'hybrid', 
    label: 'Hybrid', 
    icon: '🔄',
    description: 'Mix of home, gym, and outdoor' 
  },
];

const equipmentOptions = [
  { 
    value: 'none', 
    label: 'No Equipment', 
    icon: '🏠',
    description: 'Bodyweight exercises only' 
  },
  { 
    value: 'basic', 
    label: 'Basic Equipment', 
    icon: '🏋️‍♀️',
    description: 'Dumbbells, resistance bands, yoga mat' 
  },
  { 
    value: 'full-gym', 
    label: 'Full Gym Access', 
    icon: '🏢',
    description: 'Complete gym with machines, free weights, cardio' 
  },
  { 
    value: 'advanced', 
    label: 'Advanced Equipment', 
    icon: '⚙️',
    description: 'Specialty equipment, home gym setup' 
  },
];

export function Step3ExperienceAccess() {
  const { profile, saveStepData, nextStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Experience>({
    trainingExperience: profile?.experience?.trainingExperience || '' as TrainingExperience,
    equipmentAccess: profile?.experience?.equipmentAccess || [],
    workoutLocation: profile?.experience?.workoutLocation || '' as WorkoutLocation,
    yearsTraining: profile?.experience?.yearsTraining || undefined,
    previousPrograms: profile?.experience?.previousPrograms || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trainingExperience) {
      newErrors.trainingExperience = 'Please select your training experience level';
    }

    if (!formData.equipmentAccess.length) {
      newErrors.equipmentAccess = 'Please select your available equipment';
    }

    if (!formData.workoutLocation) {
      newErrors.workoutLocation = 'Please select your preferred workout location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete required fields",
        description: "Make sure you've filled out all the required information.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await saveStepData({
        experience: formData,
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

  return (
    <OnboardingLayout
      title="Tell us about your experience"
      description="This helps us create a program that matches your skill level and available resources"
      onNext={handleNext}
      isLoading={loading}
    >
      <div className="space-y-8">
        {/* Training Experience */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Training Experience</Label>
            <p className="text-sm text-muted-foreground">
              How would you describe your fitness training background?
            </p>
          </div>
          
          <div className="space-y-2">
            {defaultOptions.trainingExperience.map((experience) => (
              <Card
                key={experience.value}
                className={`cursor-pointer transition-all ${
                  formData.trainingExperience === experience.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setFormData({ ...formData, trainingExperience: experience.value as TrainingExperience })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{experience.icon}</div>
                      <div>
                        <h4 className="font-medium">{experience.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {experience.label.includes('Beginner') && 'New to structured fitness training'}
                          {experience.label.includes('Intermediate') && 'Consistent training with some knowledge'}
                          {experience.label.includes('Advanced') && 'Extensive experience with various programs'}
                          {experience.label.includes('Expert') && 'Deep knowledge and years of training'}
                        </p>
                      </div>
                    </div>
                    {formData.trainingExperience === experience.value && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {errors.trainingExperience && (
            <p className="text-xs text-destructive">{errors.trainingExperience}</p>
          )}
        </div>

        {/* Years Training (conditional) */}
        {formData.trainingExperience && formData.trainingExperience !== 'beginner' && (
          <div className="space-y-2">
            <Label htmlFor="yearsTraining">Years of Training (Optional)</Label>
            <Input
              id="yearsTraining"
              type="number"
              placeholder="How many years have you been training?"
              value={formData.yearsTraining || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                yearsTraining: parseInt(e.target.value) || undefined 
              })}
              className="max-w-xs"
            />
          </div>
        )}

        {/* Equipment Access */}
        <div>
          <EquipmentSelector
            equipment={equipmentOptions}
            selectedEquipment={formData.equipmentAccess}
            onChange={(selectedEquipment) => 
              setFormData({ ...formData, equipmentAccess: selectedEquipment as EquipmentAccess[] })
            }
            title="Available Equipment"
            description="Select all types of equipment you have access to"
            allowMultiple={true}
          />
          {errors.equipmentAccess && (
            <p className="text-xs text-destructive mt-2">{errors.equipmentAccess}</p>
          )}
        </div>

        {/* Workout Location */}
        <div>
          <EquipmentSelector
            equipment={workoutLocations}
            selectedEquipment={formData.workoutLocation ? [formData.workoutLocation] : []}
            onChange={(selectedLocation) => 
              setFormData({ ...formData, workoutLocation: selectedLocation[0] as WorkoutLocation })
            }
            title="Preferred Workout Location"
            description="Where do you prefer to work out?"
            allowMultiple={false}
          />
          {errors.workoutLocation && (
            <p className="text-xs text-destructive mt-2">{errors.workoutLocation}</p>
          )}
        </div>

        {/* Previous Programs (optional) */}
        <div className="space-y-2">
          <Label htmlFor="previousPrograms">Previous Programs (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Have you followed any specific workout programs before? (e.g., "Starting Strength", "P90X", "Couch to 5K")
          </p>
          <Input
            id="previousPrograms"
            placeholder="List any programs you've tried before"
            value={formData.previousPrograms?.join(', ') || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              previousPrograms: e.target.value.split(',').map(p => p.trim()).filter(p => p)
            })}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}