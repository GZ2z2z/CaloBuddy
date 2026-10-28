import { useState } from 'react';
import type { MealType } from '@/types';
import toast from 'react-hot-toast';

interface FloatingActionBarProps {
  onQuickSearch: () => void;
  onQuickScan: () => void;
  onQuickAi: () => void;
}

export function FloatingActionBar({
  onQuickSearch,
  onQuickScan,
  onQuickAi,
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#D1FAE5]/95 dark:bg-[#064E3B]/95 text-[#065F46] dark:text-[#A7F3D0] backdrop-blur-xl border border-emerald-300/40 dark:border-emerald-700/50 shadow-xl shadow-emerald-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
        {/* AI 算热量 */}
        <button
          onClick={onQuickAi}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 transition-colors"
        >
          <span className="w-4 h-4 rounded-full bg-[#065F46] text-[#A7F3D0] dark:bg-[#A7F3D0] dark:text-[#065F46] flex items-center justify-center text-[9px] font-black">
            AI
          </span>
          <span>算热量</span>
        </button>

        <span className="w-px h-3.5 bg-emerald-400/40 dark:bg-emerald-600/50" />

        {/* 文字记账 */}
        <button
          onClick={onQuickSearch}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 transition-colors"
        >
          <span>✏️</span>
          <span>文字</span>
        </button>

        <span className="w-px h-3.5 bg-emerald-400/40 dark:bg-emerald-600/50" />

        {/* 拍照识表 */}
        <button
          onClick={onQuickScan}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 transition-colors"
        >
          <span>📷</span>
          <span>拍照</span>
        </button>
      </div>
    </div>
  );
}

// AI Quick Input Dialog
interface AiQuickDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParsedFood: (mealType: MealType, text: string) => Promise<void>;
}

export function AiQuickDialog({ isOpen, onClose, onAddParsedFood }: AiQuickDialogProps) {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('请输入饮食描述');
      return;
    }
    setLoading(true);
    try {
      await onAddParsedFood(mealType, text);
      setText('');
      onClose();
    } catch {
      toast.error('解析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 max-w-sm w-full border border-[var(--color-divider)] shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🤖</span>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              AI 智能算热量
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          用自然语言描述你吃的食物，智能自动识别食物种类并推算热量与营养素：
        </p>

        {/* Meal Selector */}
        <div className="flex gap-1.5 mb-3">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((m) => {
            const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snacks: '加餐' };
            return (
              <button
                key={m}
                onClick={() => setMealType(m)}
                className={`flex-1 py-1 text-xs rounded-xl font-medium transition-all ${
                  mealType === m
                    ? 'bg-[var(--color-calories)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：中午吃了一碗白米饭、一块150克香煎鸡胸肉和一份水煮西兰花"
          className="w-full p-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-calories)]"
        />

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            '2个水煮蛋 + 1盒脱脂牛奶',
            '1碗米饭 + 200克牛肉',
            '1个苹果 + 1勺乳清蛋白粉',
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => setText(sample)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              {sample}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[var(--color-calories)] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          {loading ? '正在智能解析中...' : '✨ 智能推算并入账'}
        </button>
      </div>
    </div>
  );
}
