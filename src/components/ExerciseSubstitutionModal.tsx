import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dumbbell, 
  Target, 
  Zap, 
  CheckCircle, 
  Info,
  Loader2,
  ArrowRight,
  Brain
} from "lucide-react";
import { ExerciseSubstitutionEngine, type ExerciseAlternative, type EquipmentType } from "@/lib/exerciseSubstitution";
import { UserProfile } from "@/lib/userProfiles";
import { generateWorkoutSuggestions } from "@/lib/aiAlternatives";
import { toast } from "@/hooks/use-toast";

interface ExerciseSubstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  targetMuscles?: string[];
  userProfile?: UserProfile;
  availableEquipment?: EquipmentType[];
  onSubstitute: (selectedAlternative: ExerciseAlternative) => void;
  reason?: 'equipment' | 'injury' | 'preference' | 'progression';
}

export const ExerciseSubstitutionModal = ({
  open,
  onOpenChange,
  exerciseName,
  targetMuscles = [],
  userProfile,
  availableEquipment = ['dumbbells', 'barbell', 'bodyweight'],
  onSubstitute,
  reason = 'equipment'
}: ExerciseSubstitutionModalProps) => {
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[]>([]);
  const [aiAlternatives, setAiAlternatives] = useState<ExerciseAlternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState<ExerciseAlternative | null>(null);

  useEffect(() => {
    if (open && exerciseName) {
      loadAlternatives();
    }
  }, [open, exerciseName, userProfile, availableEquipment]);

  const loadAlternatives = async () => {
    setLoading(true);
    try {
      // Get alternatives from the substitution engine
      const engineAlternatives = ExerciseSubstitutionEngine.generateAlternatives(
        exerciseName,
        availableEquipment,
        userProfile?.experience.trainingExperience as 'beginner' | 'intermediate' | 'advanced' || 'intermediate',
        userProfile?.health.limitations || [],
        {
          preferredEquipment: userProfile?.experience.equipmentAccess as EquipmentType[] || availableEquipment,
          avoidedMovements: userProfile?.preferences.dislikedExercises || []
        }
      );

      setAlternatives(engineAlternatives);

      // If we have a user profile, also get AI-powered alternatives
      if (userProfile && engineAlternatives.length < 5) {
        setLoadingAI(true);
        try {
          const aiSuggestions = await generateAIAlternatives(exerciseName, userProfile, targetMuscles);
          setAiAlternatives(aiSuggestions);
        } catch (error) {
          console.error('AI alternatives failed:', error);
        } finally {
          setLoadingAI(false);
        }
      }

    } catch (error) {
      console.error('Error loading alternatives:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exercise alternatives',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIAlternatives = async (
    exercise: string, 
    profile: UserProfile, 
    muscles: string[]
  ): Promise<ExerciseAlternative[]> => {
    // This would use the Claude AI API to generate more alternatives
    // For now, returning mock AI alternatives
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAIAlternatives: ExerciseAlternative[] = [
          {
            name: `AI-Suggested Alternative for ${exercise}`,
            equipment: ['dumbbells'],
            targetMuscles: muscles as any,
            difficulty: 'similar',
            instructions: 'AI-generated exercise variation based on your specific needs and limitations',
            modifications: {
              beginner: 'Start with lighter weight and focus on form',
              intermediate: 'Use moderate weight with controlled tempo',
              advanced: 'Add complexity or pause reps'
            }
          }
        ];
        resolve(mockAIAlternatives);
      }, 2000);
    });
  };

  const handleSubstitute = () => {
    if (selectedAlternative) {
      onSubstitute(selectedAlternative);
      onOpenChange(false);
      toast({
        title: 'Exercise Substituted',
        description: `${exerciseName} has been replaced with ${selectedAlternative.name}`,
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easier': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'similar': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'harder': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getReasonDescription = () => {
    switch (reason) {
      case 'equipment':
        return 'Equipment not available - finding suitable alternatives with your available equipment';
      case 'injury':
        return 'Avoiding due to injury concerns - showing safer alternatives';
      case 'preference':
        return 'Based on your preferences - showing exercises you might prefer';
      case 'progression':
        return 'Looking for progression options - showing more challenging variations';
      default:
        return 'Finding suitable alternatives for this exercise';
    }
  };

  const allAlternatives = [...alternatives, ...aiAlternatives];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Exercise Substitution
          </DialogTitle>
          <DialogDescription>
            Finding alternatives for <strong>{exerciseName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Reason Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{getReasonDescription()}</AlertDescription>
        </Alert>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Finding alternatives...</span>
            </div>
          </div>
        )}

        {/* Available Equipment */}
        {availableEquipment.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Available Equipment:</h4>
            <div className="flex flex-wrap gap-2">
              {availableEquipment.map((equipment) => (
                <Badge key={equipment} variant="outline">
                  {equipment.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Target Muscles */}
        {targetMuscles.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Target Muscles:</h4>
            <div className="flex flex-wrap gap-2">
              {targetMuscles.map((muscle) => (
                <Badge key={muscle} variant="secondary">
                  <Target className="w-3 h-3 mr-1" />
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Exercise Alternatives */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Alternative Exercises</h3>
          
          {allAlternatives.length === 0 && !loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alternatives found for this exercise.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alternatives.map((alternative, index) => (
                <Card 
                  key={index}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedAlternative === alternative 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAlternative(alternative)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{alternative.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alternative.instructions}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(alternative.difficulty)}>
                        {alternative.difficulty}
                      </Badge>
                      {selectedAlternative === alternative && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Equipment Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {alternative.equipment.map((eq) => (
                          <Badge key={eq} variant="outline" className="text-xs">
                            {eq.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Target Muscles:</p>
                      <div className="flex flex-wrap gap-1">
                        {alternative.targetMuscles.map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Modifications */}
                  <div className="text-sm">
                    <p className="font-medium mb-1">Modifications:</p>
                    <div className="space-y-1">
                      {alternative.modifications.beginner && (
                        <p><strong>Beginner:</strong> {alternative.modifications.beginner}</p>
                      )}
                      {alternative.modifications.intermediate && (
                        <p><strong>Intermediate:</strong> {alternative.modifications.intermediate}</p>
                      )}
                      {alternative.modifications.advanced && (
                        <p><strong>Advanced:</strong> {alternative.modifications.advanced}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* AI Alternatives Section */}
              {loadingAI && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="w-4 h-4" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is generating personalized alternatives...</span>
                  </div>
                </Card>
              )}

              {aiAlternatives.map((alternative, index) => (
                <Card 
                  key={`ai-${index}`}
                  className={`p-4 cursor-pointer transition-colors border-accent/50 ${
                    selectedAlternative === alternative 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAlternative(alternative)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-lg">{alternative.name}</h4>
                        <Badge className="bg-accent text-accent-foreground">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alternative.instructions}
                      </p>
                    </div>
                    {selectedAlternative === alternative && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  {/* ... rest of the card content similar to regular alternatives */}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubstitute}
            disabled={!selectedAlternative}
            className="flex items-center gap-2"
          >
            Use This Alternative
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};