import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  Calendar, 
  TrendingUp, 
  ChevronRight, 
  Clock,
  Zap,
  Target
} from 'lucide-react';
import { getRotationStatus, advanceRotation, type WorkoutProgram } from '@/lib/firestore';
import { toast } from '@/hooks/use-toast';

interface RotationStatusProps {
  program: WorkoutProgram;
  userId: string;
  onRotationChange?: () => void;
}

interface RotationData {
  currentRotation: number;
  totalRotations: number;
  weeksInCurrentRotation: number;
  daysUntilNextRotation?: number;
  rotationProgress: number;
}

export function RotationStatus({ program, userId, onRotationChange }: RotationStatusProps) {
  const [rotationData, setRotationData] = useState<RotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    loadRotationStatus();
  }, [program.id]);

  const loadRotationStatus = async () => {
    try {
      setLoading(true);
      const status = await getRotationStatus(program.id);
      setRotationData(status);
    } catch (error) {
      console.error('Error loading rotation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRotation = async () => {
    if (!rotationData) return;
    
    try {
      setAdvancing(true);
      await advanceRotation(userId, program.id);
      
      toast({
        title: 'Rotation Advanced! 🔄',
        description: `Welcome to rotation ${rotationData.currentRotation + 1}! New exercises and challenges await.`,
      });
      
      await loadRotationStatus();
      onRotationChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to advance rotation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAdvancing(false);
    }
  };

  if (loading || !rotationData) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const getRotationPhase = (rotation: number) => {
    switch (rotation) {
      case 1:
        return { name: 'Foundation', color: 'bg-blue-500', description: 'Building base strength and form' };
      case 2:
        return { name: 'Build', color: 'bg-amber-500', description: 'Increasing intensity and complexity' };
      case 3:
        return { name: 'Strength', color: 'bg-orange-500', description: 'Focus on strength gains' };
      case 4:
        return { name: 'Peak', color: 'bg-red-500', description: 'Maximum challenge and performance' };
      default:
        return { name: 'Complete', color: 'bg-green-500', description: 'Program completed!' };
    }
  };

  const currentPhase = getRotationPhase(rotationData.currentRotation);
  const nextPhase = getRotationPhase(rotationData.currentRotation + 1);
  const isLastRotation = rotationData.currentRotation >= rotationData.totalRotations;
  const canAdvance = rotationData.rotationProgress >= 100 && !isLastRotation;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RotateCcw className="w-5 h-5 text-primary" />
          2-Week Rotation System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rotation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentPhase.color}`} />
            <div>
              <div className="font-semibold">
                Rotation {rotationData.currentRotation} - {currentPhase.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentPhase.description}
              </div>
            </div>
          </div>
          <Badge variant="outline">
            Week {rotationData.weeksInCurrentRotation + 1}/2
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Rotation Progress</span>
            <span className="font-medium">{Math.round(rotationData.rotationProgress)}%</span>
          </div>
          <Progress value={rotationData.rotationProgress} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {rotationData.daysUntilNextRotation !== undefined
                ? `${rotationData.daysUntilNextRotation} days until next rotation`
                : 'Rotation timing not available'
              }
            </span>
          </div>
        </div>

        {/* Rotation Overview */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t">
          {[1, 2, 3, 4].map((rotation) => {
            const phase = getRotationPhase(rotation);
            const isCurrent = rotation === rotationData.currentRotation;
            const isCompleted = rotation < rotationData.currentRotation;
            const isNext = rotation === rotationData.currentRotation + 1;

            return (
              <div
                key={rotation}
                className={`text-center p-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 border border-primary/30'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-muted/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold text-white ${
                  isCompleted ? 'bg-green-500' : phase.color
                }`}>
                  {isCompleted ? '✓' : rotation}
                </div>
                <div className="text-xs font-medium">{phase.name}</div>
                <div className="text-xs text-muted-foreground">2 weeks</div>
              </div>
            );
          })}
        </div>

        {/* Next Rotation Preview */}
        {!isLastRotation && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="w-4 h-4" />
              Next: {nextPhase.name} Phase
            </div>
            <div className="text-xs text-muted-foreground">
              {nextPhase.description}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Increased intensity
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                New exercise variations
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {canAdvance && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleAdvanceRotation}
              disabled={advancing}
              className="w-full flex items-center gap-2"
              variant="default"
            >
              {advancing ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Advancing...
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Advance to {nextPhase.name} Phase
                </>
              )}
            </Button>
          </div>
        )}

        {isLastRotation && (
          <div className="pt-2 border-t text-center">
            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
              🎉 Program Complete!
            </div>
            <div className="text-xs text-muted-foreground">
              You've completed all 3 rotations. Time to regenerate your program for new challenges!
            </div>
          </div>
        )}

        {rotationData.rotationProgress < 50 && !isLastRotation && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Complete more workouts in this rotation to unlock the next phase
          </div>
        )}
      </CardContent>
    </Card>
  );
}