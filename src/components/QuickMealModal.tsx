import { useState } from 'react';
import type { MealType } from '@/types';
import { MEAL_META } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

interface QuickMealModalProps {
  isOpen: boolean;
  initialMealType?: MealType;
  onClose: () => void;
}

export function QuickMealModal({ isOpen, initialMealType = 'lunch', onClose }: QuickMealModalProps) {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addMealEntry = useAppStore((s) => s.addMealEntry);

  if (!isOpen) return null;

  // Auto-estimate macros based on calorie input (30% Protein, 45% Carbs, 25% Fat)
  const handleAutoEstimate = () => {
    const cal = parseInt(calories);
    if (!cal || cal <= 0) {
      toast.error('请先输入总热量 (kcal)');
      return;
    }
    const pGrams = Math.round((cal * 0.30) / 4);
    const cGrams = Math.round((cal * 0.45) / 4);
    const fGrams = Math.round((cal * 0.25) / 9);

    setProtein(String(pGrams));
    setCarbs(String(cGrams));
    setFat(String(fGrams));
    toast.success('已按减脂标准比例自动估算三大营养素');
  };

  const handleSave = async () => {
    const cal = parseInt(calories);
    if (!cal || cal < 0) {
      toast.error('请输入有效的大卡热量');
      return;
    }

    const defaultName = `${MEAL_META[mealType].label}快速记账`;
    const finalName = mealName.trim() || defaultName;
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;

    await addMealEntry(mealType, {
      foodId: 'quick_' + nanoid(),
      name: finalName,
      emoji: '⚡',
      grams: 1, // unit portion
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
    });

    toast.success(`⚡ 已直接入账到${MEAL_META[mealType].label}！`);
    // Reset and close
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setSodium('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 max-w-sm w-full border border-[var(--color-divider)] shadow-2xl text-[var(--color-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)] mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-bold text-base">直接输入大卡与三大营养素</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-secondary)] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Meal Selector Tabs */}
        <div className="flex gap-1.5 mb-3 bg-[var(--color-bg-secondary)] p-1 rounded-2xl">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((m) => {
            const meta = MEAL_META[m];
            const isActive = mealType === m;
            return (
              <button
                key={m}
                onClick={() => setMealType(m)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-xs'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>

        {/* Meal Name Input */}
        <div className="mb-3">
          <label className="text-[11px] text-[var(--color-text-secondary)] font-medium block mb-1">
            餐食描述 / 名称 (可选)
          </label>
          <input
            type="text"
            placeholder="例如: 聚餐火锅 / 外卖轻食 / 自定义配餐"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/30"
          />
        </div>

        {/* Primary Calories Input - Fixed overflow issue */}
        <div className="mb-3 bg-[var(--color-bg-secondary)]/60 p-3 rounded-2xl border border-[var(--color-divider)]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[var(--color-calories)]">
              摄入总能量 (必填)
            </label>
            <button
              type="button"
              onClick={handleAutoEstimate}
              className="text-[11px] font-semibold text-[var(--color-calories)] hover:underline flex items-center gap-1"
            >
              <span>✨ 按热量估算三大项</span>
            </button>
          </div>
          <div className="relative flex items-center w-full">
            <input
              type="number"
              inputMode="numeric"
              placeholder="如 650"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full py-2.5 pl-3 pr-24 text-2xl font-black text-[var(--color-calories)] rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/30 box-border"
            />
            <div className="absolute right-3 flex items-center pointer-events-none text-xs font-bold text-[var(--color-text-secondary)]">
              <span>千卡 (kcal)</span>
            </div>
          </div>
          {calories && Number(calories) > 0 && (
            <div className="text-right text-[11px] text-[var(--color-text-secondary)] mt-1 font-medium">
              ≈ {Math.round(Number(calories) * 4.184)} kJ (千焦)
            </div>
          )}
        </div>

        {/* 3 Macronutrients */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-[10px] text-[var(--color-text-secondary)] font-medium block mb-1 text-center">
              蛋白质 (g)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="35"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full py-1.5 px-2 text-center text-sm font-bold text-[#FB7185] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] focus:outline-none focus:ring-1 focus:ring-[#FB7185]/40"
            />
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-text-secondary)] font-medium block mb-1 text-center">
              碳水化合物 (g)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="70"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="w-full py-1.5 px-2 text-center text-sm font-bold text-[#10B981] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] focus:outline-none focus:ring-1 focus:ring-[#10B981]/40"
            />
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-text-secondary)] font-medium block mb-1 text-center">
              脂肪 (g)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="15"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="w-full py-1.5 px-2 text-center text-sm font-bold text-[#FBBF24] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] focus:outline-none focus:ring-1 focus:ring-[#FBBF24]/40"
            />
          </div>
        </div>

        {/* Advanced details toggle */}
        <div className="mb-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
          >
            <span>{showAdvanced ? '▾ 收起更多数据' : '▸ 填写膳食纤维与钠 (可选)'}</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--color-divider)]">
              <div>
                <label className="text-[10px] text-[var(--color-text-secondary)] block mb-1">
                  膳食纤维 (g)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="如 5"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--color-text-secondary)] block mb-1">
                  钠含量 (mg)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="如 400"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-[var(--color-calories)] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1"
        >
          <span>⚡</span>
          <span>立即入账到{MEAL_META[mealType].label}</span>
        </button>
      </div>
    </div>
  );
}
