import { motion } from 'framer-motion';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, target, color, unit = 'g' }: MacroBarProps) {
  const progress = Math.min(current / target, 1);
  const isOver = current > target;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-divider)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: isOver ? 'var(--color-warning)' : color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 block">
        {Math.round(current)}/{target}{unit}
      </span>
    </div>
  );
}
