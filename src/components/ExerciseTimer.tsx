import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ExerciseTimerProps {
  duration: number;
  onComplete: () => void;
  isActive: boolean;
}

export const ExerciseTimer = ({ duration, onComplete, isActive }: ExerciseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsRunning(false);
      setTimeLeft(duration);
      return;
    }
  }, [isActive, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  if (!isActive) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-secondary to-secondary/80">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Rest Timer</h3>
        <div className="text-4xl font-bold text-primary mb-2">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-accent to-accent/80 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex gap-2 justify-center">
        {!isRunning ? (
          <Button onClick={handleStart} size="sm">
            <Play className="w-4 h-4 mr-1" />
            Start
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" size="sm">
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </Button>
        )}
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>
    </Card>
  );
};