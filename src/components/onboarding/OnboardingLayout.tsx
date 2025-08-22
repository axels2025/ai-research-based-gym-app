import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface OnboardingLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  showPrevButton?: boolean;
  showNextButton?: boolean;
  nextButtonText?: string;
  isLoading?: boolean;
}

export function OnboardingLayout({
  title,
  description,
  children,
  onNext,
  onPrev,
  showPrevButton = true,
  showNextButton = true,
  nextButtonText = 'Continue',
  isLoading = false,
}: OnboardingLayoutProps) {
  const { currentStep, totalSteps, canProceed, prevStep } = useOnboarding();
  
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    } else {
      prevStep();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Muscle Coach
            </h1>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {showPrevButton && currentStep > 1 ? (
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {showNextButton && (
            <Button 
              onClick={onNext}
              disabled={!canProceed || isLoading}
              className="ml-auto"
            >
              {isLoading ? 'Saving...' : nextButtonText}
              {!isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            You can save your progress and return later at any time
          </p>
        </div>
      </div>
    </div>
  );
}