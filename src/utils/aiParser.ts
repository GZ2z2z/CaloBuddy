import type { MealEntry } from '@/types';
import { db } from '@/db';
import { nanoid } from 'nanoid';

/**
 * Lightweight local text parser to extract food items and grams from natural language
 */
export async function parseFoodText(text: string): Promise<MealEntry[]> {
  const foods = await db.foods.toArray();
  const entries: MealEntry[] = [];

  // Match known food names
  for (const food of foods) {
    if (text.includes(food.name)) {
      // Look for quantities before or after the food name
      // e.g., "200克牛肉", "牛肉200g", "2个鸡蛋", "1碗米饭", "1盒牛奶"
      let grams = 100;

      // Check for grams/g pattern
      const gramMatch = text.match(new RegExp(`(\\d+)\\s*(?:克|g|G)\\s*${food.name}|${food.name}\\s*(\\d+)\\s*(?:克|g|G)`));
      if (gramMatch) {
        const val = parseInt(gramMatch[1] || gramMatch[2] || '100');
        if (val > 0) grams = val;
      } else {
        // Check for common serving counters
        // e.g. "2个", "1碗", "1根", "1盒", "1片", "1块", "1勺"
        const countMatch = text.match(new RegExp(`(\\d+)\\s*(?:个|碗|根|盒|片|块|勺|杯)\\s*${food.name}|${food.name}\\s*(\\d+)\\s*(?:个|碗|根|盒|片|块|勺|杯)`));
        if (countMatch && food.commonServings && food.commonServings.length > 0) {
          const count = parseInt(countMatch[1] || countMatch[2] || '1');
          grams = (food.commonServings[0]?.grams ?? 100) * count;
        } else if (food.commonServings && food.commonServings.length > 0) {
          grams = food.commonServings[0]?.grams ?? 100;
        }
      }

      const ratio = grams / 100;
      entries.push({
        entryId: nanoid(),
        foodId: food.id,
        name: food.name,
        grams,
        calories: Math.round(food.per100g.calories * ratio),
        protein: Math.round(food.per100g.protein * ratio * 10) / 10,
        fat: Math.round(food.per100g.fat * ratio * 10) / 10,
        carbs: Math.round(food.per100g.carbs * ratio * 10) / 10,
        timestamp: Date.now(),
      });
    }
  }

  // Fallback if no specific food matched: create a generic entry
  if (entries.length === 0) {
    // Check if calories were mentioned directly, e.g. "300千卡"
    const calMatch = text.match(/(\d+)\s*(?:千卡|kcal|大卡)/i);
    const calories = calMatch ? parseInt(calMatch[1] ?? '250') : 250;

    entries.push({
      entryId: nanoid(),
      foodId: 'custom_' + nanoid(),
      name: text.slice(0, 15),
      grams: 100,
      calories,
      protein: Math.round((calories * 0.25) / 4),
      fat: Math.round((calories * 0.25) / 9),
      carbs: Math.round((calories * 0.5) / 4),
      timestamp: Date.now(),
    });
  }

  return entries;
}
