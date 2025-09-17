import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, User, Target, Dumbbell, Clock, Heart, Zap, Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { generateAIPromptData } from '@/lib/userProfiles';
import { generateWorkoutPlan, AIWorkoutGenerationError } from '@/lib/aiWorkoutGeneration';
import { initializeDefaultProgram } from '@/lib/firestore';

export function Step7ReviewConfirmation() {
  const { profile, completeOnboardingFlow } = useOnboarding();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<
    'idle' | 'generating' | 'success' | 'error' | 'fallback'
  >('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [programPreview, setProgramPreview] = useState<{
    name: string;
    workouts: number;
    weeks: number;
  } | null>(null);

  if (!profile) {
    return <div>Loading...</div>;
  }

  // Simulate progress updates during AI generation
  const updateProgress = (stage: string, progress: number) => {
    setGenerationStage(stage);
    setGenerationProgress(progress);
  };

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
      setGenerationStatus('generating');
      setGenerationError(null);
      setCanRetry(false);
      
      // Complete the onboarding first
      updateProgress('Completing your profile...', 10);
      await completeOnboardingFlow({
        onboardingCompleted: true,
        completionStep: 7,
      });

      if (!profile || !currentUser) {
        throw new Error('Profile or user data missing');
      }

      // Generate AI workout program
      updateProgress('Analyzing your fitness profile...', 25);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for UX
      
      updateProgress('Generating personalized exercises...', 50);
      const aiResult = await generateWorkoutPlan(profile);
      
      updateProgress('Optimizing your workout schedule...', 75);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateProgress('Finalizing your program...', 90);
      
      // Set program preview
      setProgramPreview({
        name: aiResult.program.name,
        workouts: aiResult.workouts.length,
        weeks: aiResult.program.totalWeeks,
      });
      
      updateProgress('Complete! 🎉', 100);
      setGenerationStatus('success');
      
      // Brief delay to show success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Welcome to AI Muscle Coach! 🎉",
        description: `Your personalized "${aiResult.program.name}" program is ready!`,
      });

      // Navigate to the main dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      setGenerationStatus('error');
      
      let errorMessage = 'Failed to generate your workout program.';
      const shouldShowRetry = true;
      
      if (error instanceof AIWorkoutGenerationError) {
        switch (error.code) {
          case 'API_ERROR':
            errorMessage = 'Unable to connect to AI service. Using fallback program.';
            break;
          case 'RATE_LIMIT':
            errorMessage = 'AI service is busy. Please try again in a few minutes.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setGenerationError(errorMessage);
      setCanRetry(shouldShowRetry);
      
      // For certain errors, try fallback immediately
      if (error instanceof AIWorkoutGenerationError && 
          (error.code === 'PARSE_ERROR' || error.code === 'VALIDATION_ERROR')) {
        await handleFallback();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setGenerationStatus('idle');
    setGenerationError(null);
    setGenerationProgress(0);
    setGenerationStage('');
    await handleComplete();
  };

  const handleFallback = async () => {
    try {
      if (!currentUser) return;
      
      setGenerationStatus('generating');
      updateProgress('Creating default program...', 50);
      
      const defaultProgram = await initializeDefaultProgram(currentUser.uid);
      
      setProgramPreview({
        name: defaultProgram.program.name,
        workouts: defaultProgram.workouts.length,
        weeks: defaultProgram.program.totalWeeks,
      });
      
      updateProgress('Default program ready!', 100);
      setGenerationStatus('fallback');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Program Created! 💪",
        description: "We've created a solid starter program for you. You can always generate a new one later!",
      });
      
      navigate('/');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create workout program. Please try again.",
        variant: "destructive",
      });
      setGenerationStatus('error');
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

  // Dynamic button text based on generation status
  const getButtonText = () => {
    if (generationStatus === 'generating') {
      return generationStage || 'Generating Your Program...';
    }
    if (generationStatus === 'success') {
      return 'Program Created! 🎉';
    }
    if (generationStatus === 'error') {
      return 'Try Again';
    }
    if (generationStatus === 'fallback') {
      return 'Program Ready! 💪';
    }
    return 'Create My AI Program';
  };

  const isGenerating = generationStatus === 'generating';
  const showRetryOptions = generationStatus === 'error' && canRetry;
  const isComplete = generationStatus === 'success' || generationStatus === 'fallback';

  return (
    <OnboardingLayout
      title={isGenerating ? "Creating Your Program" : "Review Your Profile"}
      description={
        isGenerating 
          ? "Our AI is analyzing your profile to create the perfect workout program for you..."
          : "Let's make sure everything looks good before we create your personalized program"
      }
      onNext={showRetryOptions ? handleRetry : handleComplete}
      nextButtonText={getButtonText()}
      isLoading={loading}
      showPrevButton={!isGenerating && !isComplete}
    >
      {/* AI Generation Progress */}
      {isGenerating && (
        <div className="space-y-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center justify-center">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                AI Workout Generation in Progress
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">{generationStage}</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
                <p className="text-xs text-muted-foreground mt-2">
                  This usually takes 30-60 seconds
                </p>
              </div>
              
              {/* What's happening */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">What's happening:</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      generationProgress >= 25 ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`} />
                    <span>Analyzing your fitness profile and goals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      generationProgress >= 50 ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`} />
                    <span>Selecting personalized exercises and progressions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      generationProgress >= 75 ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`} />
                    <span>Optimizing workout schedule and timing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      generationProgress >= 100 ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`} />
                    <span>Finalizing your 6-week program</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {generationStatus === 'error' && (
        <div className="space-y-4 mb-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {generationError}
            </AlertDescription>
          </Alert>
          
          {canRetry && (
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again with AI
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleFallback}
                className="flex items-center gap-2"
              >
                <Dumbbell className="w-4 h-4" />
                Use Default Program
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {(generationStatus === 'success' || generationStatus === 'fallback') && programPreview && (
        <div className="space-y-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                {generationStatus === 'success' ? 'AI Program Generated!' : 'Program Created!'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{programPreview.name}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>• {programPreview.workouts} workouts</span>
                  <span>• {programPreview.weeks} weeks</span>
                  <span>• 2-week rotation system</span>
                </div>
                {generationStatus === 'fallback' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This is a proven starter program. You can generate a new AI program anytime from your dashboard!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Only show profile review when not generating or in error state */}
      {(generationStatus === 'idle' || showRetryOptions) && (
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
                onCheckedChange={(checked) => setAgreed(checked === true)}
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
      )}
    </OnboardingLayout>
  );
}