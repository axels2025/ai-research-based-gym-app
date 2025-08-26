import { UserProfile, generateAIPromptData } from './userProfiles';
import { WorkoutProgram, Workout, Exercise, createWorkoutProgram, createWorkout } from './firestore';
import { config } from './config';
import { Timestamp } from 'firebase/firestore';

// TypeScript types for Claude AI API
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AIWorkoutPlan {
  programName: string;
  totalWeeks: number;
  rotationCycles: {
    cycleNumber: number;
    weeks: number[]; // [1, 2] or [3, 4] etc.
    focus: string; // "Foundation Phase", "Build Phase", etc.
    workouts: {
      day: number;
      title: string;
      estimatedTime: number;
      warmup: string[];
      exercises: {
        name: string;
        sets: number;
        reps: string;
        restTime: number;
        notes: string;
        alternatives: string[];
      }[];
      cooldown: string[];
    }[];
  }[];
  progressionNotes: string;
  nutritionTips: string;
  recoveryGuidance: string;
}

// Error types for better error handling
export class AIWorkoutGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'API_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIWorkoutGenerationError';
  }
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

// Utility function for delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Utility function for exponential backoff
const getRetryDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(
    RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, attempt),
    RATE_LIMIT_CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return exponentialDelay + Math.random() * 1000;
};

// Claude AI API integration - updated to use config
async function callClaudeAPI(prompt: string, retryAttempt = 0): Promise<ClaudeResponse> {
  let apiKey: string;
  
  try {
    apiKey = config.anthropic.apiKey;
  } catch (error) {
    throw new AIWorkoutGenerationError(
      'Anthropic API key not found. Please configure your API key.',
      'API_ERROR'
    );
  }

  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages,
        temperature: 0.7,
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      if (retryAttempt < RATE_LIMIT_CONFIG.maxRetries) {
        const retryDelay = getRetryDelay(retryAttempt);
        console.warn(`Rate limited. Retrying in ${retryDelay}ms... (attempt ${retryAttempt + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1})`);
        await delay(retryDelay);
        return callClaudeAPI(prompt, retryAttempt + 1);
      } else {
        throw new AIWorkoutGenerationError(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT'
        );
      }
    }

    // Handle other API errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new AIWorkoutGenerationError(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        'API_ERROR'
      );
    }

    const data = await response.json() as ClaudeResponse;
    return data;

  } catch (error) {
    if (error instanceof AIWorkoutGenerationError) {
      throw error;
    }

    // Network or other errors - retry if possible
    if (retryAttempt < RATE_LIMIT_CONFIG.maxRetries) {
      const retryDelay = getRetryDelay(retryAttempt);
      console.warn(`Network error. Retrying in ${retryDelay}ms... (attempt ${retryAttempt + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1})`);
      await delay(retryDelay);
      return callClaudeAPI(prompt, retryAttempt + 1);
    }

    throw new AIWorkoutGenerationError(
      'Network error occurred while generating workout plan.',
      'NETWORK_ERROR',
      error
    );
  }
}

// Create the comprehensive prompt for Claude AI
function createWorkoutGenerationPrompt(userProfile: UserProfile): string {
  const userPromptData = generateAIPromptData(userProfile);
  
  return `You are an expert fitness coach creating a personalized workout program. Based on the user profile below, generate a comprehensive 8-week program with 2-week rotation cycles.

USER PROFILE:
${userPromptData}

REQUIREMENTS:
1. Create 4 different 2-week cycles (8 weeks total)
2. Each cycle should progress in difficulty
3. Rotate exercises every 2 weeks to prevent boredom
4. Include warm-up and cool-down for each session
5. Provide exercise alternatives for equipment limitations
6. Consider injury history and limitations
7. Include progressive overload strategy

ADDITIONAL SPECIFICATIONS:
- Include ${userProfile.availability.sessionsPerWeek} workouts per week
- Each workout should be approximately ${userProfile.availability.sessionDuration} minutes
- Follow the preferred workout split: ${userProfile.preferences.preferredWorkoutSplit}
- Use available equipment: ${userProfile.experience.equipmentAccess?.join(', ')}
- Account for injuries/limitations: ${userProfile.health.limitations?.join(', ') || 'None'}
- Include favorite exercises when possible: ${userProfile.preferences.favoriteExercises?.join(', ') || 'None specified'}
- Avoid disliked exercises: ${userProfile.preferences.dislikedExercises?.join(', ') || 'None specified'}

RESPONSE FORMAT - Return valid JSON only:
{
  "programName": "string",
  "totalWeeks": 8,
  "rotationCycles": [
    {
      "cycleNumber": 1,
      "weeks": [1, 2],
      "focus": "Foundation Phase",
      "workouts": [
        {
          "day": 1,
          "title": "Workout Name",
          "estimatedTime": ${userProfile.availability.sessionDuration},
          "warmup": ["exercise1", "exercise2"],
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": 3,
              "reps": "8-10",
              "restTime": 90,
              "notes": "Form cues and modifications",
              "alternatives": ["alt1", "alt2"]
            }
          ],
          "cooldown": ["stretch1", "stretch2"]
        }
      ]
    }
  ],
  "progressionNotes": "How to advance between cycles",
  "nutritionTips": "Basic nutrition advice",
  "recoveryGuidance": "Rest and recovery recommendations"
}

Ensure the program matches the user's goals, experience level, available equipment, and schedule constraints.

IMPORTANT:
- Return ONLY the JSON object, no additional text
- Ensure all JSON is valid and properly formatted
- Include realistic rep ranges for the user's experience level
- Consider the user's goals when designing the program
- Make sure exercise names are clear and commonly understood
- Include proper rest periods appropriate for the workout intensity

Generate the workout program now:`;
}

