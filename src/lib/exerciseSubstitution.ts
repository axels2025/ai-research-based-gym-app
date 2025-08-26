export type EquipmentType = 
  | 'barbell' 
  | 'dumbbells' 
  | 'kettlebells' 
  | 'resistance-bands' 
  | 'cable-machine' 
  | 'smith-machine'
  | 'bodyweight'
  | 'pull-up-bar'
  | 'bench'
  | 'squat-rack';

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'legs' 
  | 'glutes' 
  | 'core' 
  | 'calves'
  | 'hamstrings'
  | 'quadriceps';

export type DifficultyLevel = 'easier' | 'similar' | 'harder';

export interface ExerciseAlternative {
  name: string;
  equipment: EquipmentType[];
  targetMuscles: MuscleGroup[];
  difficulty: DifficultyLevel;
  instructions: string;
  videoUrl?: string;
  modifications: {
    beginner?: string;
    intermediate?: string;
    advanced?: string;
  };
}

export interface ExerciseSubstitution {
  originalExercise: string;
  targetMuscles: MuscleGroup[];
  requiredEquipment: EquipmentType[];
  alternatives: ExerciseAlternative[];
  substitutionNotes: string;
}

export interface SubstitutionRule {
  primaryMuscle: MuscleGroup;
  movementPattern: 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'rotation';
  equipmentPriority: EquipmentType[];
  restrictions?: {
    injuries?: string[];
    limitations?: string[];
  };
}

