'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FastingSession {
  id: string;
  startTime: string;
  endTime?: string;
  targetHours: number;
  completed: boolean;
}

export interface ExerciseLog {
  id: string;
  date: string;
  type: 'aerobic' | 'resistance' | 'hiit' | 'cold';
  name: string;
  duration: number; // minutes
  intensity: number; // 1-10
  sets?: { reps: number; weight: number }[];
  notes?: string;
}

export interface DailyChecklist {
  date: string;
  items: Record<string, boolean>;
}

export interface UserSettings {
  gender: 'male' | 'female';
  weight: number;
  height: number;
  age: number;
  waist: number;
  hip: number;
}

export interface QuizResult {
  date: string;
  yesCount: number;
  answers: boolean[];
  recommendation: string;
}

interface AppState {
  // Active tab
  activeTab: number;
  setActiveTab: (tab: number) => void;

  // User settings
  userSettings: UserSettings;
  setUserSettings: (settings: Partial<UserSettings>) => void;

  // Quiz
  quizResults: QuizResult[];
  addQuizResult: (result: QuizResult) => void;

  // Fasting
  fastingSessions: FastingSession[];
  activeFasting: FastingSession | null;
  startFasting: (targetHours: number) => void;
  stopFasting: () => void;
  addFastingSession: (session: FastingSession) => void;

  // Exercise
  exerciseLogs: ExerciseLog[];
  addExerciseLog: (log: ExerciseLog) => void;
  removeExerciseLog: (id: string) => void;

  // Daily checklist
  dailyChecklists: DailyChecklist[];
  toggleChecklistItem: (date: string, itemId: string) => void;
  getChecklist: (date: string) => DailyChecklist | undefined;

  // Food bookmarks
  bookmarkedFoods: string[];
  toggleBookmark: (foodId: string) => void;

  // TG/HDL history
  tgHdlHistory: { date: string; tg: number; hdl: number; ratio: number }[];
  addTgHdlResult: (result: { date: string; tg: number; hdl: number; ratio: number }) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Active tab
      activeTab: 0,
      setActiveTab: (tab) => set({ activeTab: tab }),

      // User settings
      userSettings: {
        gender: 'male',
        weight: 80,
        height: 175,
        age: 35,
        waist: 90,
        hip: 100,
      },
      setUserSettings: (settings) =>
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        })),

      // Quiz
      quizResults: [],
      addQuizResult: (result) =>
        set((state) => ({
          quizResults: [...state.quizResults, result],
        })),

      // Fasting
      fastingSessions: [],
      activeFasting: null,
      startFasting: (targetHours) => {
        const session: FastingSession = {
          id: Date.now().toString(),
          startTime: new Date().toISOString(),
          targetHours,
          completed: false,
        };
        set({ activeFasting: session });
      },
      stopFasting: () => {
        const active = get().activeFasting;
        if (active) {
          const completed: FastingSession = {
            ...active,
            endTime: new Date().toISOString(),
            completed: true,
          };
          set((state) => ({
            activeFasting: null,
            fastingSessions: [...state.fastingSessions, completed],
          }));
        }
      },
      addFastingSession: (session) =>
        set((state) => ({
          fastingSessions: [...state.fastingSessions, session],
        })),

      // Exercise
      exerciseLogs: [],
      addExerciseLog: (log) =>
        set((state) => ({
          exerciseLogs: [...state.exerciseLogs, log],
        })),
      removeExerciseLog: (id) =>
        set((state) => ({
          exerciseLogs: state.exerciseLogs.filter((l) => l.id !== id),
        })),

      // Daily checklist
      dailyChecklists: [],
      toggleChecklistItem: (date, itemId) =>
        set((state) => {
          const existing = state.dailyChecklists.find((c) => c.date === date);
          if (existing) {
            return {
              dailyChecklists: state.dailyChecklists.map((c) =>
                c.date === date
                  ? { ...c, items: { ...c.items, [itemId]: !c.items[itemId] } }
                  : c
              ),
            };
          }
          return {
            dailyChecklists: [
              ...state.dailyChecklists,
              { date, items: { [itemId]: true } },
            ],
          };
        }),
      getChecklist: (date) =>
        get().dailyChecklists.find((c) => c.date === date),

      // Food bookmarks
      bookmarkedFoods: [],
      toggleBookmark: (foodId) =>
        set((state) => ({
          bookmarkedFoods: state.bookmarkedFoods.includes(foodId)
            ? state.bookmarkedFoods.filter((id) => id !== foodId)
            : [...state.bookmarkedFoods, foodId],
        })),

      // TG/HDL
      tgHdlHistory: [],
      addTgHdlResult: (result) =>
        set((state) => ({
          tgHdlHistory: [...state.tgHdlHistory, result],
        })),
    }),
    {
      name: 'insulin-resistance-app-storage',
    }
  )
);