// Parse and validate the AI response
function parseAIResponse(response: ClaudeResponse): AIWorkoutPlan {
  try {
    const content = response.content[0]?.text;
    if (!content) {
      throw new AIWorkoutGenerationError('Empty response from AI', 'PARSE_ERROR');
    }

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AIWorkoutGenerationError('No JSON found in AI response', 'PARSE_ERROR');
    }

    const workoutPlan = JSON.parse(jsonMatch[0]) as AIWorkoutPlan;

    // Validate the structure
    if (!workoutPlan.programName || !workoutPlan.rotationCycles || !Array.isArray(workoutPlan.rotationCycles)) {
      throw new AIWorkoutGenerationError('Invalid workout plan structure', 'VALIDATION_ERROR');
    }

    return workoutPlan;

  } catch (error) {
    if (error instanceof AIWorkoutGenerationError) {
      throw error;
    }

    throw new AIWorkoutGenerationError(
      'Failed to parse AI response',
      'PARSE_ERROR',
      error
    );
  }
}

// Convert AI workout plan to database structures
async function convertToWorkoutProgram(
  userId: string,
  aiPlan: AIWorkoutPlan
): Promise<{ program: WorkoutProgram; workouts: Workout[] }> {
  try {
    // Calculate total workouts across all cycles
    const totalWorkouts = aiPlan.rotationCycles.reduce((total, cycle) => {
      return total + cycle.workouts.length * cycle.weeks.length;
    }, 0);

    // Create the workout program
    const program = await createWorkoutProgram(userId, {
      name: aiPlan.programName,
      currentWeek: 1,
      totalWeeks: aiPlan.totalWeeks,
      workoutsCompleted: 0,
      totalWorkouts,
      aiGenerated: true,
      generationSource: 'ai',
    });

    // Create all workouts
    const workouts: Workout[] = [];
    
    for (const cycle of aiPlan.rotationCycles) {
      for (const weekNumber of cycle.weeks) {
        for (const aiWorkout of cycle.workouts) {
          const workout = await createWorkout(userId, {
            programId: program.id,
            title: aiWorkout.title,
            week: weekNumber,
            day: aiWorkout.day,
            exercises: aiWorkout.exercises.length,
            estimatedTime: aiWorkout.estimatedTime,
            isCompleted: false,
            rotation: cycle.cycleNumber,
            rotationWeek: cycle.weeks.indexOf(weekNumber) + 1,
            exerciseVariations: aiWorkout.exercises.map(e => e.alternatives).flat(),
            progressionNotes: cycle.focus,
          });
          
          workouts.push(workout);
        }
      }
    }

    return { program, workouts };

  } catch (error) {
    throw new AIWorkoutGenerationError(
      'Failed to create workout program in database',
      'API_ERROR',
      error
    );
  }
}

