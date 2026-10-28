import { db } from '@/db';

let seeded = false;

export async function seedFoodDatabase() {
  if (seeded) return;
  seeded = true;

  const count = await db.foods.count();
  if (count > 0) return; // Already seeded

  try {
    const resp = await fetch(import.meta.env.BASE_URL + 'data/foods.json');
    if (!resp.ok) throw new Error('Failed to load food database');
    const foods = await resp.json();
    await db.foods.bulkAdd(foods);
    console.log(`✅ Seeded ${foods.length} foods into database`);
  } catch (err) {
    console.error('Failed to seed food database:', err);
  }
}
