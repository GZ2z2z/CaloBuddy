import { db } from '@/db';

const DB_DATA_VERSION = 'v2.1';

export async function seedFoodDatabase() {
  const currentVersion = localStorage.getItem('calobuddy_food_db_version');
  if (currentVersion === DB_DATA_VERSION) {
    return; // Already up to date
  }

  try {
    const resp = await fetch(import.meta.env.BASE_URL + 'data/foods.json');
    if (!resp.ok) throw new Error('Failed to load food database');
    const foods = await resp.json();
    // bulkPut will insert new items and update existing standard items without touching user custom foods
    await db.foods.bulkPut(foods);
    localStorage.setItem('calobuddy_food_db_version', DB_DATA_VERSION);
    console.log(`✅ Seeded & updated ${foods.length} foods into database (${DB_DATA_VERSION})`);
  } catch (err) {
    console.error('Failed to seed food database:', err);
  }
}