// Fallback workout plan in case AI generation fails
function createFallbackWorkoutPlan(userProfile: UserProfile): AIWorkoutPlan {
  const sessionsPerWeek = userProfile.availability.sessionsPerWeek;
  const sessionDuration = userProfile.availability.sessionDuration;
  
  // Create a basic full-body or upper/lower split based on sessions per week
  const isFullBody = sessionsPerWeek <= 3;
  
  const fallbackPlan: AIWorkoutPlan = {
    programName: `Personalized ${isFullBody ? 'Full Body' : 'Split'} Program`,
    totalWeeks: 8,
    rotationCycles: [],
    progressionNotes: "Increase weight by 2.5-5lbs when you can complete all sets with perfect form. Focus on progressive overload and consistent training across all 4 cycles.",
    nutritionTips: "Focus on adequate protein (0.8-1g per lb bodyweight), stay hydrated, and eat balanced meals with complex carbs and healthy fats.",
    recoveryGuidance: "Get 7-9 hours of sleep, take rest days seriously, and listen to your body. Light stretching and walking on rest days can aid recovery."
  };

  // Create 4 cycles with 2 weeks each
  for (let cycle = 1; cycle <= 4; cycle++) {
    const weeks = [(cycle - 1) * 2 + 1, (cycle - 1) * 2 + 2]; // [1,2], [3,4], [5,6], [7,8]
    const cycleWorkouts = [];
    
    for (let day = 1; day <= sessionsPerWeek; day++) {
      const baseReps = cycle === 1 ? "12-15" : cycle === 2 ? "10-12" : cycle === 3 ? "8-10" : "6-8";
      const focusPhase = cycle === 1 ? "Foundation" : cycle === 2 ? "Build" : cycle === 3 ? "Strength" : "Peak";
      
      const workout = {
        day: day,
        title: isFullBody ? `${focusPhase} Full Body - Day ${day}` : `${focusPhase} ${day === 1 ? 'Upper' : day === 2 ? 'Lower' : 'Full'} Body`,
        estimatedTime: sessionDuration,
        warmup: ["5 min light cardio", "Dynamic stretching", "Joint mobility"],
        exercises: [
          {
            name: cycle === 1 ? "Bodyweight Squat" : cycle === 2 ? "Goblet Squat" : cycle === 3 ? "Barbell Squat" : "Bulgarian Split Squat",
            sets: 3,
            reps: baseReps,
            restTime: cycle <= 2 ? 60 : 90,
            notes: "Focus on proper form and controlled movement",
            alternatives: ["Bodyweight Squat", "Goblet Squat", "Leg Press", "Wall Sit"]
          },
          {
            name: cycle === 1 ? "Push-up" : cycle === 2 ? "Incline Push-up" : cycle === 3 ? "Bench Press" : "Diamond Push-up",
            sets: 3,
            reps: baseReps,
            restTime: cycle <= 2 ? 60 : 90,
            notes: cycle === 1 ? "Modify on knees if needed" : "Focus on full range of motion",
            alternatives: ["Push-up", "Incline Push-up", "Chest Press", "Dips"]
          },
          {
            name: "Plank",
            sets: 3,
            reps: cycle === 1 ? "30-45 sec" : cycle === 2 ? "45-60 sec" : cycle === 3 ? "60-75 sec" : "75-90 sec",
            restTime: 45,
            notes: "Keep core tight and body straight",
            alternatives: ["Plank", "Side Plank", "Dead Bug", "Mountain Climbers"]
          }
        ],
        cooldown: ["5 min light walking", "Static stretching", "Deep breathing"]
      };
      
      cycleWorkouts.push(workout);
    }
    
    fallbackPlan.rotationCycles.push({
      cycleNumber: cycle,
      weeks: weeks,
      focus: `${cycle === 1 ? "Foundation Phase" : cycle === 2 ? "Build Phase" : cycle === 3 ? "Strength Phase" : "Peak Phase"}`,
      workouts: cycleWorkouts
    });
  }

  return fallbackPlan;
}

// Main function to generate workout plan
export async function generateWorkoutPlan(userProfile: UserProfile): Promise<{
  program: WorkoutProgram;
  workouts: Workout[];
  aiGeneratedPlan: AIWorkoutPlan;
}> {
  try {
    // Generate the prompt
    const prompt = createWorkoutGenerationPrompt(userProfile);
    
    // Call Claude AI API
    console.log('Generating workout plan with Claude AI...');
    const response = await callClaudeAPI(prompt);
    
    // Parse the response
    const aiPlan = parseAIResponse(response);
    console.log('Successfully parsed AI workout plan:', aiPlan.programName);
    
    // Convert to database structures
    const { program, workouts } = await convertToWorkoutProgram(userProfile.userId, aiPlan);
    
    console.log(`Created program "${program.name}" with ${workouts.length} workouts`);
    
    return {
      program,
      workouts,
      aiGeneratedPlan: aiPlan,
    };

  } catch (error) {
    console.error('AI workout generation failed:', error);
    
    // Use fallback plan
    console.log('Using fallback workout plan...');
    const fallbackPlan = createFallbackWorkoutPlan(userProfile);
    const { program, workouts } = await convertToWorkoutProgram(userProfile.userId, fallbackPlan);
    
    return {
      program,
      workouts,
      aiGeneratedPlan: fallbackPlan,
    };
  }
}

// Utility function to regenerate a specific workout
export async function regenerateWorkout(
  userProfile: UserProfile,
  workoutTitle: string,
  targetMuscles: string[]
): Promise<AIWorkoutPlan['weeks'][0]['workouts'][0] | null> {
  try {
    const specificPrompt = `${generateAIPromptData(userProfile)}

Generate a single workout with the following requirements:
- Title: ${workoutTitle}
- Target muscles: ${targetMuscles.join(', ')}
- Duration: ${userProfile.availability.sessionDuration} minutes
- Equipment: ${userProfile.experience.equipmentAccess?.join(', ')}
- Experience level: ${userProfile.experience.trainingExperience}

Return only a JSON object for a single workout:
{
  "dayNumber": 1,
  "title": "${workoutTitle}",
  "targetMuscles": ${JSON.stringify(targetMuscles)},
  "estimatedTime": ${userProfile.availability.sessionDuration},
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "8-10",
      "restTime": 90,
      "notes": "Form cues",
      "progressionNotes": "Progression tips"
    }
  ]
}`;

    const response = await callClaudeAPI(specificPrompt);
    const content = response.content[0]?.text;
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to regenerate workout:', error);
    return null;
  }
}