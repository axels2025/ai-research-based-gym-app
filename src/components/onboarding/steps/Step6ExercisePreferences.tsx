import { useState } from 'react';
import { OnboardingLayout } from '../OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Preferences, WorkoutSplit, RepRangePreference } from '@/lib/userProfiles';

const workoutSplits = [
  { 
    value: 'full-body', 
    label: 'Full Body', 
    description: 'Train all muscle groups each session' 
  },
  { 
    value: 'upper-lower', 
    label: 'Upper/Lower Split', 
    description: 'Alternate between upper and lower body days' 
  },
  { 
    value: 'push-pull-legs', 
    label: 'Push/Pull/Legs', 
    description: 'Push muscles, pull muscles, legs rotation' 
  },
  { 
    value: 'body-part-split', 
    label: 'Body Part Split', 
    description: 'Focus on specific muscle groups each day' 
  },
  { 
    value: 'circuit-training', 
    label: 'Circuit Training', 
    description: 'Move quickly between exercises with minimal rest' 
  },
  { 
    value: 'functional', 
    label: 'Functional Training', 
    description: 'Movement patterns for daily activities' 
  },
];

const repRanges = [
  { 
    value: 'low', 
    label: 'Low Reps (1-5)', 
    description: 'Focus on strength and power' 
  },
  { 
    value: 'moderate', 
    label: 'Moderate Reps (6-12)', 
    description: 'Balance of strength and muscle growth' 
  },
  { 
    value: 'high', 
    label: 'High Reps (15+)', 
    description: 'Endurance and muscle definition' 
  },
  { 
    value: 'mixed', 
    label: 'Mixed Ranges', 
    description: 'Variety of rep ranges for well-rounded training' 
  },
];

const intensityLevels = [
  { value: 'low', label: 'Low', description: 'Gentle, comfortable pace' },
  { value: 'moderate', label: 'Moderate', description: 'Challenging but manageable' },
  { value: 'high', label: 'High', description: 'Push your limits' },
  { value: 'variable', label: 'Variable', description: 'Mix of intensities' },
];

const restPreferences = [
  { value: 'minimal', label: 'Minimal Rest', description: '30-60 seconds between sets' },
  { value: 'standard', label: 'Standard Rest', description: '1-2 minutes between sets' },
  { value: 'extended', label: 'Extended Rest', description: '3+ minutes between sets' },
];

const commonExercises = [
  'Squats', 'Deadlifts', 'Bench Press', 'Pull-ups', 'Push-ups', 'Rows', 'Overhead Press',
  'Lunges', 'Planks', 'Burpees', 'Mountain Climbers', 'Jumping Jacks', 'Bicep Curls',
  'Tricep Dips', 'Calf Raises', 'Hip Thrusts', 'Russian Twists', 'Box Jumps'
];

