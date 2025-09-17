import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dumbbell, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Info,
  Scale
} from "lucide-react";
import { 
  createExerciseProtocol,
  type ExerciseProtocol,
  type EquipmentType,
  type WorkoutGoal
} from "@/lib/researchBasedWorkout";

interface StrengthAssessmentProps {
  onAssessmentComplete: (assessmentData: StrengthAssessmentData) => void;
  onSkip: () => void;
}

export interface StrengthAssessmentData {
  benchPress: number;
  squat: number;
  deadlift: number;
  overheadPress: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: WorkoutGoal;
  protocols: {
    [exerciseName: string]: ExerciseProtocol;
  };
}

const EXERCISE_ASSESSMENTS = [
  {
    id: 'benchPress',
    name: 'Bench Press',
    description: 'Upper body pushing strength assessment',
    placeholder: 'e.g., 60',
    icon: '🏋️',
    tips: [
      'Enter a weight you can comfortably press for 6-8 repetitions',
      'Use strict form with controlled movement',
      'This should feel moderately challenging, not your maximum'
    ]
  },
  {
    id: 'squat', 
    name: 'Squat',
    description: 'Lower body strength assessment',
    placeholder: 'e.g., 80',
    icon: '🦵',
    tips: [
      'Weight for 6-8 full-depth squats with good form',
      'Descend below parallel if mobility allows',
      'Choose a weight that challenges you but maintains technique'
    ]
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'Posterior chain strength assessment',
    placeholder: 'e.g., 100',
    icon: '💪',
    tips: [
      'Weight you can deadlift from the floor for 5-6 reps',
      'Focus on proper hip hinge and neutral spine',
      'Should be challenging but allow perfect form'
    ]
  },
  {
    id: 'overheadPress',
    name: 'Overhead Press',
    description: 'Vertical pushing strength assessment',
    placeholder: 'e.g., 40',
    icon: '🔝',
    tips: [
      'Strict overhead press weight for 8-10 reps',
      'No leg drive or back arch - purely shoulder strength',
      'Full range of motion from shoulders to overhead'
    ]
  }
];

const EXPERIENCE_LEVELS = [
  {
    level: 'beginner' as const,
    title: 'Beginner',
    description: 'Less than 6 months of consistent training',
    characteristics: ['Learning basic movements', 'Focus on form', 'Linear progression'],
    modifier: 0.8
  },
  {
    level: 'intermediate' as const,
    title: 'Intermediate', 
    description: '6 months to 2 years of consistent training',
    characteristics: ['Good form on basics', 'Some strength base', 'Ready for periodization'],
    modifier: 1.0
  },
  {
    level: 'advanced' as const,
    title: 'Advanced',
    description: '2+ years of consistent training',
    characteristics: ['Strong movement patterns', 'Significant strength', 'Complex programming'],
    modifier: 1.15
  }
];

const GOALS = [
  {
    goal: 'strength' as const,
    title: 'Strength',
    description: 'Build maximum force production',
    focus: 'Heavy weights, low reps (1-6)',
    restPeriods: '3-5 minutes'
  },
  {
    goal: 'hypertrophy' as const,
    title: 'Muscle Growth', 
    description: 'Build muscle size and mass',
    focus: 'Moderate weights, medium reps (6-12)',
    restPeriods: '60-90 seconds'
  },
  {
    goal: 'endurance' as const,
    title: 'Muscular Endurance',
    description: 'Build work capacity',
    focus: 'Light weights, high reps (12+)',
    restPeriods: '30-60 seconds'
  }
];

