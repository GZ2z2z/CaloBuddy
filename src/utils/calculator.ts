import type { ActivityLevel, DeficitMode } from '@/types';
import { ACTIVITY_LEVELS, DEFICIT_MODES } from '@/types';

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(
  gender: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/**
 * Calculate TDEE from BMR and activity level
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const level = ACTIVITY_LEVELS.find((l) => l.value === activityLevel);
  return Math.round(bmr * (level?.factor ?? 1.2));
}

/**
 * Calculate target daily calories from TDEE and deficit mode
 */
export function calculateTargetCalories(tdee: number, deficitMode: DeficitMode): number {
  const mode = DEFICIT_MODES.find((m) => m.value === deficitMode);
  return Math.max(1200, Math.round(tdee - (mode?.deficit ?? 500)));
}

/**
 * Calculate macronutrient targets for fat loss
 * Protein: ~30% (min 1.6g/kg), Fat: ~25%, Carbs: remainder
 */
export function calculateMacros(
  targetCalories: number,
  weightKg: number,
): { protein: number; fat: number; carbs: number } {
  // Protein: 2g per kg body weight (prioritize muscle retention)
  const proteinGrams = Math.round(Math.min(weightKg * 2, (targetCalories * 0.35) / 4));
  // Fat: 25% of calories (min 0.8g/kg)
  const fatGrams = Math.round(Math.max(weightKg * 0.8, (targetCalories * 0.25) / 9));
  // Carbs: remaining calories
  const remainingCal = targetCalories - proteinGrams * 4 - fatGrams * 9;
  const carbsGrams = Math.round(Math.max(0, remainingCal / 4));

  return { protein: proteinGrams, fat: fatGrams, carbs: carbsGrams };
}

/**
 * Calculate nutrition values for a given food portion
 */
export function calculatePortion(
  per100g: { calories: number; protein: number; fat: number; carbs: number },
  grams: number,
): { calories: number; protein: number; fat: number; carbs: number } {
  const ratio = grams / 100;
  return {
    calories: Math.round(per100g.calories * ratio),
    protein: Math.round(per100g.protein * ratio * 10) / 10,
    fat: Math.round(per100g.fat * ratio * 10) / 10,
    carbs: Math.round(per100g.carbs * ratio * 10) / 10,
  };
}

/**
 * Get current age from birth year
 */
export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}