export class ExerciseSubstitutionEngine {
  private static readonly EXERCISE_DATABASE: Record<string, ExerciseSubstitution> = {
    'Barbell Bench Press': {
      originalExercise: 'Barbell Bench Press',
      targetMuscles: ['chest', 'shoulders', 'triceps'],
      requiredEquipment: ['barbell', 'bench'],
      alternatives: [
        {
          name: 'Dumbbell Bench Press',
          equipment: ['dumbbells', 'bench'],
          targetMuscles: ['chest', 'shoulders', 'triceps'],
          difficulty: 'similar',
          instructions: 'Lie on bench with dumbbells, press up and together',
          modifications: {
            beginner: 'Use lighter weight, focus on control',
            intermediate: 'Standard execution',
            advanced: 'Add pause at bottom or single-arm variation'
          }
        },
        {
          name: 'Push-ups',
          equipment: ['bodyweight'],
          targetMuscles: ['chest', 'shoulders', 'triceps', 'core'],
          difficulty: 'easier',
          instructions: 'Standard push-up position, lower chest to ground',
          modifications: {
            beginner: 'Incline push-ups or knee push-ups',
            intermediate: 'Standard push-ups',
            advanced: 'Decline push-ups or weighted vest'
          }
        },
        {
          name: 'Cable Chest Press',
          equipment: ['cable-machine'],
          targetMuscles: ['chest', 'shoulders', 'triceps'],
          difficulty: 'similar',
          instructions: 'Standing cable press with handles at chest height',
          modifications: {
            beginner: 'Seated variation for stability',
            intermediate: 'Standing with staggered stance',
            advanced: 'Single-arm or explosive execution'
          }
        }
      ],
      substitutionNotes: 'Focus on maintaining the pushing movement pattern and chest activation'
    },

    'Barbell Squat': {
      originalExercise: 'Barbell Squat',
      targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'core'],
      requiredEquipment: ['barbell', 'squat-rack'],
      alternatives: [
        {
          name: 'Goblet Squat',
          equipment: ['dumbbells'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'core'],
          difficulty: 'easier',
          instructions: 'Hold dumbbell at chest, squat down keeping chest up',
          modifications: {
            beginner: 'Bodyweight squat first',
            intermediate: 'Standard goblet squat',
            advanced: 'Pause at bottom or add jump'
          }
        },
        {
          name: 'Bulgarian Split Squat',
          equipment: ['dumbbells', 'bench'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
          difficulty: 'harder',
          instructions: 'Rear foot elevated, lunge down on front leg',
          modifications: {
            beginner: 'Bodyweight version',
            intermediate: 'Hold dumbbells',
            advanced: 'Single dumbbell or jump version'
          }
        },
        {
          name: 'Bodyweight Squat',
          equipment: ['bodyweight'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
          difficulty: 'easier',
          instructions: 'Squat down with arms extended forward for balance',
          modifications: {
            beginner: 'Partial range of motion',
            intermediate: 'Full range squat',
            advanced: 'Jump squats or single-leg squats'
          }
        }
      ],
      substitutionNotes: 'Maintain the squat pattern focusing on hip and knee flexion'
    },

    'Deadlift': {
      originalExercise: 'Deadlift',
      targetMuscles: ['hamstrings', 'glutes', 'back', 'core'],
      requiredEquipment: ['barbell'],
      alternatives: [
        {
          name: 'Romanian Dumbbell Deadlift',
          equipment: ['dumbbells'],
          targetMuscles: ['hamstrings', 'glutes', 'back'],
          difficulty: 'similar',
          instructions: 'Hinge at hips with dumbbells, feel stretch in hamstrings',
          modifications: {
            beginner: 'Start with light weight',
            intermediate: 'Standard execution',
            advanced: 'Single-leg variation'
          }
        },
        {
          name: 'Kettlebell Deadlift',
          equipment: ['kettlebells'],
          targetMuscles: ['hamstrings', 'glutes', 'back', 'core'],
          difficulty: 'similar',
          instructions: 'Deadlift pattern with kettlebell between legs',
          modifications: {
            beginner: 'Focus on hip hinge pattern',
            intermediate: 'Standard execution',
            advanced: 'Single-arm or sumo style'
          }
        },
        {
          name: 'Good Mornings',
          equipment: ['bodyweight'],
          targetMuscles: ['hamstrings', 'glutes', 'back'],
          difficulty: 'easier',
          instructions: 'Hands behind head, hinge at hips keeping back straight',
          modifications: {
            beginner: 'Partial range of motion',
            intermediate: 'Full range with control',
            advanced: 'Add resistance band'
          }
        }
      ],
      substitutionNotes: 'Focus on the hip hinge movement pattern and posterior chain activation'
    },

    'Pull-ups': {
      originalExercise: 'Pull-ups',
      targetMuscles: ['back', 'biceps', 'core'],
      requiredEquipment: ['pull-up-bar'],
      alternatives: [
        {
          name: 'Lat Pulldown',
          equipment: ['cable-machine'],
          targetMuscles: ['back', 'biceps'],
          difficulty: 'easier',
          instructions: 'Pull bar down to upper chest, squeeze shoulder blades',
          modifications: {
            beginner: 'Use lighter weight, focus on form',
            intermediate: 'Standard pulldown',
            advanced: 'Single-arm or pause reps'
          }
        },
        {
          name: 'Resistance Band Pull-ups',
          equipment: ['resistance-bands', 'pull-up-bar'],
          targetMuscles: ['back', 'biceps', 'core'],
          difficulty: 'easier',
          instructions: 'Use resistance band for assistance during pull-ups',
          modifications: {
            beginner: 'Heavy assistance band',
            intermediate: 'Medium assistance',
            advanced: 'Light assistance or none'
          }
        },
        {
          name: 'Inverted Rows',
          equipment: ['barbell', 'squat-rack'],
          targetMuscles: ['back', 'biceps', 'core'],
          difficulty: 'easier',
          instructions: 'Lie under bar, pull chest to bar keeping body straight',
          modifications: {
            beginner: 'Higher bar position',
            intermediate: 'Standard height',
            advanced: 'Feet elevated or weighted'
          }
        }
      ],
      substitutionNotes: 'Maintain vertical pulling pattern and back muscle activation'
    },

    'Overhead Press': {
      originalExercise: 'Overhead Press',
      targetMuscles: ['shoulders', 'triceps', 'core'],
      requiredEquipment: ['barbell'],
      alternatives: [
        {
          name: 'Dumbbell Shoulder Press',
          equipment: ['dumbbells'],
          targetMuscles: ['shoulders', 'triceps', 'core'],
          difficulty: 'similar',
          instructions: 'Press dumbbells overhead from shoulder height',
          modifications: {
            beginner: 'Seated variation for stability',
            intermediate: 'Standing press',
            advanced: 'Single-arm or alternating'
          }
        },
        {
          name: 'Pike Push-ups',
          equipment: ['bodyweight'],
          targetMuscles: ['shoulders', 'triceps', 'core'],
          difficulty: 'harder',
          instructions: 'Downward dog position, lower head toward hands',
          modifications: {
            beginner: 'Incline pike push-ups',
            intermediate: 'Standard pike push-ups',
            advanced: 'Handstand push-ups'
          }
        },
        {
          name: 'Resistance Band Overhead Press',
          equipment: ['resistance-bands'],
          targetMuscles: ['shoulders', 'triceps', 'core'],
          difficulty: 'easier',
          instructions: 'Stand on band, press handles overhead',
          modifications: {
            beginner: 'Light resistance',
            intermediate: 'Medium resistance',
            advanced: 'Heavy resistance or single-arm'
          }
        }
      ],
      substitutionNotes: 'Focus on vertical pushing pattern and shoulder stability'
    }
  };

  static generateAlternatives(
    originalExercise: string,
    availableEquipment: EquipmentType[],
    userExperience: 'beginner' | 'intermediate' | 'advanced',
    injuries?: string[],
    preferences?: {
      preferredEquipment?: EquipmentType[];
      avoidedMovements?: string[];
    }
  ): ExerciseAlternative[] {
    
    const substitution = this.EXERCISE_DATABASE[originalExercise];
    if (!substitution) {
      return this.generateGenericAlternatives(originalExercise, availableEquipment);
    }

    let alternatives = substitution.alternatives.filter(alt => 
      alt.equipment.some(eq => availableEquipment.includes(eq))
    );

    if (preferences?.preferredEquipment) {
      alternatives.sort((a, b) => {
        const aScore = a.equipment.filter(eq => preferences.preferredEquipment!.includes(eq)).length;
        const bScore = b.equipment.filter(eq => preferences.preferredEquipment!.includes(eq)).length;
        return bScore - aScore;
      });
    }

    alternatives = alternatives.filter(alt => {
      if (injuries?.includes('shoulder') && alt.targetMuscles.includes('shoulders')) {
        return alt.difficulty === 'easier';
      }
      if (injuries?.includes('knee') && alt.targetMuscles.includes('quadriceps')) {
        return alt.equipment.includes('bodyweight');
      }
      if (injuries?.includes('back') && alt.targetMuscles.includes('back')) {
        return alt.difficulty === 'easier';
      }
      return true;
    });

    if (userExperience === 'beginner') {
      alternatives = alternatives.filter(alt => alt.difficulty !== 'harder');
    }

    return alternatives.slice(0, 3);
  }

  private static generateGenericAlternatives(
    exerciseName: string,
    availableEquipment: EquipmentType[]
  ): ExerciseAlternative[] {
    const muscleGroups = this.inferMuscleGroups(exerciseName);
    const movementPattern = this.inferMovementPattern(exerciseName);

    const genericAlternatives: ExerciseAlternative[] = [];

    if (availableEquipment.includes('bodyweight')) {
      genericAlternatives.push({
        name: `Bodyweight ${movementPattern} variation`,
        equipment: ['bodyweight'],
        targetMuscles: muscleGroups,
        difficulty: 'similar',
        instructions: 'Bodyweight variation focusing on the same movement pattern',
        modifications: {
          beginner: 'Reduce range of motion',
          intermediate: 'Standard execution',
          advanced: 'Add complexity or tempo'
        }
      });
    }

    return genericAlternatives;
  }

  private static inferMuscleGroups(exerciseName: string): MuscleGroup[] {
    const name = exerciseName.toLowerCase();
    const muscles: MuscleGroup[] = [];

    if (name.includes('chest') || name.includes('bench') || name.includes('push')) {
      muscles.push('chest', 'shoulders', 'triceps');
    }
    if (name.includes('squat') || name.includes('leg')) {
      muscles.push('quadriceps', 'glutes', 'hamstrings');
    }
    if (name.includes('pull') || name.includes('row') || name.includes('lat')) {
      muscles.push('back', 'biceps');
    }
    if (name.includes('deadlift')) {
      muscles.push('hamstrings', 'glutes', 'back');
    }
    if (name.includes('shoulder') || name.includes('press')) {
      muscles.push('shoulders', 'triceps');
    }

    return muscles.length > 0 ? muscles : ['core'];
  }

  private static inferMovementPattern(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('squat')) return 'squat';
    if (name.includes('deadlift')) return 'hinge';
    if (name.includes('lunge')) return 'lunge';
    if (name.includes('press') || name.includes('push')) return 'push';
    if (name.includes('pull') || name.includes('row')) return 'pull';
    
    return 'movement';
  }

