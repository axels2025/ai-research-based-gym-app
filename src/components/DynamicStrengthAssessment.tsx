import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  BarChart3,
  Clock,
  Target,
  Zap,
  ChevronRight
} from 'lucide-react';
import { 
  createDynamicAssessment,
  generateAllProtocols,
  type AssessmentExercise,
  type DynamicAssessmentData 
} from '@/lib/dynamicAssessment';
import { type UserProfile } from '@/lib/userProfiles';
import { type WorkoutGoal } from '@/lib/researchBasedWorkout';

export type { DynamicAssessmentData };

interface DynamicStrengthAssessmentProps {
  userProfile: UserProfile;
  onAssessmentComplete: (data: DynamicAssessmentData) => void;
  onSkip: () => void;
}

// Experience level definitions
const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to strength training (0-1 years)',
    modifier: 1.0
  },
  {
    id: 'intermediate', 
    name: 'Intermediate',
    description: 'Regular training experience (1-3 years)',
    modifier: 1.2
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Experienced lifter (3+ years)',
    modifier: 1.4
  }
] as const;

// Goal definitions
const GOALS = [
  {
    id: 'strength',
    name: 'Strength',
    description: 'Build maximum strength',
    focus: 'Heavy weight, low reps',
    restPeriod: '3-5 minutes'
  },
  {
    id: 'hypertrophy', 
    name: 'Muscle Growth',
    description: 'Build muscle size',
    focus: 'Moderate weight, higher reps',
    restPeriod: '60-90 seconds'
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Build muscular endurance',
    focus: 'Lighter weight, high reps',
    restPeriod: '30-60 seconds'
  }
] as const;

