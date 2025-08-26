import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Dumbbell,
  Brain
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  checkRegenerationEligibility, 
  regenerateProgramSmart, 
  revertProgram,
  getRegenerationRecommendations,
  type RegenerationCheck,
  type RegenerationResult 
} from '@/lib/programRegeneration';
import { type WorkoutProgram } from '@/lib/firestore';

interface ProgramRegenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentProgram: WorkoutProgram | null;
  onSuccess: (result: RegenerationResult) => void;
}

export function ProgramRegenerationDialog({
  open,
  onOpenChange,
  userId,
  currentProgram,
  onSuccess,
}: ProgramRegenerationDialogProps) {
  const [step, setStep] = useState<'check' | 'confirm' | 'generating' | 'success' | 'error'>('check');
  const [eligibility, setEligibility] = useState<RegenerationCheck | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [result, setResult] = useState<RegenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRevert, setCanRevert] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      checkEligibility();
    }
  }, [open, userId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const [eligibilityResult, recommendationsResult] = await Promise.all([
        checkRegenerationEligibility(userId),
        getRegenerationRecommendations(userId)
      ]);
      
      setEligibility(eligibilityResult);
      setRecommendations(recommendationsResult);
      
      if (currentProgram) {
        const timeSinceCreation = Date.now() - currentProgram.createdAt.seconds * 1000;
        const hoursElapsed = timeSinceCreation / (1000 * 60 * 60);
        setCanRevert(currentProgram.previousProgramId !== undefined && hoursElapsed <= 24);
      }
      
      setStep(eligibilityResult.canRegenerate ? 'confirm' : 'check');
    } catch (err) {
      setError('Failed to check regeneration eligibility');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setStep('generating');
      setError(null);
      
      const regenerationResult = await regenerateProgramSmart(userId);
      
      if (regenerationResult.success) {
        setResult(regenerationResult);
        setStep('success');
        
        setTimeout(() => {
          toast({
            title: regenerationResult.usedFallback ? 'Program Created!' : 'AI Program Generated!',
            description: regenerationResult.usedFallback 
              ? 'Created an intelligent backup program tailored to your progress.'
              : 'Your new AI-powered workout program is ready!',
          });
          onSuccess(regenerationResult);
          onOpenChange(false);
        }, 2000);
        
      } else {
        setError(regenerationResult.error || 'Failed to generate program');
        setStep('error');
      }
      
    } catch (err) {
      setError('An unexpected error occurred');
      setStep('error');
    }
  };

  const handleRevert = async () => {
    try {
      setLoading(true);
      const revertResult = await revertProgram(userId);
      
      if (revertResult.success) {
        toast({
          title: 'Program Reverted',
          description: 'Successfully reverted to your previous program.',
        });
        onSuccess(revertResult);
        onOpenChange(false);
      } else {
        toast({
          title: 'Revert Failed',
          description: revertResult.error || 'Unable to revert program.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to revert program.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (step) {
      case 'check':
        return 'Program Regeneration';
      case 'confirm':
        return 'Generate New Program?';
      case 'generating':
        return 'Generating Your Program';
      case 'success':
        return 'Program Generated!';
      case 'error':
        return 'Generation Failed';
      default:
        return 'Program Regeneration';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'generating' && <Sparkles className="w-5 h-5 text-primary animate-pulse" />}
            {step === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {step === 'error' && <AlertTriangle className="w-5 h-5 text-destructive" />}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {step === 'check' && 'Checking if your program is ready for regeneration...'}
            {step === 'confirm' && 'Create a new AI-generated workout program based on your current progress.'}
            {step === 'generating' && 'Our AI is creating your personalized workout program...'}
            {step === 'success' && 'Your new program has been generated and is ready to use!'}
            {step === 'error' && 'There was an issue generating your program.'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {loading && step === 'check' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {/* Eligibility Check Results */}
        {step === 'check' && !loading && eligibility && (
          <div className="space-y-4">
            {!eligibility.canRegenerate ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cannot regenerate right now:</strong> {eligibility.reason}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your program is ready for regeneration! {eligibility.reason}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && recommendations && (
          <div className="space-y-4">
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>What happens next:</strong> This will create a completely new AI-generated program 
                that considers your updated preferences and progress. Your current program will be archived 
                but can be reverted within 24 hours.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && result?.program && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{result.usedFallback ? 'Intelligent Program Created!' : 'AI Program Generated!'}</strong>
                <br />
                {result.program.name} - {result.workouts?.length || result.program.totalWorkouts} workouts ready!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'An unexpected error occurred while generating your program.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'confirm' && (
            <>
              <div className="flex gap-2 w-full sm:w-auto">
                {canRevert && (
                  <Button
                    variant="outline"
                    onClick={handleRevert}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Revert to Previous
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>
              <Button 
                onClick={handleRegenerate}
                disabled={!eligibility?.canRegenerate}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate New Program
              </Button>
            </>
          )}

          {step === 'check' && !loading && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}

          {step === 'error' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </>
          )}

          {step === 'generating' && (
            <Button variant="outline" disabled>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}