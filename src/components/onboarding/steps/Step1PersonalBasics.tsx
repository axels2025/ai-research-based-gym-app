import { useState, useEffect } from 'react';
import { OnboardingLayout } from '../OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { PersonalInfo, Sex, ActivityLevel } from '@/lib/userProfiles';

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const activityLevels = [
  { 
    value: 'sedentary', 
    label: 'Sedentary', 
    description: 'Little to no exercise, desk job' 
  },
  { 
    value: 'lightly-active', 
    label: 'Lightly Active', 
    description: 'Light exercise 1-3 days/week' 
  },
  { 
    value: 'moderately-active', 
    label: 'Moderately Active', 
    description: 'Moderate exercise 3-5 days/week' 
  },
  { 
    value: 'very-active', 
    label: 'Very Active', 
    description: 'Hard exercise 6-7 days/week' 
  },
  { 
    value: 'extremely-active', 
    label: 'Extremely Active', 
    description: 'Very hard exercise, physical job, or training twice a day' 
  },
];

export function Step1PersonalBasics() {
  const { profile, saveStepData, nextStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<PersonalInfo>({
    age: profile?.personalInfo?.age || 0,
    sex: profile?.personalInfo?.sex || '' as Sex,
    height: profile?.personalInfo?.height || 0,
    weight: profile?.personalInfo?.weight || 0,
    activityLevel: profile?.personalInfo?.activityLevel || '' as ActivityLevel,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.age || formData.age < 13 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age between 13 and 100';
    }

    if (!formData.sex) {
      newErrors.sex = 'Please select your sex';
    }

    if (!formData.height || formData.height < 100 || formData.height > 250) {
      newErrors.height = 'Please enter a valid height between 100cm and 250cm';
    }

    if (!formData.weight || formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = 'Please enter a valid weight between 30kg and 300kg';
    }

    if (!formData.activityLevel) {
      newErrors.activityLevel = 'Please select your activity level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    console.log('Step 1 - handleNext called', { formData });
    
    if (!validateForm()) {
      console.log('Step 1 - Validation failed', errors);
      toast({
        title: "Please complete all fields",
        description: "Make sure all information is filled out correctly.",
        variant: "destructive",
      });
      return;
    }

    console.log('Step 1 - Validation passed, saving data');

    try {
      setLoading(true);
      await saveStepData({
        personalInfo: formData,
      });
      console.log('Step 1 - Data saved successfully, moving to next step');
      nextStep();
    } catch (error) {
      console.error('Step 1 - Error saving data:', error);
      toast({
        title: "Error saving data",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate BMI for display
  const bmi = formData.height && formData.weight 
    ? (formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1)
    : null;

  return (
    <OnboardingLayout
      title="Let's start with the basics"
      description="We need some basic information to create your personalized fitness plan"
      onNext={handleNext}
      isLoading={loading}
      showPrevButton={false}
    >
      <div className="space-y-6">
        {/* Age and Sex */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter your age"
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              className={errors.age ? 'border-destructive' : ''}
            />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sex</Label>
            <Select
              value={formData.sex}
              onValueChange={(value: Sex) => setFormData({ ...formData, sex: value })}
            >
              <SelectTrigger className={errors.sex ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select your sex" />
              </SelectTrigger>
              <SelectContent>
                {sexOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
          </div>
        </div>

        {/* Height and Weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="Enter your height"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
              className={errors.height ? 'border-destructive' : ''}
            />
            {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Enter your weight"
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
              className={errors.weight ? 'border-destructive' : ''}
            />
            {errors.weight && <p className="text-xs text-destructive">{errors.weight}</p>}
          </div>
        </div>

        {/* BMI Display */}
        {bmi && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Your BMI</p>
                <p className="text-2xl font-bold">{bmi}</p>
                <p className="text-xs text-muted-foreground">
                  This helps us understand your starting point
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Level */}
        <div className="space-y-2">
          <Label>Current Activity Level</Label>
          <p className="text-sm text-muted-foreground mb-3">
            This helps us understand your baseline fitness level
          </p>
          
          <div className="space-y-2">
            {activityLevels.map((level) => (
              <Card
                key={level.value}
                className={`cursor-pointer transition-all ${
                  formData.activityLevel === level.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setFormData({ ...formData, activityLevel: level.value as ActivityLevel })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{level.label}</h4>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                    {formData.activityLevel === level.value && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {errors.activityLevel && <p className="text-xs text-destructive">{errors.activityLevel}</p>}
        </div>
      </div>
    </OnboardingLayout>
  );
}