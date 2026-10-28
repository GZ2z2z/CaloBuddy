import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalorieCardProps {
  consumed: number;
  target: number;
  exercise?: number;
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
  onUpdateExercise?: (cals: number) => void;
}

export function CalorieCard({
  consumed,
  target,
  exercise = 0,
  protein,
  carbs,
  fat,
  onUpdateExercise,
}: CalorieCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseInput, setExerciseInput] = useState(String(exercise || ''));
  const [showAdviceModal, setShowAdviceModal] = useState(false);

  // Mifflin/deficit calculation
  // Remaining to eat = target - consumed + exercise (or target - consumed)
  const remaining = Math.max(0, target - consumed + exercise);
  const isOver = consumed > target + exercise;
  const overAmount = consumed - (target + exercise);

  // Ring circular calculations
  const size = 160;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Progress ratio (cap at 1 for stroke)
  const effectiveTarget = target + exercise;
  const progressRatio = effectiveTarget > 0 ? Math.min(consumed / effectiveTarget, 1) : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Score calculation
  const calRatio = effectiveTarget > 0 ? consumed / effectiveTarget : 0;
  let score = 90;
  let scoreVerdict = '营养均衡 · 优秀';
  if (calRatio > 1.15) {
    score = Math.max(60, Math.round(100 - (calRatio - 1) * 100));
    scoreVerdict = '热量稍超 · 注意晚间清淡';
  } else if (calRatio < 0.6) {
    score = 78;
    scoreVerdict = '摄入偏低 · 注意保证基代';
  } else {
    score = 88;
    scoreVerdict = '减脂黄金比例 · 优秀';
  }

  return (
    <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-divider)] shadow-sm mb-4 transition-all">
      {/* Card Header with Collapse */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">热量摄入</h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 transition-transform"
          aria-label="展开或收起"
        >
          <motion.span
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            className="inline-block text-sm font-semibold"
          >
            ▲
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* 3-Column Metric Display matching Thin Mint screenshot */}
            <div className="flex items-center justify-between py-2 px-1">
              {/* Left Column: 饮食摄入 */}
              <div className="flex-1 text-center">
                <div className="text-xs text-[var(--color-text-secondary)] mb-1">饮食摄入</div>
                <div className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                  {consumed}
                </div>
              </div>

              {/* Center Column: Circular Ring */}
              <div className="relative flex items-center justify-center mx-1" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                  {/* Background Track */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-divider)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                  {/* Active Progress */}
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
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    {isOver ? '超出热量 (千卡)' : '还可以吃 (千卡)'}
                  </span>
                  <span
                    className={`text-3xl font-extrabold tracking-tight mt-0.5 ${
                      isOver ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {isOver ? overAmount : remaining}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-0.5">
                    预算 {target} ⓘ
                  </span>
                </div>
              </div>

              {/* Right Column: 运动消耗 */}
              <div
                className="flex-1 text-center cursor-pointer group"
                onClick={() => setShowExerciseModal(true)}
                title="点击记录运动消耗"
              >
                <div className="text-xs text-[var(--color-text-secondary)] mb-1 group-hover:text-[var(--color-calories)] transition-colors">
                  运动消耗 ✎
                </div>
                <div className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-calories)] transition-colors">
                  {exercise}
                </div>
              </div>
            </div>

            {/* Macronutrients: 3 side-by-side columns (Carbs, Protein, Fat) */}
            <div className="grid grid-cols-3 gap-3 pt-3 pb-2 border-t border-[var(--color-divider)]">
              {/* Carbs */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--color-text-secondary)] font-medium">碳水化合物</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#10B981]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, carbs.target > 0 ? (carbs.current / carbs.target) * 100 : 0)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-medium">
                  {Math.round(carbs.current)} / {carbs.target} 克
                </div>
              </div>

              {/* Protein */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--color-text-secondary)] font-medium">蛋白质</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#F43F5E]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, protein.target > 0 ? (protein.current / protein.target) * 100 : 0)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-medium">
                  {Math.round(protein.current)} / {protein.target} 克
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--color-text-secondary)] font-medium">脂肪</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#F59E0B]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, fat.target > 0 ? (fat.current / fat.target) * 100 : 0)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-medium">
                  {Math.round(fat.current)} / {fat.target} 克
                </div>
              </div>
            </div>

            {/* Diet Recommendation Capsule matching 薄荷健康 screenshot */}
            <div
              onClick={() => setShowAdviceModal(true)}
              className="mt-3 cursor-pointer p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">🍴</span>
                <div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium">
                    今日饮食建议
                  </div>
                  <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    今日得分 {score} · {scoreVerdict}
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">详情 ›</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 max-w-xs w-full border border-[var(--color-divider)] shadow-2xl">
            <h3 className="text-base font-bold mb-2">🏃 记录运动消耗</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              运动消耗的热量会自动加入今日可摄入预算
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                placeholder="千卡"
                value={exerciseInput}
                onChange={(e) => setExerciseInput(e.target.value)}
                className="flex-1 py-2 px-3 text-lg font-bold rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-center"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">kcal</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const val = parseInt(exerciseInput) || 0;
                  onUpdateExercise?.(val);
                  setShowExerciseModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-[var(--color-calories)] text-white text-sm font-semibold"
              >
                保存
              </button>
              <button
                onClick={() => setShowExerciseModal(false)}
                className="py-2 px-4 rounded-xl bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advice Modal */}
      {showAdviceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 max-w-sm w-full border border-[var(--color-divider)] shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-3xl">🥗</span>
              <h3 className="text-lg font-bold mt-2">今日减脂饮食建议</h3>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {score} <span className="text-xs font-normal">分</span>
              </div>
            </div>
            <div className="space-y-3 text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6">
              <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">🎯 热量控制：</span>
                {consumed > target
                  ? `目前超出预算 ${consumed - target} 千卡，建议晚间散步或适量进行轻度有氧运动。`
                  : `剩余 ${remaining} 千卡预算，处于健康减脂热量赤字区间。`}
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">🥩 蛋白质摄入：</span>
                {protein.current >= protein.target * 0.8
                  ? '蛋白质摄入充沛，有利于减脂期间锁住瘦体重和维持高代谢率。'
                  : '蛋白质偏少，建议补充鸡胸肉、水煮蛋、乳清蛋白粉或低脂奶制品。'}
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">💧 饮水与代谢：</span>
                每天保证 2000ml 以上水分，充足饮水能提升 3%~5% 静息代谢率。
              </div>
            </div>
            <button
              onClick={() => setShowAdviceModal(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--color-calories)] text-white text-sm font-semibold"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
