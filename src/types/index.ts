// ─── Food Categories ───
export type FoodCategory =
  | 'staple' | 'meat' | 'seafood' | 'egg' | 'dairy'
  | 'soy' | 'vegetable' | 'fruit' | 'nut' | 'oil'
  | 'snack' | 'custom';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type DeficitMode = 'mild' | 'standard' | 'aggressive';

export type ThemeMode = 'system' | 'light' | 'dark';

// ─── Nutrition Data ───
export interface NutritionPer100g {
  calories: number;  // kcal
  protein: number;   // g
  fat: number;       // g
  carbs: number;     // g
  fiber?: number;    // g
  sodium?: number;   // mg
  sugar?: number;    // g
}

export interface ServingOption {
  label: string;     // e.g. "1碗" "1个" "1块"
  grams: number;
}

// ─── Food Item ───
export interface FoodItem {
  id: string;
  name: string;
  nameEn?: string;
  pinyinIndex: string;
  category: FoodCategory;
  source: 'USDA' | 'CDC_CHINA' | 'USER_CUSTOM' | 'OCR_SCANNED';
  per100g: NutritionPer100g;
  commonServings?: ServingOption[];
  isFavorite?: boolean;
  lastUsedAt?: number;
  useCount?: number;
}

// ─── Meal Entry ───
export interface MealEntry {
  entryId: string;
  foodId: string;
  name: string;
  emoji?: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  timestamp: number;
}

// ─── Daily Log ───
export interface DailyLog {
  date: string; // YYYY-MM-DD (primary key)
  weight?: number;
  bodyFatPct?: number;
  exerciseCalories?: number;
  targetCalories: number;
  note?: string;
  meals: {
    breakfast: MealEntry[];
    lunch: MealEntry[];
    dinner: MealEntry[];
    snacks: MealEntry[];
  };
  waterMl: number;
  targetWaterMl: number;
}

// ─── User Profile ───
export interface UserProfile {
  id?: number;
  gender: 'male' | 'female';
  birthYear: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  deficitMode: DeficitMode;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  geminiApiKey?: string;
  githubSyncToken?: string;
  gistId?: string;
  lastSyncAt?: number;
  theme: ThemeMode;
  targetWaterMl: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Meal Template ───
export interface MealTemplate {
  id: string;
  name: string;
  items: { foodId: string; name: string; defaultGrams: number }[];
  totalCalories: number;
  createdAt: number;
  usageCount: number;
}

// ─── Category Meta ───
export const CATEGORY_META: Record<FoodCategory, { emoji: string; label: string }> = {
  staple: { emoji: '🍚', label: '主食谷薯' },
  meat: { emoji: '🥩', label: '畜禽肉类' },
  seafood: { emoji: '🐟', label: '鱼虾水产' },
  egg: { emoji: '🥚', label: '蛋类' },
  dairy: { emoji: '🥛', label: '乳制品' },
  soy: { emoji: '🫘', label: '豆类豆制品' },
  vegetable: { emoji: '🥬', label: '蔬菜' },
  fruit: { emoji: '🍎', label: '水果' },
  nut: { emoji: '🥜', label: '坚果种子' },
  oil: { emoji: '🫒', label: '油脂调味' },
  snack: { emoji: '🍫', label: '零食饮品' },
  custom: { emoji: '⭐', label: '自定义' },
};

export const MEAL_META: Record<MealType, { emoji: string; label: string }> = {
  breakfast: { emoji: '🌅', label: '早餐' },
  lunch: { emoji: '🌞', label: '午餐' },
  dinner: { emoji: '🌆', label: '晚餐' },
  snacks: { emoji: '🌙', label: '加餐' },
};

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; factor: number; desc: string }[] = [
  { value: 'sedentary', label: '久坐不动', factor: 1.2, desc: '办公室久坐，几乎不运动' },
  { value: 'light', label: '轻度活动', factor: 1.375, desc: '每周运动 1–3 天' },
  { value: 'moderate', label: '中度活动', factor: 1.55, desc: '每周运动 3–5 天' },
  { value: 'active', label: '高强度', factor: 1.725, desc: '每周运动 6–7 天' },
  { value: 'very_active', label: '专业运动', factor: 1.9, desc: '每天高强度训练或体力劳动' },
];

export const DEFICIT_MODES: { value: DeficitMode; label: string; emoji: string; deficit: number; desc: string }[] = [
  { value: 'mild', label: '温和减脂', emoji: '🐢', deficit: 300, desc: '≈ 0.3 kg/周' },
  { value: 'standard', label: '标准减脂', emoji: '🏃', deficit: 500, desc: '≈ 0.5 kg/周' },
  { value: 'aggressive', label: '快速减脂', emoji: '🔥', deficit: 750, desc: '≈ 0.7 kg/周' },
];
