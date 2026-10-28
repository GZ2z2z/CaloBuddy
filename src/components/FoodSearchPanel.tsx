import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MealType, FoodItem } from '@/types';
import { CATEGORY_META, MEAL_META } from '@/types';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useAppStore } from '@/stores/appStore';
import { calculatePortion } from '@/utils/calculator';
import { db } from '@/db';
import toast from 'react-hot-toast';

interface FoodSearchPanelProps {
  mealType: MealType;
  onClose: () => void;
}

export function FoodSearchPanel({ mealType, onClose }: FoodSearchPanelProps) {
  const { search, results, recentFoods, query } = useFoodSearch();
  const addMealEntry = useAppStore((s) => s.addMealEntry);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = MEAL_META[mealType];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAddFood = async (food: FoodItem, portionGrams: number) => {
    const nutrition = calculatePortion(food.per100g, portionGrams);
    const catMeta = CATEGORY_META[food.category];
    await addMealEntry(mealType, {
      foodId: food.id,
      name: food.name,
      emoji: catMeta.emoji,
      grams: portionGrams,
      ...nutrition,
    });

    // Update food usage stats
    await db.foods.update(food.id, {
      lastUsedAt: Date.now(),
      useCount: (food.useCount ?? 0) + 1,
    });

    toast.success(`已添加 ${food.name}`);
    setSelectedFood(null);
    onClose();
  };

  const displayFoods = query.trim() ? results : recentFoods;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-primary)] rounded-t-3xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span>{meta.emoji}</span>
            <span className="font-semibold">添加到{meta.label}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-secondary)]">
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索食物 (支持中文/拼音)..."
              value={query}
              onChange={(e) => search(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </div>

        {/* Food detail panel */}
        {selectedFood ? (
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{CATEGORY_META[selectedFood.category].emoji}</span>
                <div>
                  <div className="font-semibold">{selectedFood.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {selectedFood.source === 'USDA' ? 'USDA' : '中国食物成分表'} · 每100g: {selectedFood.per100g.calories}kcal
                  </div>
                </div>
              </div>

              {/* Serving options */}
              {selectedFood.commonServings && selectedFood.commonServings.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedFood.commonServings.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setGrams(s.grams)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        grams === s.grams
                          ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)]'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                      }`}
                    >
                      {s.label} ({s.grams}g)
                    </button>
                  ))}
                  <button
                    onClick={() => setGrams(100)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      grams === 100 && !selectedFood.commonServings?.some((s) => s.grams === 100)
                        ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)]'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                    }`}
                  >
                    100g
                  </button>
                </div>
              )}

              {/* Gram input */}
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))}
                  className="flex-1 py-2 px-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-lg font-bold text-center text-[var(--color-text-primary)]"
                  min={1}
                />
                <span className="text-sm text-[var(--color-text-secondary)]">克</span>
              </div>

              {/* Nutrition preview */}
              {(() => {
                const n = calculatePortion(selectedFood.per100g, grams);
                return (
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    <div className="text-center p-2 bg-[var(--color-bg-secondary)] rounded-xl">
                      <div className="text-xs text-[var(--color-text-secondary)]">热量</div>
                      <div className="font-bold text-[var(--color-calories)]">{n.calories}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">kcal</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--color-bg-secondary)] rounded-xl">
                      <div className="text-xs text-[var(--color-text-secondary)]">蛋白质</div>
                      <div className="font-bold text-[var(--color-protein)]">{n.protein}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">g</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--color-bg-secondary)] rounded-xl">
                      <div className="text-xs text-[var(--color-text-secondary)]">碳水</div>
                      <div className="font-bold text-[var(--color-carbs)]">{n.carbs}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">g</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--color-bg-secondary)] rounded-xl">
                      <div className="text-xs text-[var(--color-text-secondary)]">脂肪</div>
                      <div className="font-bold text-[var(--color-fat)]">{n.fat}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">g</div>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => handleAddFood(selectedFood, grams)}
                className="w-full py-3 rounded-2xl bg-[var(--color-calories)] text-white font-semibold"
              >
                ✅ 添加到{meta.label}
              </button>
            </div>
          </div>
        ) : (
          /* Food list */
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {!query.trim() && recentFoods.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">⏱ 最近使用</div>
              </div>
            )}
            {displayFoods.length === 0 && query.trim() && (
              <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm">
                未找到「{query}」相关食物
              </div>
            )}
            <div className="space-y-1">
              {displayFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => {
                    setSelectedFood(food);
                    setGrams(food.commonServings?.[0]?.grams ?? 100);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
                >
                  <span className="text-xl">{CATEGORY_META[food.category].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{food.name}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {food.source === 'USDA' ? 'USDA' : '中国食物成分表'} · {food.per100g.calories}kcal/100g
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      蛋白质{food.per100g.protein}g · 碳水{food.per100g.carbs}g · 脂肪{food.per100g.fat}g
                    </div>
                  </div>
                  <span className="text-[var(--color-text-tertiary)]">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
