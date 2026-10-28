import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

export function WaterTracker() {
  const todayLog = useAppStore((s) => s.todayLog);
  const addWater = useAppStore((s) => s.addWater);

  const current = todayLog?.waterMl ?? 0;
  const target = todayLog?.targetWaterMl ?? 2000;
  const progress = Math.min(current / target, 1);

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl p-4 border border-[var(--color-divider)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <span className="text-sm font-semibold">饮水</span>
        </div>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {current} / {target} ml
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[var(--color-divider)] overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full bg-blue-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      {/* Quick add buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => addWater(250)}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          +250ml 🥤
        </button>
        <button
          onClick={() => addWater(500)}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          +500ml 🍶
        </button>
        {current > 0 && (
          <button
            onClick={() => addWater(-250)}
            className="py-1.5 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] transition-colors"
          >
            撤回
          </button>
        )}
      </div>
    </div>
  );
}