export function Step6ExercisePreferences() {
  const { profile, saveStepData, nextStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Preferences>({
    favoriteExercises: profile?.preferences?.favoriteExercises || [],
    dislikedExercises: profile?.preferences?.dislikedExercises || [],
    preferredWorkoutSplit: profile?.preferences?.preferredWorkoutSplit || '' as WorkoutSplit,
    repRangePreference: profile?.preferences?.repRangePreference || '' as RepRangePreference,
    workoutIntensity: profile?.preferences?.workoutIntensity || 'moderate',
    restPreference: profile?.preferences?.restPreference || 'standard',
    musicPreference: profile?.preferences?.musicPreference || '',
    workoutEnvironment: profile?.preferences?.workoutEnvironment || '',
  });

  const [newFavorite, setNewFavorite] = useState('');
  const [newDisliked, setNewDisliked] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.preferredWorkoutSplit) {
      newErrors.preferredWorkoutSplit = 'Please select a workout split preference';
    }

    if (!formData.repRangePreference) {
      newErrors.repRangePreference = 'Please select a rep range preference';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete required fields",
        description: "Make sure you've selected your workout preferences.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await saveStepData({
        preferences: formData,
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

  const addFavoriteExercise = () => {
    if (newFavorite && !formData.favoriteExercises.includes(newFavorite)) {
      setFormData({
        ...formData,
        favoriteExercises: [...formData.favoriteExercises, newFavorite],
      });
      setNewFavorite('');
    }
  };

  const removeFavoriteExercise = (exercise: string) => {
    setFormData({
      ...formData,
      favoriteExercises: formData.favoriteExercises.filter(e => e !== exercise),
    });
  };

  const addDislikedExercise = () => {
    if (newDisliked && !formData.dislikedExercises.includes(newDisliked)) {
      setFormData({
        ...formData,
        dislikedExercises: [...formData.dislikedExercises, newDisliked],
      });
      setNewDisliked('');
    }
  };

  const removeDislikedExercise = (exercise: string) => {
    setFormData({
      ...formData,
      dislikedExercises: formData.dislikedExercises.filter(e => e !== exercise),
    });
  };

  const addCommonExercise = (exercise: string, type: 'favorite' | 'disliked') => {
    if (type === 'favorite' && !formData.favoriteExercises.includes(exercise)) {
      setFormData({
        ...formData,
        favoriteExercises: [...formData.favoriteExercises, exercise],
      });
    } else if (type === 'disliked' && !formData.dislikedExercises.includes(exercise)) {
      setFormData({
        ...formData,
        dislikedExercises: [...formData.dislikedExercises, exercise],
      });
    }
  };

  return (
    <OnboardingLayout
      title="Exercise Preferences"
      description="Tell us what you love and what you'd rather avoid to personalize your workouts"
      onNext={handleNext}
      isLoading={loading}
    >
      <div className="space-y-8">
        {/* Workout Split Preference */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Preferred Workout Split</Label>
            <p className="text-sm text-muted-foreground">
              How would you like to organize your training?
            </p>
          </div>
          
          <div className="space-y-2">
            {workoutSplits.map((split) => (
              <Card
                key={split.value}
                className={`cursor-pointer transition-all ${
                  formData.preferredWorkoutSplit === split.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setFormData({ ...formData, preferredWorkoutSplit: split.value as WorkoutSplit })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{split.label}</h4>
                      <p className="text-sm text-muted-foreground">{split.description}</p>
                    </div>
                    {formData.preferredWorkoutSplit === split.value && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {errors.preferredWorkoutSplit && (
            <p className="text-xs text-destructive">{errors.preferredWorkoutSplit}</p>
          )}
        </div>

        {/* Rep Range Preference */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Rep Range Preference</Label>
            <p className="text-sm text-muted-foreground">
              What rep ranges do you prefer for your training?
            </p>
          </div>
          
          <div className="space-y-2">
            {repRanges.map((range) => (
              <Card
                key={range.value}
                className={`cursor-pointer transition-all ${
                  formData.repRangePreference === range.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setFormData({ ...formData, repRangePreference: range.value as RepRangePreference })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{range.label}</h4>
                      <p className="text-sm text-muted-foreground">{range.description}</p>
                    </div>
                    {formData.repRangePreference === range.value && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {errors.repRangePreference && (
            <p className="text-xs text-destructive">{errors.repRangePreference}</p>
          )}
        </div>

        {/* Workout Intensity and Rest */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Workout Intensity</Label>
            <Select
              value={formData.workoutIntensity}
              onValueChange={(value: 'low' | 'moderate' | 'high' | 'variable') => 
                setFormData({ ...formData, workoutIntensity: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intensity" />
              </SelectTrigger>
              <SelectContent>
                {intensityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div>{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rest Between Sets</Label>
            <Select
              value={formData.restPreference}
              onValueChange={(value: 'minimal' | 'standard' | 'extended') => 
                setFormData({ ...formData, restPreference: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rest preference" />
              </SelectTrigger>
              <SelectContent>
                {restPreferences.map((rest) => (
                  <SelectItem key={rest.value} value={rest.value}>
                    <div>
                      <div>{rest.label}</div>
                      <div className="text-xs text-muted-foreground">{rest.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Favorite Exercises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <span>Favorite Exercises</span>
              <Badge variant="outline">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.favoriteExercises.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.favoriteExercises.map((exercise) => (
                  <Badge key={exercise} variant="outline" className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    {exercise}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeFavoriteExercise(exercise)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a favorite exercise"
                  value={newFavorite}
                  onChange={(e) => setNewFavorite(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFavoriteExercise()}
                />
                <Button type="button" onClick={addFavoriteExercise} disabled={!newFavorite}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {commonExercises.map((exercise) => (
                    <Button
                      key={exercise}
                      variant="outline"
                      size="sm"
                      onClick={() => addCommonExercise(exercise, 'favorite')}
                      disabled={formData.favoriteExercises.includes(exercise)}
                      className="text-xs"
                    >
                      {exercise}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disliked Exercises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              <span>Exercises to Avoid</span>
              <Badge variant="outline">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.dislikedExercises.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.dislikedExercises.map((exercise) => (
                  <Badge key={exercise} variant="outline" className="flex items-center gap-1">
                    <ThumbsDown className="w-3 h-3 text-red-500" />
                    {exercise}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeDislikedExercise(exercise)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add an exercise to avoid"
                  value={newDisliked}
                  onChange={(e) => setNewDisliked(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDislikedExercise()}
                />
                <Button type="button" onClick={addDislikedExercise} disabled={!newDisliked}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {commonExercises.map((exercise) => (
                    <Button
                      key={exercise}
                      variant="outline"
                      size="sm"
                      onClick={() => addCommonExercise(exercise, 'disliked')}
                      disabled={formData.dislikedExercises.includes(exercise)}
                      className="text-xs"
                    >
                      {exercise}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optional Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="musicPreference">Music Preference (Optional)</Label>
            <Input
              id="musicPreference"
              placeholder="e.g., High-energy, Classical, No music"
              value={formData.musicPreference}
              onChange={(e) => setFormData({ ...formData, musicPreference: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workoutEnvironment">Preferred Environment (Optional)</Label>
            <Input
              id="workoutEnvironment"
              placeholder="e.g., Quiet, Social, Outdoor, Well-lit"
              value={formData.workoutEnvironment}
              onChange={(e) => setFormData({ ...formData, workoutEnvironment: e.target.value })}
            />
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}