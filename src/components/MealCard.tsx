import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MealEntry, MealType } from '@/types';
import { MEAL_META } from '@/types';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface MealCardProps {
  mealType: MealType;
  entries: MealEntry[];
  targetCalories: number;
  onAddClick: () => void;
}

// Target calorie range recommendation based on meal type
function getMealRange(mealType: MealType, targetCalories: number): string {
  switch (mealType) {
    case 'breakfast': {
      const min = Math.round(targetCalories * 0.25);
      const max = Math.round(targetCalories * 0.35);
      return `建议 ${min} - ${max} 千卡`;
    }
    case 'lunch': {
      const min = Math.round(targetCalories * 0.35);
      const max = Math.round(targetCalories * 0.45);
      return `建议 ${min} - ${max} 千卡`;
    }
    case 'dinner': {
      const min = Math.round(targetCalories * 0.25);
      const max = Math.round(targetCalories * 0.35);
      return `建议 ${min} - ${max} 千卡`;
    }
    case 'snacks': {
      const max = Math.round(targetCalories * 0.1);
      return `建议 0 - ${max} 千卡`;
    }
  }
}

// Food emoji badge background tints
const EMOJI_TINTS = [
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
  'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300',
];

export function MealCard({ mealType, entries, targetCalories, onAddClick }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);
  const [editGrams, setEditGrams] = useState('');
  const removeMealEntry = useAppStore((s) => s.removeMealEntry);
  const addMealEntry = useAppStore((s) => s.addMealEntry);

  const meta = MEAL_META[mealType];
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const rangeText = getMealRange(mealType, targetCalories);

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    const newGrams = parseFloat(editGrams);
    if (!newGrams || newGrams <= 0) {
      toast.error('请输入有效克数');
      return;
    }
    // calculate new ratios
    const ratio = newGrams / editingEntry.grams;
    await removeMealEntry(mealType, editingEntry.entryId);
    await addMealEntry(mealType, {
      foodId: editingEntry.foodId,
      name: editingEntry.name,
      emoji: editingEntry.emoji,
      grams: newGrams,
      calories: Math.round(editingEntry.calories * ratio),
      protein: Math.round(editingEntry.protein * ratio * 10) / 10,
      fat: Math.round(editingEntry.fat * ratio * 10) / 10,
      carbs: Math.round(editingEntry.carbs * ratio * 10) / 10,
    });
    setEditingEntry(null);
    toast.success('已更新份量');
  };

  return (
    <div className="bg-[var(--color-bg-card)] rounded-3xl p-4 border border-[var(--color-divider)] shadow-sm transition-all mb-3">
      {/* Header matching Thin Mint screenshot */}
      <div
        onClick={() => (entries.length > 0 ? setIsExpanded(!isExpanded) : onAddClick())}
        className="flex items-center justify-between cursor-pointer py-1"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-[17px] text-[var(--color-text-primary)]">
            {meta.label}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)] font-normal">
            {rangeText}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-semibold transition-colors ${
              entries.length > 0
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {totalCalories} 千卡
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">›</span>
        </div>
      </div>

      {/* Entries List */}
      <AnimatePresence initial={false}>
        {isExpanded && entries.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 divide-y divide-[var(--color-divider)]">
              {entries.map((entry, idx) => {
                const tint = EMOJI_TINTS[idx % EMOJI_TINTS.length];
                return (
                  <div
                    key={entry.entryId}
                    onClick={() => {
                      setEditingEntry(entry);
                      setEditGrams(String(entry.grams));
                    }}
                    className="flex items-center justify-between py-3 cursor-pointer group active:bg-[var(--color-bg-secondary)]/50 rounded-2xl px-1 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rounded Thumbnail Badge */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs ${tint}`}
                      >
                        {entry.emoji ?? '🥗'}
                      </div>

                      {/* Food Name & Grams */}
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
                          {entry.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {entry.grams} 克
                        </div>
                      </div>
                    </div>

                    {/* Calories & Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[15px] text-[var(--color-text-secondary)] font-medium">
                        {entry.calories} 千卡
                      </span>
                      <span className="text-xs text-[var(--color-text-tertiary)]">›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Button if empty or at bottom */}
      <div className="pt-2 mt-1 border-t border-[var(--color-divider)]/50 flex items-center justify-center">
        <button
          onClick={onAddClick}
          className="w-full py-1.5 text-xs text-[var(--color-calories)] font-semibold hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          <span>+</span>
          <span>添加{meta.label}食物</span>
        </button>
      </div>

      {/* Food Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 max-w-xs w-full border border-[var(--color-divider)] shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingEntry.emoji ?? '🥗'}</span>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {editingEntry.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">修改食用克数</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                value={editGrams}
                onChange={(e) => setEditGrams(e.target.value)}
                className="flex-1 py-2 px-3 text-lg font-bold rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-center"
                min={1}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">克</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-[var(--color-calories)] text-white text-sm font-semibold"
              >
                保存修改
              </button>
              <button
                onClick={() => {
                  removeMealEntry(mealType, editingEntry.entryId);
                  setEditingEntry(null);
                  toast.success('已删除');
                }}
                className="py-2 px-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-xs font-semibold"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
