import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { Step1PersonalBasics } from '@/components/onboarding/steps/Step1PersonalBasics';
import { Step2GoalsTimeline } from '@/components/onboarding/steps/Step2GoalsTimeline';
import { Step3ExperienceAccess } from '@/components/onboarding/steps/Step3ExperienceAccess';
import { Step4AvailabilitySchedule } from '@/components/onboarding/steps/Step4AvailabilitySchedule';
import { Step5HealthLimitations } from '@/components/onboarding/steps/Step5HealthLimitations';
import { Step6ExercisePreferences } from '@/components/onboarding/steps/Step6ExercisePreferences';
import { Step7ReviewConfirmation } from '@/components/onboarding/steps/Step7ReviewConfirmation';

function OnboardingSteps() {
  const { currentStep, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  switch (currentStep) {
    case 1:
      return <Step1PersonalBasics />;
    case 2:
      return <Step2GoalsTimeline />;
    case 3:
      return <Step3ExperienceAccess />;
    case 4:
      return <Step4AvailabilitySchedule />;
    case 5:
      return <Step5HealthLimitations />;
    case 6:
      return <Step6ExercisePreferences />;
    case 7:
      return <Step7ReviewConfirmation />;
    default:
      return <Step1PersonalBasics />;
  }
}

export function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingSteps />
    </OnboardingProvider>
  );
}