export const StrengthAssessment = ({ onAssessmentComplete, onSkip }: StrengthAssessmentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [weights, setWeights] = useState<{[key: string]: number}>({});
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [primaryGoal, setPrimaryGoal] = useState<WorkoutGoal>('strength');
  const [showPreview, setShowPreview] = useState(false);

  const totalSteps = 7; // 4 exercises + experience + goal + preview
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleWeightChange = (exerciseId: string, weight: number) => {
    setWeights(prev => ({
      ...prev,
      [exerciseId]: weight
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateProtocols = () => {
    const selectedExperience = EXPERIENCE_LEVELS.find(e => e.level === experienceLevel)!;
    const protocols: {[key: string]: ExerciseProtocol} = {};
    
    // Generate protocols for each exercise with experience-based modifications
    Object.entries(weights).forEach(([exerciseId, weight]) => {
      const exercise = EXERCISE_ASSESSMENTS.find(e => e.id === exerciseId);
      if (exercise && weight > 0) {
        const adjustedWeight = Math.round(weight * selectedExperience.modifier);
        const targetReps = primaryGoal === 'strength' ? 6 : primaryGoal === 'hypertrophy' ? 10 : 15;
        
        protocols[exercise.name] = createExerciseProtocol(
          exercise.name,
          adjustedWeight,
          targetReps,
          'barbell',
          primaryGoal
        );
      }
    });

    return protocols;
  };

  const handleComplete = () => {
    const protocols = generateProtocols();
    
    const assessmentData: StrengthAssessmentData = {
      benchPress: weights.benchPress || 0,
      squat: weights.squat || 0, 
      deadlift: weights.deadlift || 0,
      overheadPress: weights.overheadPress || 0,
      experienceLevel,
      primaryGoal,
      protocols
    };

    onAssessmentComplete(assessmentData);
  };

  const renderExerciseInput = () => {
    const exercise = EXERCISE_ASSESSMENTS[currentStep];
    
    return (
      <Card className="p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{exercise.icon}</div>
          <h2 className="text-2xl font-bold mb-2">{exercise.name}</h2>
          <p className="text-muted-foreground">{exercise.description}</p>
        </div>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <Info className="w-4 h-4" />
          <AlertDescription>
            <strong>What's your comfortable {exercise.name.toLowerCase()} weight?</strong>
            <p className="text-sm mt-1 mb-2">
              We're looking for a weight you can handle with good form - not your maximum. 
              This helps our AI create the right starting intensity for your personalized programs.
            </p>
            <ul className="text-sm list-disc list-inside">
              {exercise.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        <div className="max-w-xs mx-auto">
          <Label htmlFor="weight" className="text-lg font-semibold">
            Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            value={weights[exercise.id] || ''}
            onChange={(e) => handleWeightChange(exercise.id, Number(e.target.value))}
            placeholder={exercise.placeholder}
            className="text-center text-2xl font-bold h-16 mt-2"
            min="0"
            step="2.5"
          />
        </div>

        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!weights[exercise.id] || weights[exercise.id] <= 0}
          >
            Next Exercise
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderExperienceSelection = () => (
    <Card className="p-8">
      <div className="text-center mb-6">
        <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Training Experience</h2>
        <p className="text-muted-foreground">Help us tailor your program intensity</p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {EXPERIENCE_LEVELS.map((level) => (
          <div
            key={level.level}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              experienceLevel === level.level 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setExperienceLevel(level.level)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                experienceLevel === level.level ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`} />
              <div className="flex-1">
                <h3 className="font-semibold">{level.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{level.description}</p>
                <div className="flex flex-wrap gap-1">
                  {level.characteristics.map((char, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );

  const renderGoalSelection = () => (
    <Card className="p-8">
      <div className="text-center mb-6">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Primary Training Goal</h2>
        <p className="text-muted-foreground">This affects your rep ranges and rest periods</p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {GOALS.map((goal) => (
          <div
            key={goal.goal}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              primaryGoal === goal.goal 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setPrimaryGoal(goal.goal)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                primaryGoal === goal.goal ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`} />
              <div className="flex-1">
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">{goal.description}</p>
                <div className="text-xs text-muted-foreground">
                  <div>Focus: {goal.focus}</div>
                  <div>Rest: {goal.restPeriods}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious}>
          Previous
        </Button>
        <Button onClick={() => {
          setShowPreview(true);
          handleNext();
        }}>
          Generate Preview
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );

  const renderPreview = () => {
    const protocols = generateProtocols();
    const selectedExperience = EXPERIENCE_LEVELS.find(e => e.level === experienceLevel)!;
    
    return (
      <Card className="p-8">
        <div className="text-center mb-6">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold mb-2">Assessment Complete</h2>
          <p className="text-muted-foreground">Your personalized protocols are ready</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Your Profile</h3>
            <div className="space-y-1 text-sm">
              <div>Experience: <Badge variant="outline">{selectedExperience.title}</Badge></div>
              <div>Goal: <Badge variant="outline">{GOALS.find(g => g.goal === primaryGoal)?.title}</Badge></div>
              <div>Intensity Modifier: {selectedExperience.modifier}x</div>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Generated Protocols</h3>
            <div className="space-y-1 text-sm">
              {Object.values(protocols).map(protocol => (
                <div key={protocol.exerciseName} className="flex justify-between">
                  <span>{protocol.exerciseName}:</span>
                  <span className="font-medium">{protocol.workingWeight}kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>This is just the beginning!</strong>
            <p className="text-sm mt-1 mb-2">
              These assessments provide a starting baseline. Our AI will continuously learn from your 
              workout performance, feedback, and progress to automatically refine and optimize your programs.
            </p>
            <ul className="text-sm list-disc list-inside">
              <li>Research-based warm-up progressions for each exercise</li>
              <li>Optimized rest periods based on your goal</li>
              <li>Adaptive progressive overload recommendations</li>
              <li>Form cues and real-time coaching tips</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onSkip}>
            Skip Assessment
          </Button>
          <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Setup
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">Strength Assessment</h1>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip
            </Button>
          </div>
          
          {currentStep === 0 && (
            <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <Info className="w-4 h-4" />
              <AlertDescription>
                <strong>Quick Assessment to Personalize Your Training</strong>
                <p className="mt-1 text-sm">
                  We'll assess your comfortable training weights for key movements. This gives our AI a starting baseline 
                  to create effective workouts. As you progress, the system will automatically adjust your programs 
                  based on your performance data and feedback.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          <Progress value={progress} className="h-2" />
          <div className="text-sm text-muted-foreground mt-1">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>

        {/* Step Content */}
        {currentStep < 4 && renderExerciseInput()}
        {currentStep === 4 && renderExperienceSelection()}
        {currentStep === 5 && renderGoalSelection()}
        {currentStep === 6 && renderPreview()}
      </div>
    </div>
  );
};