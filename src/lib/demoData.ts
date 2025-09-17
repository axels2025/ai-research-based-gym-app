import type { UserProfile } from './userProfiles';
import { Timestamp } from 'firebase/firestore';

export function generateDemoProfile(userId: string): UserProfile {
  return {
    id: userId,
    userId,
    personalInfo: {
      age: 28,
      sex: 'male',
      height: 180,
      weight: 75,
      activityLevel: 'moderately-active',
    },
    experience: {
      trainingExperience: 'intermediate',
      equipmentAccess: ['full-gym'],
      workoutLocation: 'gym',
      yearsTraining: 3,
      previousPrograms: ['Starting Strength', '5/3/1'],
    },
    goals: {
      primaryGoals: ['muscle-gain', 'strength'],
      secondaryGoals: ['flexibility', 'energy'],
      targetTimeline: 6,
      bodyCompositionGoals: {
        targetWeight: 80,
        muscleGainTarget: 'Gain 5kg lean muscle mass',
      },
      specificGoals: 'Want to bench press bodyweight',
    },
    availability: {
      sessionsPerWeek: 4,
      sessionDuration: 75,
      preferredTimes: ['evening'],
      availableDays: ['monday', 'tuesday', 'thursday', 'friday'],
      flexibleSchedule: false,
    },
    health: {
      injuryHistory: [],
      limitations: [],
      medicalConditions: [],
      painAreas: [],
      medications: [],
      allergies: [],
    },
    preferences: {
      favoriteExercises: ['Squats', 'Deadlifts', 'Bench Press'],
      dislikedExercises: ['Burpees'],
      preferredWorkoutSplit: 'upper-lower',
      repRangePreference: 'moderate',
      workoutIntensity: 'moderate',
      restPreference: 'standard',
      musicPreference: 'High-energy rock',
      workoutEnvironment: 'Well-equipped gym',
    },
    motivation: {
      motivationFactors: ['Build confidence', 'Improve health', 'Look better'],
      coachingStyle: 'supportive',
      progressMilestones: ['Bench bodyweight', 'Squat 1.5x bodyweight'],
      challengePreference: 'gradual',
    },
    onboardingCompleted: true,
    completionStep: 7,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

export const sampleAIPrompt = `User Profile for AI Workout Generation:

PERSONAL INFO:
- Age: 28
- Sex: male
- Height: 180cm
- Weight: 75kg
- Activity Level: moderately-active

EXPERIENCE:
- Training Experience: intermediate
- Years Training: 3
- Equipment Access: full-gym
- Workout Location: gym

GOALS:
- Primary Goals: muscle-gain, strength
- Secondary Goals: flexibility, energy
- Target Timeline: 6 months
- Specific Goals: Want to bench press bodyweight

AVAILABILITY:
- Sessions per Week: 4
- Session Duration: 75 minutes
- Preferred Times: evening
- Available Days: monday, tuesday, thursday, friday

HEALTH CONSIDERATIONS:
- Injury History: None
- Limitations: None
- Medical Conditions: None
- Pain Areas: None

PREFERENCES:
- Preferred Workout Split: upper-lower
- Rep Range Preference: moderate
- Workout Intensity: moderate
- Favorite Exercises: Squats, Deadlifts, Bench Press
- Disliked Exercises: Burpees

Please generate a personalized workout program based on this profile.`;

export const expectedAIResponse = `Based on your profile, here's a personalized 6-month Upper/Lower split program designed to help you gain muscle and strength:

## Program Overview
**Schedule**: 4 days/week (Mon, Tue, Thu, Fri)
**Split**: Upper/Lower alternating
**Duration**: 75 minutes per session
**Focus**: Progressive overload for muscle gain and strength

## Week 1-2 (Foundation Phase)
### Upper Body Days (Mon/Thu)
1. Bench Press - 4 sets x 8-10 reps
2. Bent-over Row - 4 sets x 8-10 reps
3. Overhead Press - 3 sets x 10-12 reps
4. Pull-ups/Lat Pulldown - 3 sets x 8-12 reps
5. Dips - 3 sets x 10-15 reps
6. Barbell Curls - 3 sets x 10-12 reps
7. Close-grip Bench Press - 3 sets x 10-12 reps

### Lower Body Days (Tue/Fri)
1. Squats - 4 sets x 8-10 reps
2. Romanian Deadlifts - 4 sets x 8-10 reps
3. Bulgarian Split Squats - 3 sets x 10-12 each leg
4. Hip Thrusts - 3 sets x 12-15 reps
5. Walking Lunges - 3 sets x 12 each leg
6. Calf Raises - 4 sets x 15-20 reps
7. Plank - 3 sets x 45-60 seconds

## Progression Strategy
- Increase weight by 2.5-5kg when you can complete all sets with perfect form
- Focus on compound movements first
- Track your bench press progress toward bodyweight goal
- Include flexibility work at the end of each session

This program avoids burpees and emphasizes your favorite exercises while building toward your bodyweight bench press goal!`;