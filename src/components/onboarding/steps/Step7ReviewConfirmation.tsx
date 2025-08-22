import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, User, Target, Dumbbell, Clock, Heart, Zap } from 'lucide-react';
import { generateAIPromptData } from '@/lib/userProfiles';

export function Step7ReviewConfirmation() {
  const { profile, completeOnboardingFlow } = useOnboarding();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!profile) {
    return <div>Loading...</div>;
  }

  const handleComplete = async () => {
    if (!agreed) {
      toast({
        title: "Please agree to terms",
        description: "You must agree to the terms before completing onboarding.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Complete the onboarding
      await completeOnboardingFlow({
        onboardingCompleted: true,
        completionStep: 7,
      });

      toast({
        title: "Welcome to AI Muscle Coach! 🎉",
        description: "Your personalized fitness journey starts now!",
      });

      // Navigate to the main dashboard
      navigate('/');
      
    } catch (error) {
      toast({
        title: "Error completing onboarding",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate some stats for display
  const totalHealthItems = 
    (profile.health?.injuryHistory?.length || 0) +
    (profile.health?.limitations?.length || 0) +
    (profile.health?.medicalConditions?.length || 0) +
    (profile.health?.painAreas?.length || 0);

  const totalPreferences = 
    (profile.preferences?.favoriteExercises?.length || 0) +
    (profile.preferences?.dislikedExercises?.length || 0);

  return (
    <OnboardingLayout
      title="Review Your Profile"
      description="Let's make sure everything looks good before we create your personalized program"
      onNext={handleComplete}
      nextButtonText={loading ? "Creating Your Program..." : "Complete Setup"}
      isLoading={loading}
      showPrevButton={false}
    >
      <div className="space-y-6">
        {/* Profile Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age:</span>
                <span>{profile.personalInfo?.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Height:</span>
                <span>{profile.personalInfo?.height} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span>{profile.personalInfo?.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activity Level:</span>
                <span className="capitalize">{profile.personalInfo?.activityLevel?.replace('-', ' ')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-4 h-4" />
                Goals & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Primary Goals:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.goals?.primaryGoals?.map((goal) => (
                    <Badge key={goal} variant="outline" className="text-xs">
                      {goal.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timeline:</span>
                <span>{profile.goals?.targetTimeline} months</span>
              </div>
              {profile.goals?.secondaryGoals && profile.goals.secondaryGoals.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Secondary Goals:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.goals.secondaryGoals.slice(0, 3).map((goal) => (
                      <Badge key={goal} variant="outline" className="text-xs">
                        {goal.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="w-4 h-4" />
                Experience & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience:</span>
                <span className="capitalize">{profile.experience?.trainingExperience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="capitalize">{profile.experience?.workoutLocation}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Equipment:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.experience?.equipmentAccess?.map((equipment) => (
                    <Badge key={equipment} variant="outline" className="text-xs">
                      {equipment.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions/Week:</span>
                <span>{profile.availability?.sessionsPerWeek}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{profile.availability?.sessionDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred Times:</span>
                <span>{profile.availability?.preferredTimes?.length || 0} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Days:</span>
                <span>{profile.availability?.availableDays?.length || 0} days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health & Preferences Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="w-4 h-4" />
                Health Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              {totalHealthItems > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Injuries:</span>
                    <span>{profile.health?.injuryHistory?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limitations:</span>
                    <span>{profile.health?.limitations?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medical Conditions:</span>
                    <span>{profile.health?.medicalConditions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pain Areas:</span>
                    <span>{profile.health?.painAreas?.length || 0}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>No health concerns reported</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4" />
                Exercise Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Workout Split:</span>
                <span className="capitalize">{profile.preferences?.preferredWorkoutSplit?.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rep Range:</span>
                <span className="capitalize">{profile.preferences?.repRangePreference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intensity:</span>
                <span className="capitalize">{profile.preferences?.workoutIntensity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exercise Preferences:</span>
                <span>{totalPreferences} items</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Preview */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Based on your profile, our AI will create a personalized workout program that includes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Custom exercise selection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Progressive difficulty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Injury-safe modifications</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Schedule optimization</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={setAgreed}
                className="mt-1"
              />
              <div className="space-y-2">
                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I agree to the terms and conditions
                </label>
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree that:
                  • This program is for informational purposes and not medical advice
                  • You will consult a healthcare provider before starting if you have health concerns
                  • You understand that exercise involves some risk of injury
                  • Your data will be used to provide personalized recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">Profile Complete! 🎉</div>
              <p className="text-sm text-muted-foreground">
                You've provided all the information needed to create your personalized AI workout program.
              </p>
              <div className="flex justify-center items-center gap-4 text-xs text-muted-foreground mt-3">
                <span>✓ Personal details</span>
                <span>✓ Goals & timeline</span>
                <span>✓ Experience level</span>
                <span>✓ Schedule preferences</span>
                <span>✓ Health considerations</span>
                <span>✓ Exercise preferences</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
}