import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Flame, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen,
  PlayCircle,
  CheckCircle 
} from "lucide-react";
import { 
  createExerciseProtocol,
  getCoachingTips,
  type ExerciseProtocol,
  type EquipmentType,
  type WorkoutGoal 
} from "@/lib/researchBasedWorkout";
import { generateWorkoutSummary } from "@/lib/researchBasedIntegration";

export const ResearchBasedDemo = () => {
  const [exerciseName, setExerciseName] = useState("Barbell Bench Press");
  const [comfortableWeight, setComfortableWeight] = useState(80);
  const [comfortableReps, setComfortableReps] = useState(8);
  const [goal, setGoal] = useState<WorkoutGoal>('strength');
  const [protocol, setProtocol] = useState<ExerciseProtocol | null>(null);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [showWorkout, setShowWorkout] = useState(false);

  const handleGenerateProtocol = () => {
    const newProtocol = createExerciseProtocol(
      exerciseName,
      comfortableWeight,
      comfortableReps,
      'barbell',
      goal,
      ['chest', 'shoulders', 'triceps'],
      [
        'Retract shoulder blades before lifting',
        'Lower bar to chest with control',
        'Drive feet into floor during press',
        'Maintain tight core throughout movement'
      ]
    );
    setProtocol(newProtocol);
    setCurrentSetIndex(0);
  };

  const handleStartWorkout = () => {
    setShowWorkout(true);
    setCurrentSetIndex(0);
  };

  const handleNextSet = () => {
    if (protocol) {
      const totalSets = protocol.warmupSets.length + protocol.workingSets.length;
      if (currentSetIndex < totalSets - 1) {
        setCurrentSetIndex(currentSetIndex + 1);
      }
    }
  };

  const allSets = protocol ? [...protocol.warmupSets, ...protocol.workingSets] : [];
  const currentSet = allSets[currentSetIndex];
  const isWarmupSet = protocol && currentSetIndex < protocol.warmupSets.length;
  const isLastSet = currentSetIndex === allSets.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Research-Based Workout Demo</h1>
        <p className="text-muted-foreground">
          Experience scientifically-backed warm-up progressions and working sets
        </p>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Exercise Setup</TabsTrigger>
          <TabsTrigger value="protocol" disabled={!protocol}>Protocol Review</TabsTrigger>
          <TabsTrigger value="workout" disabled={!showWorkout}>Active Workout</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Exercise Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exercise">Exercise Name</Label>
                  <Input
                    id="exercise"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="e.g., Barbell Bench Press"
                  />
                </div>

                <div>
                  <Label htmlFor="goal">Training Goal</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as WorkoutGoal)}
                  >
                    <option value="strength">Strength (1-6 reps)</option>
                    <option value="hypertrophy">Hypertrophy (6-12 reps)</option>
                    <option value="endurance">Endurance (12+ reps)</option>
                  </select>
                </div>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <BookOpen className="w-4 h-4" />
                <AlertDescription>
                  <strong>Key Question:</strong> What weight can you {exerciseName.toLowerCase()} 
                  for {comfortableReps} comfortable, controlled reps with good form?
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Comfortable Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={comfortableWeight}
                    onChange={(e) => setComfortableWeight(Number(e.target.value))}
                    className="text-center text-xl font-bold"
                  />
                </div>
                <div>
                  <Label htmlFor="reps">Comfortable Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    value={comfortableReps}
                    onChange={(e) => setComfortableReps(Number(e.target.value))}
                    className="text-center text-xl font-bold"
                  />
                </div>
              </div>

              <Button onClick={handleGenerateProtocol} className="w-full" size="lg">
                Generate Research-Based Protocol
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="protocol" className="space-y-6">
          {protocol && (
            <>
              <Card className="p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                    Protocol Generated: {protocol.exerciseName}
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Warm-up Sets */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Warm-up Progression ({protocol.warmupSets.length} sets)
                    </h4>
                    <div className="space-y-2">
                      {protocol.warmupSets.map((set, index) => (
                        <div key={set.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                          <div>
                            <span className="font-medium">
                              {index + 1}. {set.weight}kg × {set.reps}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {set.description} ({set.percentage}%)
                            </div>
                          </div>
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
                      <Zap className="w-4 h-4 text-blue-500" />
                      Working Sets ({protocol.workingSets.length} sets)
                    </h4>
                    <div className="space-y-2">
                      {protocol.workingSets.map((set, index) => (
                        <div key={set.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div>
                            <span className="font-medium">
                              {index + 1}. {set.weight}kg × {set.reps}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {set.description}
                              {set.targetRPE && ` (RPE: ${set.targetRPE})`}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(set.restTime / 60)}:{(set.restTime % 60).toString().padStart(2, '0')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-semibold">{protocol.totalEstimatedTime} min</div>
                      <div className="text-muted-foreground">Total Time</div>
                    </div>
                    <div>
                      <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-semibold capitalize">{protocol.goal}</div>
                      <div className="text-muted-foreground">Training Goal</div>
                    </div>
                    <div>
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-semibold">{protocol.workingWeight}kg</div>
                      <div className="text-muted-foreground">Working Weight</div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleStartWorkout} className="w-full mt-4" size="lg">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Workout
                </Button>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="workout" className="space-y-6">
          {protocol && showWorkout && currentSet && (
            <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {isWarmupSet ? (
                    <Flame className="w-6 h-6 text-orange-500" />
                  ) : (
                    <Zap className="w-6 h-6 text-blue-500" />
                  )}
                  <h2 className="text-2xl font-bold">{protocol.exerciseName}</h2>
                </div>

                <div className="mb-6">
                  <Badge className={isWarmupSet ? 
                    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 mb-2" :
                    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 mb-2"
                  }>
                    {isWarmupSet ? 'Warm-up Set' : 'Working Set'} {currentSetIndex + 1} of {allSets.length}
                  </Badge>
                  <div className="text-lg text-muted-foreground">
                    {currentSet.description}
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-primary">{currentSet.weight}kg</div>
                      <div className="text-sm text-muted-foreground">Weight</div>
                      {'percentage' in currentSet && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ({currentSet.percentage}% intensity)
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{currentSet.reps}</div>
                      <div className="text-sm text-muted-foreground">Reps</div>
                      {'targetRPE' in currentSet && currentSet.targetRPE && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Target RPE: {currentSet.targetRPE}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coaching Tips */}
                <Alert className="mb-6 bg-card/50 text-left">
                  <Target className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Form Focus:</strong> {getCoachingTips(
                      isWarmupSet ? 'warmup' : 'working',
                      'percentage' in currentSet ? currentSet.percentage : undefined,
                      'stage' in currentSet ? currentSet.stage : undefined
                    )[0]}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={currentSetIndex === 0}
                  >
                    Previous Set
                  </Button>
                  <Button
                    onClick={handleNextSet}
                    className="flex-1"
                    disabled={isLastSet}
                  >
                    {isLastSet ? 'Complete Exercise' : 'Complete Set & Rest'}
                  </Button>
                </div>

                {/* Rest Information */}
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Rest {Math.floor(currentSet.restTime / 60)}:{(currentSet.restTime % 60).toString().padStart(2, '0')} 
                      before next set
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};