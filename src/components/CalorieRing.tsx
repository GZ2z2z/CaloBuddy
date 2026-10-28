import { motion } from 'framer-motion';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
}

export function CalorieRing({ consumed, target, size = 200 }: CalorieRingProps) {
  const remaining = Math.max(0, target - consumed);
  const progress = Math.min(consumed / target, 1);
  const isOver = consumed > target;

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isOver ? 'var(--color-warning)' : 'var(--color-calories)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {isOver ? '已超出' : '剩余可摄入'}
        </span>
        <span
          className={`text-4xl font-bold tracking-tight ${
            isOver ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'
          }`}
        >
          {isOver ? consumed - target : remaining}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">kcal</span>
        <span className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
          已摄入 {consumed} / {target}
        </span>
      </div>
    </div>
  );
}
