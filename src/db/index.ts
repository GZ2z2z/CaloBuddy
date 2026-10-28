import Dexie, { type EntityTable } from 'dexie';
import type { UserProfile, FoodItem, DailyLog, MealTemplate } from '@/types';

const db = new Dexie('CaloBuddyDB') as Dexie & {
  profile: EntityTable<UserProfile, 'id'>;
  foods: EntityTable<FoodItem, 'id'>;
  dailyLogs: EntityTable<DailyLog, 'date'>;
  mealTemplates: EntityTable<MealTemplate, 'id'>;
};

db.version(1).stores({
  profile: '++id',
  foods: 'id, name, pinyinIndex, category, source, lastUsedAt, useCount',
  dailyLogs: 'date',
  mealTemplates: 'id, name, usageCount',
});

export { db };
