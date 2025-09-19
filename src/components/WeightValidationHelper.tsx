import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface WeightValidationHelperProps {
  exerciseName: string;
  suggestedWeight?: number;
  assessmentWeight?: number;
  hasAssessmentData: boolean;
  userExperience?: 'beginner' | 'intermediate' | 'advanced';
}

export function WeightValidationHelper({
  exerciseName,
  suggestedWeight,
  assessmentWeight,
  hasAssessmentData,
  userExperience = 'beginner'
}: WeightValidationHelperProps) {
  
  if (!hasAssessmentData && !suggestedWeight) {
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <div className="space-y-2">
            <p className="font-medium">Assessment Required</p>
            <p className="text-sm">
              Complete the strength assessment to get personalized weight recommendations for <strong>{exerciseName}</strong>.
            </p>
            <Badge variant="outline" className="text-xs">
              Safe starting weights will be provided during setup
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasAssessmentData && assessmentWeight) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="space-y-2">
            <p className="font-medium">Assessment-Based Weight</p>
            <p className="text-sm">
              Using your assessed comfortable weight of <strong>{assessmentWeight}kg</strong> for {exerciseName}.
            </p>
            <Badge variant="secondary" className="text-xs">
              Research-based progression applied
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Fallback case - no valid weight data
  return (
    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 dark:text-red-200">
        <div className="space-y-2">
          <p className="font-medium">Weight Setup Needed</p>
          <p className="text-sm">
            Please complete the exercise setup to determine safe starting weights for <strong>{exerciseName}</strong>.
          </p>
          <Badge variant="destructive" className="text-xs">
            Setup required before workout
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
}