import { useState } from 'react';
import { OnboardingLayout } from '../OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, X, AlertTriangle } from 'lucide-react';
import type { HealthInfo } from '@/lib/userProfiles';

const commonInjuries = [
  'Lower back', 'Knee', 'Shoulder', 'Ankle', 'Wrist', 'Hip', 'Neck', 'Elbow'
];

const severityLevels = [
  { value: 'mild', label: 'Mild', description: 'Minor discomfort, doesn\'t limit activity' },
  { value: 'moderate', label: 'Moderate', description: 'Some limitation, requires modification' },
  { value: 'severe', label: 'Severe', description: 'Significant limitation, medical attention needed' },
];

const commonLimitations = [
  'Limited mobility',
  'Joint stiffness',
  'Balance issues',
  'Chronic pain',
  'Breathing difficulties',
  'Fatigue',
  'Muscle weakness',
  'Coordination problems'
];

const commonConditions = [
  'Arthritis',
  'Diabetes',
  'High blood pressure',
  'Heart condition',
  'Asthma',
  'Osteoporosis',
  'Fibromyalgia',
  'Thyroid condition'
];

export function Step5HealthLimitations() {
  const { profile, saveStepData, nextStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<HealthInfo>({
    injuryHistory: profile?.health?.injuryHistory || [],
    limitations: profile?.health?.limitations || [],
    medicalConditions: profile?.health?.medicalConditions || [],
    painAreas: profile?.health?.painAreas || [],
    medications: profile?.health?.medications || [],
    allergies: profile?.health?.allergies || [],
  });

  const [newInjury, setNewInjury] = useState({
    bodyPart: '',
    description: '',
    severity: 'mild' as const,
    timeframe: '',
  });

  const [newLimitation, setNewLimitation] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newPainArea, setNewPainArea] = useState('');

  const handleNext = async () => {
    try {
      setLoading(true);
      await saveStepData({
        health: formData,
      });
      nextStep();
    } catch (error) {
      toast({
        title: "Error saving data",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addInjury = () => {
    if (newInjury.bodyPart && newInjury.description) {
      setFormData({
        ...formData,
        injuryHistory: [...formData.injuryHistory, newInjury],
      });
      setNewInjury({
        bodyPart: '',
        description: '',
        severity: 'mild',
        timeframe: '',
      });
    }
  };

  const removeInjury = (index: number) => {
    setFormData({
      ...formData,
      injuryHistory: formData.injuryHistory.filter((_, i) => i !== index),
    });
  };

  const addLimitation = () => {
    if (newLimitation && !formData.limitations.includes(newLimitation)) {
      setFormData({
        ...formData,
        limitations: [...formData.limitations, newLimitation],
      });
      setNewLimitation('');
    }
  };

  const removeLimitation = (limitation: string) => {
    setFormData({
      ...formData,
      limitations: formData.limitations.filter(l => l !== limitation),
    });
  };

  const addCondition = () => {
    if (newCondition && !formData.medicalConditions.includes(newCondition)) {
      setFormData({
        ...formData,
        medicalConditions: [...formData.medicalConditions, newCondition],
      });
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setFormData({
      ...formData,
      medicalConditions: formData.medicalConditions.filter(c => c !== condition),
    });
  };

  const addPainArea = () => {
    if (newPainArea && !formData.painAreas.includes(newPainArea)) {
      setFormData({
        ...formData,
        painAreas: [...formData.painAreas, newPainArea],
      });
      setNewPainArea('');
    }
  };

  const removePainArea = (area: string) => {
    setFormData({
      ...formData,
      painAreas: formData.painAreas.filter(a => a !== area),
    });
  };

  return (
    <OnboardingLayout
      title="Health & Safety Information"
      description="Help us keep you safe by telling us about any health considerations (all information is confidential)"
      onNext={handleNext}
      isLoading={loading}
    >
      <div className="space-y-8">
        {/* Important Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Important:</p>
                <p className="text-orange-700">
                  This information helps us create a safe workout plan. If you have serious medical conditions, 
                  please consult your doctor before starting any exercise program.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Injury History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Previous Injuries</span>
              <Badge variant="outline">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Injuries */}
            {formData.injuryHistory.length > 0 && (
              <div className="space-y-2">
                {formData.injuryHistory.map((injury, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{injury.bodyPart}</span>
                        <Badge 
                          variant={injury.severity === 'severe' ? 'destructive' : 
                                  injury.severity === 'moderate' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {injury.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{injury.description}</p>
                      {injury.timeframe && (
                        <p className="text-xs text-muted-foreground mt-1">{injury.timeframe}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInjury(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Injury */}
            <div className="space-y-3 p-4 border border-dashed rounded-lg">
              <Label>Add Previous Injury</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bodyPart">Body Part</Label>
                  <Select
                    value={newInjury.bodyPart}
                    onValueChange={(value) => setNewInjury({ ...newInjury, bodyPart: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select body part" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonInjuries.map((part) => (
                        <SelectItem key={part} value={part}>
                          {part}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={newInjury.severity}
                    onValueChange={(value: 'mild' | 'moderate' | 'severe') => 
                      setNewInjury({ ...newInjury, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div>{level.label}</div>
                            <div className="text-xs text-muted-foreground">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the injury"
                  value={newInjury.description}
                  onChange={(e) => setNewInjury({ ...newInjury, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="timeframe">When did this occur?</Label>
                <Input
                  id="timeframe"
                  placeholder="e.g., '2 years ago', 'Last month'"
                  value={newInjury.timeframe}
                  onChange={(e) => setNewInjury({ ...newInjury, timeframe: e.target.value })}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addInjury}
                disabled={!newInjury.bodyPart || !newInjury.description}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Injury
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Pain Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Current Pain Areas</span>
              <Badge variant="outline">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.painAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.painAreas.map((area) => (
                  <Badge key={area} variant="outline" className="flex items-center gap-1">
                    {area}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removePainArea(area)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="e.g., Lower back, Right knee"
                value={newPainArea}
                onChange={(e) => setNewPainArea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPainArea()}
              />
              <Button type="button" onClick={addPainArea} disabled={!newPainArea}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Physical Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Physical Limitations</span>
              <Badge variant="outline">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.limitations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.limitations.map((limitation) => (
                  <Badge key={limitation} variant="outline" className="flex items-center gap-1">
                    {limitation}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeLimitation(limitation)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a physical limitation"
                  value={newLimitation}
                  onChange={(e) => setNewLimitation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLimitation()}
                />
                <Button type="button" onClick={addLimitation} disabled={!newLimitation}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {commonLimitations.map((limitation) => (
                  <Button
                    key={limitation}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!formData.limitations.includes(limitation)) {
                        setFormData({
                          ...formData,
                          limitations: [...formData.limitations, limitation],
                        });
                      }
                    }}
                    disabled={formData.limitations.includes(limitation)}
                    className="text-xs"
                  >
                    {limitation}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Medical Conditions</span>
              <Badge variant="outline">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.medicalConditions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.medicalConditions.map((condition) => (
                  <Badge key={condition} variant="outline" className="flex items-center gap-1">
                    {condition}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeCondition(condition)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a medical condition"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                />
                <Button type="button" onClick={addCondition} disabled={!newCondition}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {commonConditions.map((condition) => (
                  <Button
                    key={condition}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!formData.medicalConditions.includes(condition)) {
                        setFormData({
                          ...formData,
                          medicalConditions: [...formData.medicalConditions, condition],
                        });
                      }
                    }}
                    disabled={formData.medicalConditions.includes(condition)}
                    className="text-xs"
                  >
                    {condition}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optional: Medications and Allergies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medications">Current Medications (Optional)</Label>
            <Textarea
              id="medications"
              placeholder="List any medications that might affect exercise"
              value={formData.medications?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                medications: e.target.value.split(',').map(m => m.trim()).filter(m => m)
              })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies (Optional)</Label>
            <Textarea
              id="allergies"
              placeholder="Any allergies we should be aware of"
              value={formData.allergies?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a)
              })}
              rows={3}
            />
          </div>
        </div>

        {/* Skip Option */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have any health concerns? That's great! You can skip this section and continue to the next step.
            </p>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
}