import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface WorkoutProgram {
  id: string;
  userId: string;
  name: string;
  currentWeek: number;
  totalWeeks: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Workout {
  id: string;
  userId: string;
  programId: string;
  title: string;
  week: number;
  day: number;
  exercises: number;
  estimatedTime: number;
  isCompleted: boolean;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Exercise {
  id: string;
  workoutId: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restTime: number;
  notes?: string;
  isCompleted: boolean;
  completedAt?: Timestamp;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
}

// Workout Programs
export async function createWorkoutProgram(userId: string, programData: Omit<WorkoutProgram, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const programRef = doc(collection(db, 'programs'));
  const program: WorkoutProgram = {
    id: programRef.id,
    userId,
    ...programData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await setDoc(programRef, program);
  return program;
}

export async function getUserPrograms(userId: string): Promise<WorkoutProgram[]> {
  const q = query(
    collection(db, 'programs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as WorkoutProgram);
}

export async function updateWorkoutProgram(programId: string, updates: Partial<WorkoutProgram>) {
  const programRef = doc(db, 'programs', programId);
  await updateDoc(programRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Workouts
export async function createWorkout(userId: string, workoutData: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const workoutRef = doc(collection(db, 'workouts'));
  const workout: Workout = {
    id: workoutRef.id,
    userId,
    ...workoutData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await setDoc(workoutRef, workout);
  return workout;
}

export async function getUserWorkouts(userId: string, programId?: string): Promise<Workout[]> {
  let q = query(
    collection(db, 'workouts'),
    where('userId', '==', userId),
    orderBy('week', 'asc'),
    orderBy('day', 'asc')
  );
  
  if (programId) {
    q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      where('programId', '==', programId),
      orderBy('week', 'asc'),
      orderBy('day', 'asc')
    );
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Workout);
}

export async function getWorkoutById(workoutId: string): Promise<Workout | null> {
  const workoutRef = doc(db, 'workouts', workoutId);
  const workoutDoc = await getDoc(workoutRef);
  
  if (workoutDoc.exists()) {
    return workoutDoc.data() as Workout;
  }
  
  return null;
}

export async function updateWorkout(workoutId: string, updates: Partial<Workout>) {
  const workoutRef = doc(db, 'workouts', workoutId);
  await updateDoc(workoutRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function completeWorkout(workoutId: string) {
  await updateWorkout(workoutId, {
    isCompleted: true,
    completedAt: Timestamp.now(),
  });
}

// Workout Sessions
export async function createWorkoutSession(userId: string, sessionData: Omit<WorkoutSession, 'id' | 'userId'>) {
  const sessionRef = doc(collection(db, 'workoutSessions'));
  const session: WorkoutSession = {
    id: sessionRef.id,
    userId,
    ...sessionData,
  };
  
  await setDoc(sessionRef, session);
  return session;
}

export async function updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSession>) {
  const sessionRef = doc(db, 'workoutSessions', sessionId);
  await updateDoc(sessionRef, updates);
}

export async function getUserWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  const q = query(
    collection(db, 'workoutSessions'),
    where('userId', '==', userId),
    orderBy('startedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as WorkoutSession);
}

// Initialize default program for new users
export async function initializeDefaultProgram(userId: string) {
  // Create default program
  const program = await createWorkoutProgram(userId, {
    name: "Strength & Hypertrophy Program",
    currentWeek: 1,
    totalWeeks: 6,
    workoutsCompleted: 0,
    totalWorkouts: 18,
  });

  // Create default workouts
  const defaultWorkouts = [
    {
      programId: program.id,
      title: "Push Day - Upper Body",
      week: 1,
      day: 1,
      exercises: 6,
      estimatedTime: 75,
      isCompleted: false,
    },
    {
      programId: program.id,
      title: "Pull Day - Back & Biceps",
      week: 1,
      day: 2,
      exercises: 5,
      estimatedTime: 65,
      isCompleted: false,
    },
    {
      programId: program.id,
      title: "Legs & Core",
      week: 1,
      day: 3,
      exercises: 7,
      estimatedTime: 85,
      isCompleted: false,
    },
  ];

  const workouts = await Promise.all(
    defaultWorkouts.map(workout => createWorkout(userId, workout))
  );

  return { program, workouts };
}