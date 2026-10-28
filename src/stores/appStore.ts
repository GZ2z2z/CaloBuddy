import { create } from 'zustand';
import type { UserProfile, DailyLog, MealType, MealEntry, ThemeMode } from '@/types';
import { db } from '@/db';
import { formatDateKey } from '@/utils/date';
import { nanoid } from 'nanoid';

interface AppState {
  // User profile
  profile: UserProfile | null;
  isOnboarded: boolean;
  
  // Current view
  selectedDate: string; // YYYY-MM-DD
  currentTab: 'today' | 'trends' | 'scan' | 'settings';
  
  // Daily log
  todayLog: DailyLog | null;
  
  // Theme
  theme: ThemeMode;

  // Actions
  setProfile: (profile: UserProfile) => Promise<void>;
  loadProfile: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setCurrentTab: (tab: AppState['currentTab']) => void;
  loadDailyLog: (date?: string) => Promise<void>;
  addMealEntry: (mealType: MealType, entry: Omit<MealEntry, 'entryId' | 'timestamp'>) => Promise<void>;
  removeMealEntry: (mealType: MealType, entryId: string) => Promise<void>;
  updateWeight: (weight: number) => Promise<void>;
  updateExerciseCalories: (cals: number) => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
}

function createEmptyLog(date: string, targetCalories: number): DailyLog {
  return {
    date,
    targetCalories,
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    waterMl: 0,
    targetWaterMl: 2000,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  isOnboarded: false,
  selectedDate: formatDateKey(),
  currentTab: 'today',
  todayLog: null,
  theme: 'system',

  setProfile: async (profile) => {
    profile.updatedAt = Date.now();
    if (profile.id) {
      await db.profile.update(profile.id, profile);
    } else {
      profile.createdAt = Date.now();
      const id = await db.profile.add(profile);
      profile.id = id;
    }
    set({ profile, isOnboarded: true });
  },

  loadProfile: async () => {
    const profiles = await db.profile.toArray();
    const profile = profiles[0] ?? null;
    set({
      profile,
      isOnboarded: !!profile,
      theme: profile?.theme ?? 'system',
    });
    if (profile) {
      await get().loadDailyLog();
    }
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().loadDailyLog(date);
  },

  setCurrentTab: (tab) => set({ currentTab: tab }),

  loadDailyLog: async (date?: string) => {
    const targetDate = date ?? get().selectedDate;
    let log = await db.dailyLogs.get(targetDate);
    if (!log) {
      const profile = get().profile;
      log = createEmptyLog(targetDate, profile?.targetCalories ?? 1800);
    }
    set({ todayLog: log });
  },

  addMealEntry: async (mealType, entry) => {
    const log = get().todayLog;
    if (!log) return;

    const newEntry: MealEntry = {
      ...entry,
      entryId: nanoid(),
      timestamp: Date.now(),
    };

    const updatedLog = {
      ...log,
      meals: {
        ...log.meals,
        [mealType]: [...log.meals[mealType], newEntry],
      },
    };

    await db.dailyLogs.put(updatedLog);
    set({ todayLog: updatedLog });
  },

  removeMealEntry: async (mealType, entryId) => {
    const log = get().todayLog;
    if (!log) return;

    const updatedLog = {
      ...log,
      meals: {
        ...log.meals,
        [mealType]: log.meals[mealType].filter((e) => e.entryId !== entryId),
      },
    };

    await db.dailyLogs.put(updatedLog);
    set({ todayLog: updatedLog });
  },

  updateWeight: async (weight) => {
    const log = get().todayLog;
    if (!log) return;
    const updatedLog = { ...log, weight };
    await db.dailyLogs.put(updatedLog);
    set({ todayLog: updatedLog });
  },

  updateExerciseCalories: async (exerciseCalories) => {
    const log = get().todayLog;
    if (!log) return;
    const updatedLog = { ...log, exerciseCalories };
    await db.dailyLogs.put(updatedLog);
    set({ todayLog: updatedLog });
  },

  addWater: async (ml) => {
    const log = get().todayLog;
    if (!log) return;
    const updatedLog = { ...log, waterMl: Math.max(0, log.waterMl + ml) };
    await db.dailyLogs.put(updatedLog);
    set({ todayLog: updatedLog });
  },

  setTheme: (theme) => {
    set({ theme });
    const profile = get().profile;
    if (profile?.id) {
      db.profile.update(profile.id, { theme, updatedAt: Date.now() });
    }
  },
}));