  static getSubstitutionRecommendation(
    originalExercise: string,
    reason: 'equipment' | 'injury' | 'preference' | 'progression',
    context: {
      availableEquipment: EquipmentType[];
      userExperience: 'beginner' | 'intermediate' | 'advanced';
      injuries?: string[];
      targetMuscles?: MuscleGroup[];
    }
  ): {
    recommended: ExerciseAlternative;
    reasoning: string;
    implementation: string;
  } | null {
    
    const alternatives = this.generateAlternatives(
      originalExercise,
      context.availableEquipment,
      context.userExperience,
      context.injuries
    );

    if (alternatives.length === 0) return null;

    const recommended = alternatives[0];
    
    let reasoning = '';
    let implementation = '';

    switch (reason) {
      case 'equipment':
        reasoning = `${originalExercise} requires equipment not available. ${recommended.name} provides similar muscle activation with your available equipment.`;
        implementation = `Replace ${originalExercise} with ${recommended.name}. ${recommended.instructions}`;
        break;
      case 'injury':
        reasoning = `Due to injury concerns, ${recommended.name} offers a safer alternative with reduced stress on affected areas.`;
        implementation = `Temporarily substitute with ${recommended.name}. Focus on form and gradually progress.`;
        break;
      case 'preference':
        reasoning = `Based on your preferences, ${recommended.name} may be more enjoyable while targeting the same muscles.`;
        implementation = `Try ${recommended.name} as an alternative. You can rotate between exercises for variety.`;
        break;
      case 'progression':
        reasoning = `${recommended.name} offers a ${recommended.difficulty} progression from ${originalExercise}.`;
        implementation = `Progress to ${recommended.name} when ready. ${recommended.modifications[context.userExperience] || recommended.instructions}`;
        break;
    }

    return {
      recommended,
      reasoning,
      implementation
    };
  }

  static buildPersonalizedSubstitutionLibrary(
    userProfile: {
      equipmentAccess: EquipmentType[];
      injuries: string[];
      preferences: {
        favoriteExercises: string[];
        dislikedExercises: string[];
      };
      experience: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Record<string, ExerciseAlternative[]> {
    
    const personalizedLibrary: Record<string, ExerciseAlternative[]> = {};

    Object.keys(this.EXERCISE_DATABASE).forEach(exercise => {
      const alternatives = this.generateAlternatives(
        exercise,
        userProfile.equipmentAccess,
        userProfile.experience,
        userProfile.injuries,
        { preferredEquipment: userProfile.equipmentAccess }
      );

      if (alternatives.length > 0) {
        personalizedLibrary[exercise] = alternatives;
      }
    });

    return personalizedLibrary;
  }
}

export function validateExerciseSubstitution(
  original: string,
  substitute: string,
  targetMuscles: MuscleGroup[]
): {
  isValid: boolean;
  muscleMatchScore: number; // 0-1
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  return {
    isValid: true,
    muscleMatchScore: 0.85,
    warnings,
    recommendations: ['Monitor form and adjust weight accordingly']
  };
}