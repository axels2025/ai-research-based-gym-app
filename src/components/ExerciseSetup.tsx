import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Target, TrendingUp, Scale, Dumbbell, Settings, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  createExerciseProtocol,
  validateComfortableWeight,
  type ExerciseProtocol,
  type EquipmentType,
  type WorkoutGoal
} from "@/lib/researchBasedWorkout";

interface ExerciseSetupProps {
  exerciseName: string;
  onProtocolGenerated: (protocol: ExerciseProtocol) => void;
  defaultEquipment?: EquipmentType;
  defaultGoal?: WorkoutGoal;
  previousComfortableWeight?: {
    weight: number;
    reps: number;
    date: Date;
  };
}

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'dumbbell', label: 'Dumbbells', icon: '💪' },
  { value: 'machine', label: 'Machine', icon: '⚙️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' }
] as const;

const GOAL_OPTIONS = [
  { 
    value: 'strength', 
    label: 'Strength', 
    description: 'Max force production (1-6 reps)',
    restTime: '3-5 minutes',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
  },
  { 
    value: 'hypertrophy', 
    label: 'Muscle Growth', 
    description: 'Size & mass (6-12 reps)',
    restTime: '60-90 seconds',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
  },
  { 
    value: 'endurance', 
    label: 'Endurance', 
    description: 'Muscular endurance (12+ reps)',
    restTime: '30-60 seconds',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
  }
] as const;

export const ExerciseSetup = ({ 
  exerciseName,
  onProtocolGenerated,
  defaultEquipment = 'barbell',
  defaultGoal = 'strength',
  previousComfortableWeight
}: ExerciseSetupProps) => {
  const [comfortableWeight, setComfortableWeight] = useState(
    previousComfortableWeight?.weight || 0
  );
  const [comfortableReps, setComfortableReps] = useState(
    previousComfortableWeight?.reps || 8
  );
  const [equipmentType, setEquipmentType] = useState<EquipmentType>(defaultEquipment);
  const [goal, setGoal] = useState<WorkoutGoal>(defaultGoal);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<ExerciseProtocol | null>(null);

  // Validate input and show preview when values change
  useEffect(() => {
    if (comfortableWeight > 0 && comfortableReps > 0) {
      const validation = validateComfortableWeight(exerciseName, comfortableWeight, comfortableReps, equipmentType);
      
      if (!validation.isValid) {
        setValidationError(validation.message || null);
        setShowPreview(false);
        return;
      }
      
      setValidationError(null);
      
      // Generate preview protocol
      const newProtocol = createExerciseProtocol(
        exerciseName,
        comfortableWeight,
        comfortableReps,
        equipmentType,
        goal,
        [], // muscleActivation - would be populated from exercise database
        []  // formCues - would be populated from exercise database
      );
      
      setProtocol(newProtocol);
      setShowPreview(true);
    } else {
      setShowPreview(false);
      setValidationError(null);
    }
  }, [comfortableWeight, comfortableReps, equipmentType, goal, exerciseName]);

  const handleGenerateProtocol = () => {
    if (protocol) {
      onProtocolGenerated(protocol);
    }
  };

  const selectedGoal = GOAL_OPTIONS.find(g => g.value === goal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{exerciseName} Setup</h2>
            <p className="text-sm text-muted-foreground">
              Let's create your research-based workout protocol
            </p>
          </div>
        </div>

        {previousComfortableWeight && (
          <Alert className="mb-4">
            <Target className="w-4 h-4" />
            <AlertDescription>
              Last time: {previousComfortableWeight.weight}kg for {previousComfortableWeight.reps} reps
              {previousComfortableWeight.date && ` (${previousComfortableWeight.date.toLocaleDateString()})`}
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comfortable Weight Input */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <Label className="text-lg font-semibold">Comfortable Weight Assessment</Label>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>What weight can you {exerciseName.toLowerCase()} for comfortable, controlled reps?</strong>
                <br />
                Choose a weight where you could do 2-3 more reps with good form.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={comfortableWeight || ''}
                  onChange={(e) => setComfortableWeight(Number(e.target.value))}
                  placeholder="e.g., 60"
                  className="text-center text-xl font-bold"
                />
              </div>
              
              <div>
                <Label htmlFor="reps">Comfortable Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  value={comfortableReps || ''}
                  onChange={(e) => setComfortableReps(Number(e.target.value))}
                  placeholder="e.g., 8"
                  className="text-center text-xl font-bold"
                />
              </div>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Equipment & Goal Selection */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-primary" />
              <Label className="text-lg font-semibold">Equipment & Training Goal</Label>
            </div>

            <div>
              <Label htmlFor="equipment">Equipment Type</Label>
              <Select value={equipmentType} onValueChange={(value: EquipmentType) => setEquipmentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="goal">Training Goal</Label>
              <Select value={goal} onValueChange={(value: WorkoutGoal) => setGoal(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGoal && (
              <div className={`p-3 rounded-lg ${selectedGoal.color}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">{selectedGoal.label} Protocol</span>
                </div>
                <p className="text-sm mt-1">
                  Rest periods: {selectedGoal.restTime}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Protocol Preview */}
      {showPreview && protocol && (
        <Card className="p-6 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Generated Protocol Preview
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warm-up Sets */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Warm-up Progression ({protocol.warmupSets.length} sets)
              </h4>
              <div className="space-y-2">
                {protocol.warmupSets.map((set, index) => (
                  <div key={set.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <span className="text-sm">
                      {index + 1}. {set.weight}kg × {set.reps}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(set.restTime / 60)}:{(set.restTime % 60).toString().padStart(2, '0')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Working Sets */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Working Sets ({protocol.workingSets.length} sets)
              </h4>
              <div className="space-y-2">
                {protocol.workingSets.map((set, index) => (
                  <div key={set.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">
                      {index + 1}. {set.weight}kg × {set.reps}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(set.restTime / 60)}:{(set.restTime % 60).toString().padStart(2, '0')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Estimated Time:</strong> {protocol.totalEstimatedTime} minutes
            </p>
          </div>

          <Button 
            onClick={handleGenerateProtocol}
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
          >
            Use This Protocol
          </Button>
        </Card>
      )}
    </div>
  );
};