import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Flame, Zap, Timer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCoachingTips, type SetType } from "@/lib/researchBasedWorkout";

interface EnhancedRestTimerProps {
  duration: number; // seconds
  onComplete: () => void;
  isActive: boolean;
  setType: SetType;
  setDescription?: string;
  percentage?: number; // for warmup sets
  stage?: 'movement-prep' | 'activation' | 'potentiation';
  targetRPE?: number;
  showCoachingTips?: boolean;
  autoStart?: boolean;
}

export const EnhancedRestTimer = ({ 
  duration, 
  onComplete, 
  isActive,
  setType,
  setDescription = '',
  percentage,
  stage,
  targetRPE,
  showCoachingTips = true,
  autoStart = false
}: EnhancedRestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get coaching tips for this set type
  const coachingTips = getCoachingTips(setType, percentage, stage);

  useEffect(() => {
    if (!isActive) {
      setIsRunning(false);
      setTimeLeft(duration);
      setCurrentTipIndex(0);
      return;
    }

    if (autoStart && isActive) {
      setIsRunning(true);
    }
  }, [isActive, duration, autoStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let tipInterval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);

      // Cycle through coaching tips every 15 seconds
      if (coachingTips.length > 1) {
        tipInterval = setInterval(() => {
          setCurrentTipIndex((prev) => (prev + 1) % coachingTips.length);
        }, 15000);
      }
    }

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, [isRunning, timeLeft, coachingTips.length]);

  const handleTimerComplete = () => {
    if (soundEnabled) {
      // Play completion sound (you would implement actual audio file here)
      try {
        const audio = new Audio(); // Would use actual sound file path
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Audio play failed - this is fine, just continue silently
        });
      } catch (error) {
        // Audio not available - continue silently
      }
    }
    
    // Optional: Trigger device vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    onComplete();
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setCurrentTipIndex(0);
  };
  
  const handleSkip = () => {
    setIsRunning(false);
    setTimeLeft(0);
    onComplete();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  // Determine timer styling based on set type and time remaining
  const getTimerStyling = () => {
    if (setType === 'warmup') {
      return {
        gradient: "from-orange-500/20 to-orange-600/20",
        iconColor: "text-orange-600",
        progressColor: "from-orange-500 to-orange-600",
        icon: Flame,
        badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
      };
    } else {
      return {
        gradient: "from-blue-500/20 to-blue-600/20",
        iconColor: "text-blue-600",
        progressColor: "from-blue-500 to-blue-600", 
        icon: Zap,
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
      };
    }
  };

  const styling = getTimerStyling();
  const TimerIcon = styling.icon;

  // Warning styling for last 30 seconds
  const isWarningTime = timeLeft <= 30 && timeLeft > 0;
  const isCompleted = timeLeft === 0;

  if (!isActive) return null;

  return (
    <Card className={`p-6 bg-gradient-to-br ${styling.gradient} border-2 ${isWarningTime ? 'border-yellow-400' : isCompleted ? 'border-green-400' : 'border-primary/20'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TimerIcon className={`w-5 h-5 ${styling.iconColor}`} />
          <h3 className="text-lg font-semibold">Rest Timer</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={styling.badgeColor}>
            {setType === 'warmup' ? 'Warm-up' : 'Working Set'}
          </Badge>
          
          {targetRPE && (
            <Badge variant="outline">
              Target RPE: {targetRPE}
            </Badge>
          )}
        </div>
      </div>

      {/* Set Description */}
      {setDescription && (
        <div className="text-sm text-muted-foreground mb-4 text-center">
          {setDescription}
          {percentage && ` (${percentage}% intensity)`}
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold mb-3 ${isWarningTime ? 'text-yellow-600 animate-pulse' : isCompleted ? 'text-green-600' : 'text-primary'}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-3 mb-2">
          <div 
            className={`bg-gradient-to-r ${styling.progressColor} h-3 rounded-full transition-all duration-1000 ${isWarningTime ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          {isCompleted ? 'Time\'s up!' : `${Math.floor((duration - timeLeft) / 60)}:${((duration - timeLeft) % 60).toString().padStart(2, '0')} elapsed`}
        </div>
      </div>

      {/* Coaching Tips */}
      {showCoachingTips && coachingTips.length > 0 && !isCompleted && (
        <Alert className="mb-4 bg-card/50">
          <TimerIcon className="w-4 h-4" />
          <AlertDescription>
            <strong>Form Focus:</strong> {coachingTips[currentTipIndex]}
            {coachingTips.length > 1 && (
              <div className="flex items-center gap-1 mt-1">
                {coachingTips.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${index === currentTipIndex ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2 justify-center">
        {!isRunning ? (
          <Button onClick={handleStart} size="sm" className="flex-1">
            <Play className="w-4 h-4 mr-1" />
            {timeLeft === duration ? 'Start' : 'Resume'}
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" size="sm" className="flex-1">
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </Button>
        )}
        
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        
        <Button onClick={handleSkip} variant="outline" size="sm">
          <SkipForward className="w-4 h-4 mr-1" />
          Skip
        </Button>
        
        <Button 
          onClick={() => setSoundEnabled(!soundEnabled)} 
          variant="ghost" 
          size="sm"
          className="px-2"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      {/* Rest Period Information */}
      {setType === 'working' && (
        <div className="mt-4 p-3 bg-card/50 rounded-lg text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-4 h-4" />
            <span>
              Optimal rest for muscle recovery and performance
            </span>
          </div>
        </div>
      )}

      {/* Completion State */}
      {isCompleted && (
        <div className="mt-4 text-center">
          <div className="text-green-600 font-semibold mb-2">
            ✅ Rest period complete!
          </div>
          <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
            Continue to Next Set
          </Button>
        </div>
      )}
    </Card>
  );
};