export function DynamicStrengthAssessment({ 
  userProfile, 
  onAssessmentComplete, 
  onSkip 
}: DynamicStrengthAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentExercises, setAssessmentExercises] = useState<AssessmentExercise[]>([]);
  const [programExercises, setProgramExercises] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Assessment data
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [primaryGoal, setPrimaryGoal] = useState<WorkoutGoal>('hypertrophy');

  // Load dynamic assessment on mount
  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true);
        const { assessmentExercises, programExercises, estimatedCompletionTime } = 
          await createDynamicAssessment(userProfile);
        
        setAssessmentExercises(assessmentExercises);
        setProgramExercises(programExercises);
        setEstimatedTime(estimatedCompletionTime);
        
        console.log(`Dynamic assessment created: ${assessmentExercises.length} exercises to assess ${programExercises.length} program exercises`);
      } catch (err) {
        console.error('Failed to create dynamic assessment:', err);
        setError('Failed to create personalized assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadAssessment();
  }, [userProfile]);

  const totalSteps = loading ? 1 : assessmentExercises.length + 3; // exercises + experience + goal + preview
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleWeightChange = (exerciseName: string, value: string) => {
    setWeights(prev => ({ ...prev, [exerciseName]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Convert weights to assessment data
    const assessedExercises: Record<string, {
      weight: number;
      experienceLevel: 'beginner' | 'intermediate' | 'advanced';
      goal: WorkoutGoal;
    }> = {};
    
    assessmentExercises.forEach(exercise => {
      const weightValue = parseFloat(weights[exercise.name]) || 0;
      if (weightValue > 0) {
        assessedExercises[exercise.name] = {
          weight: weightValue,
          experienceLevel,
          goal: primaryGoal
        };
      }
    });

    // Generate protocols for all program exercises
    const generatedProtocols = generateAllProtocols(
      assessedExercises,
      assessmentExercises,
      programExercises
    );

    const assessmentCompletion = (Object.keys(generatedProtocols).length / programExercises.length) * 100;

    const assessmentData: DynamicAssessmentData = {
      assessedExercises,
      generatedProtocols,
      programExercises,
      assessmentCompletion
    };

    console.log(`Assessment complete: ${assessmentCompletion}% coverage (${Object.keys(generatedProtocols).length}/${programExercises.length} exercises)`);
    onAssessmentComplete(assessmentData);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
            <CardTitle>Creating Your Personalized Assessment</CardTitle>
          </div>
          <CardDescription>
            Analyzing your workout program to create a targeted strength assessment...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={33} className="animate-pulse" />
            <div className="text-center text-sm text-muted-foreground">
              This may take a moment as we generate your personalized workout program
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="mx-auto max-w-2xl border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Assessment Creation Failed</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="secondary" onClick={onSkip}>
              Skip Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Introduction step
  if (currentStep === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="w-6 h-6 text-primary" />
            <CardTitle>Personalized Strength Assessment</CardTitle>
          </div>
          <CardDescription>
            Based on your workout program, we'll assess {assessmentExercises.length} key movements to optimize your training
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Progress value={progress} className="mb-4" />
          
          <Alert className="bg-primary/10 text-foreground border-primary/20">
            <Info className="w-4 h-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>Smart Assessment System</strong>
              <p className="mt-1 text-sm text-muted-foreground">
                We've analyzed your personalized workout program and identified {assessmentExercises.length} representative 
                exercises that will inform protocols for all {programExercises.length} exercises in your program. 
                This ensures comprehensive coverage while minimizing assessment time.
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-semibold">{assessmentExercises.length} Exercises</div>
              <div className="text-sm text-muted-foreground">To assess</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <Target className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-semibold">{programExercises.length} Exercises</div>
              <div className="text-sm text-muted-foreground">Will be optimized</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-semibold">~{Math.round(estimatedTime)} mins</div>
              <div className="text-sm text-muted-foreground">Estimated time</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Assessment will cover:</h4>
            <div className="grid grid-cols-2 gap-2">
              {assessmentExercises.map((exercise, index) => (
                <div key={exercise.id} className="flex items-center space-x-2 text-sm">
                  <span className="text-lg">{exercise.icon}</span>
                  <span>{exercise.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    +{exercise.representsExercises.length} more
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onSkip}>
              Skip Assessment
            </Button>
            <Button onClick={handleNext}>
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Exercise assessment steps
  if (currentStep <= assessmentExercises.length) {
    const exerciseIndex = currentStep - 1;
    const exercise = assessmentExercises[exerciseIndex];
    
    if (!exercise) return null;

    const currentWeight = weights[exercise.name] || '';

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">
              Step {currentStep} of {totalSteps}
            </Badge>
            <Progress value={progress} className="flex-1 mx-4" />
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{exercise.icon}</span>
            <div>
              <CardTitle>{exercise.name}</CardTitle>
              <CardDescription>{exercise.description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="bg-primary/10 text-foreground border-primary/20">
            <Info className="w-4 h-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>What's your comfortable {exercise.name.toLowerCase()} weight?</strong>
              <p className="text-sm mt-1 mb-2 text-muted-foreground">
                We're looking for a weight you can handle with good form for 6-8 reps. 
                This helps our AI create the right starting intensity for your personalized programs.
              </p>
              <ul className="text-sm list-disc list-inside text-muted-foreground">
                {exercise.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label htmlFor={`weight-${exercise.id}`} className="text-base font-semibold">
              Weight (kg)
            </Label>
            <Input
              id={`weight-${exercise.id}`}
              type="number"
              placeholder={exercise.placeholder}
              value={currentWeight}
              onChange={(e) => handleWeightChange(exercise.name, e.target.value)}
              className="text-lg h-12"
              min="0"
              step="2.5"
            />
          </div>

          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">This assessment will optimize:</h4>
            <div className="flex flex-wrap gap-1">
              {exercise.representsExercises.map((ex, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {ex}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!currentWeight || parseFloat(currentWeight) <= 0}
            >
              {currentStep === assessmentExercises.length ? 'Continue' : 'Next Exercise'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Experience level step
  if (currentStep === assessmentExercises.length + 1) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">
              Step {currentStep} of {totalSteps}
            </Badge>
            <Progress value={progress} className="flex-1 mx-4" />
          </div>
          <CardTitle>Training Experience</CardTitle>
          <CardDescription>
            This helps us adjust the protocols to your skill level
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {EXPERIENCE_LEVELS.map((level) => (
            <Card 
              key={level.id}
              className={`cursor-pointer transition-all ${
                experienceLevel === level.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-secondary/50'
              }`}
              onClick={() => setExperienceLevel(level.id as any)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{level.name}</h3>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                  {experienceLevel === level.id && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Goal selection step
  if (currentStep === assessmentExercises.length + 2) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">
              Step {currentStep} of {totalSteps}
            </Badge>
            <Progress value={progress} className="flex-1 mx-4" />
          </div>
          <CardTitle>Primary Training Goal</CardTitle>
          <CardDescription>
            Choose your main focus to optimize rep ranges and rest periods
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {GOALS.map((goal) => (
            <Card 
              key={goal.id}
              className={`cursor-pointer transition-all ${
                primaryGoal === goal.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-secondary/50'
              }`}
              onClick={() => setPrimaryGoal(goal.id as WorkoutGoal)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{goal.name}</h3>
                    <p className="text-sm text-muted-foreground mb-1">{goal.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {goal.focus} • Rest: {goal.restPeriod}
                    </div>
                  </div>
                  {primaryGoal === goal.id && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview/completion step
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">
            Step {currentStep} of {totalSteps}
          </Badge>
          <Progress value={progress} className="flex-1 mx-4" />
        </div>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-success" />
          <div>
            <CardTitle>Assessment Complete!</CardTitle>
            <CardDescription>
              Ready to generate your research-based workout protocols
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-success/10 text-foreground border-success/20">
          <CheckCircle className="w-4 h-4 text-success" />
          <AlertDescription className="text-foreground">
            <strong>Your assessment will optimize {programExercises.length} exercises!</strong>
            <p className="text-sm mt-1 mb-2 text-muted-foreground">
              Based on your {assessmentExercises.length} assessed movements, our AI will create research-based 
              protocols with optimized warm-ups, working sets, and rest periods for your entire program.
            </p>
            <ul className="text-sm list-disc list-inside text-muted-foreground">
              <li>Research-based warm-up progressions for each exercise</li>
              <li>Optimized rest periods based on your {primaryGoal} goal</li>
              <li>Adaptive progressive overload recommendations</li>
              <li>Automatic adjustments based on your performance data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-semibold">Assessment Summary:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assessed Exercises:</Label>
              {assessmentExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between text-sm bg-secondary/30 p-2 rounded">
                  <span className="flex items-center space-x-2">
                    <span>{exercise.icon}</span>
                    <span>{exercise.name}</span>
                  </span>
                  <span className="font-mono">{weights[exercise.name] || 0}kg</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Training Setup:</Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between bg-secondary/30 p-2 rounded">
                  <span>Experience:</span>
                  <span className="capitalize">{experienceLevel}</span>
                </div>
                <div className="flex justify-between bg-secondary/30 p-2 rounded">
                  <span>Primary Goal:</span>
                  <span>{GOALS.find(g => g.id === primaryGoal)?.name}</span>
                </div>
                <div className="flex justify-between bg-secondary/30 p-2 rounded">
                  <span>Program Coverage:</span>
                  <span>{programExercises.length} exercises</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button onClick={handleComplete} className="flex items-center">
            Generate My Protocols
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}