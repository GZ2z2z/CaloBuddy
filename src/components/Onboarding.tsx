import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import type { UserProfile, ActivityLevel, DeficitMode } from '@/types';
import { ACTIVITY_LEVELS, DEFICIT_MODES } from '@/types';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros, getAge } from '@/utils/calculator';

const pageVariants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export function OnboardingFlow() {
  const setProfile = useAppStore((s) => s.setProfile);
  const loadDailyLog = useAppStore((s) => s.loadDailyLog);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    gender: 'male' as 'male' | 'female',
    birthYear: 1995,
    heightCm: 175,
    currentWeightKg: 75,
    targetWeightKg: 68,
    activityLevel: 'light' as ActivityLevel,
    deficitMode: 'standard' as DeficitMode,
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplete = async () => {
    const age = getAge(form.birthYear);
    const bmr = calculateBMR(form.gender, form.currentWeightKg, form.heightCm, age);
    const tdee = calculateTDEE(bmr, form.activityLevel);
    const targetCalories = calculateTargetCalories(tdee, form.deficitMode);
    const macros = calculateMacros(targetCalories, form.currentWeightKg);

    const profile: UserProfile = {
      ...form,
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      targetProtein: macros.protein,
      targetFat: macros.fat,
      targetCarbs: macros.carbs,
      theme: 'system',
      targetWaterMl: 2000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setProfile(profile);
    await loadDailyLog();
  };

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" variants={pageVariants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="text-7xl mb-6">🥑</div>
      <h1 className="text-3xl font-bold mb-2">CaloBuddy</h1>
      <p className="text-[var(--color-text-secondary)] mb-2 text-lg">极简智能饮食与减脂热量追踪器</p>
      <p className="text-[var(--color-text-tertiary)] mb-10 text-sm max-w-xs">
        基于权威食物数据库，科学计算你的每日热量预算，轻松记录每一餐
      </p>
      <button
        onClick={() => setStep(1)}
        className="w-full max-w-xs py-3 rounded-2xl bg-[var(--color-calories)] text-white font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        开始设置 →
      </button>
    </motion.div>,

    // Step 1: Basic info
    <motion.div key="basic" variants={pageVariants} initial="enter" animate="center" exit="exit" className="min-h-screen px-6 pt-16 pb-32">
      <h2 className="text-2xl font-bold mb-1">🧍 基础信息</h2>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">告诉我们你的基本身体数据</p>

      {/* Gender */}
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">性别</label>
      <div className="flex gap-3 mb-6">
        {(['male', 'female'] as const).map((g) => (
          <button
            key={g}
            onClick={() => update('gender', g)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all border ${
              form.gender === g
                ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)]'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border-[var(--color-divider)]'
            }`}
          >
            {g === 'male' ? '♂ 男' : '♀ 女'}
          </button>
        ))}
      </div>

      {/* Birth year */}
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">出生年份</label>
      <input
        type="number"
        value={form.birthYear}
        onChange={(e) => update('birthYear', Number(e.target.value))}
        className="w-full py-3 px-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-[var(--color-text-primary)] mb-6 text-lg"
        min={1940}
        max={2010}
      />

      {/* Height */}
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">身高 (cm)</label>
      <input
        type="number"
        value={form.heightCm}
        onChange={(e) => update('heightCm', Number(e.target.value))}
        className="w-full py-3 px-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-[var(--color-text-primary)] mb-6 text-lg"
        min={100}
        max={250}
      />

      {/* Current weight */}
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">当前体重 (kg)</label>
      <input
        type="number"
        value={form.currentWeightKg}
        onChange={(e) => update('currentWeightKg', Number(e.target.value))}
        className="w-full py-3 px-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-[var(--color-text-primary)] mb-6 text-lg"
        min={30}
        max={200}
        step={0.1}
      />

      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[var(--color-bg-primary)]">
        <button
          onClick={() => setStep(2)}
          className="w-full py-3 rounded-2xl bg-[var(--color-calories)] text-white font-semibold text-lg"
        >
          下一步
        </button>
      </div>
    </motion.div>,

    // Step 2: Goal
    <motion.div key="goal" variants={pageVariants} initial="enter" animate="center" exit="exit" className="min-h-screen px-6 pt-16 pb-32">
      <h2 className="text-2xl font-bold mb-1">🎯 减脂目标</h2>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">设定你的目标体重与减脂速度</p>

      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">目标体重 (kg)</label>
      <input
        type="number"
        value={form.targetWeightKg}
        onChange={(e) => update('targetWeightKg', Number(e.target.value))}
        className="w-full py-3 px-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-[var(--color-text-primary)] mb-8 text-lg"
        min={30}
        max={200}
        step={0.1}
      />

      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 block">减脂速度</label>
      <div className="space-y-3 mb-8">
        {DEFICIT_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => update('deficitMode', mode.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
              form.deficitMode === mode.value
                ? 'border-[var(--color-calories)] bg-[var(--color-calories)]/5'
                : 'border-[var(--color-divider)] bg-[var(--color-bg-card)]'
            }`}
          >
            <span className="text-2xl">{mode.emoji}</span>
            <div className="text-left">
              <div className="font-medium">{mode.label}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                每日缺口 -{mode.deficit} kcal · {mode.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[var(--color-bg-primary)]">
        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="py-3 px-6 rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium">
            ← 返回
          </button>
          <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-2xl bg-[var(--color-calories)] text-white font-semibold text-lg">
            下一步
          </button>
        </div>
      </div>
    </motion.div>,

    // Step 3: Activity
    <motion.div key="activity" variants={pageVariants} initial="enter" animate="center" exit="exit" className="min-h-screen px-6 pt-16 pb-32">
      <h2 className="text-2xl font-bold mb-1">🏃 活动水平</h2>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">选择最符合你日常状态的选项</p>

      <div className="space-y-3">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => update('activityLevel', level.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
              form.activityLevel === level.value
                ? 'border-[var(--color-calories)] bg-[var(--color-calories)]/5'
                : 'border-[var(--color-divider)] bg-[var(--color-bg-card)]'
            }`}
          >
            <div>
              <div className="font-medium">{level.label}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{level.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[var(--color-bg-primary)]">
        <div className="flex gap-3">
          <button onClick={() => setStep(2)} className="py-3 px-6 rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium">
            ← 返回
          </button>
          <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-2xl bg-[var(--color-calories)] text-white font-semibold text-lg">
            查看结果
          </button>
        </div>
      </div>
    </motion.div>,

    // Step 4: Results
    (() => {
      const age = getAge(form.birthYear);
      const bmr = calculateBMR(form.gender, form.currentWeightKg, form.heightCm, age);
      const tdee = calculateTDEE(bmr, form.activityLevel);
      const targetCal = calculateTargetCalories(tdee, form.deficitMode);
      const macros = calculateMacros(targetCal, form.currentWeightKg);

      return (
        <motion.div key="result" variants={pageVariants} initial="enter" animate="center" exit="exit" className="min-h-screen px-6 pt-16 pb-32">
          <h2 className="text-2xl font-bold mb-1">📊 你的专属计划</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">基于 Mifflin-St Jeor 公式科学计算</p>

          <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-divider)] mb-4">
            <div className="text-center mb-6">
              <div className="text-sm text-[var(--color-text-secondary)] mb-1">每日热量预算</div>
              <div className="text-5xl font-bold text-[var(--color-calories)]">{targetCal}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">kcal / 天</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-[var(--color-bg-secondary)] rounded-xl p-3">
                <div className="text-xs text-[var(--color-text-secondary)]">基础代谢 BMR</div>
                <div className="text-lg font-bold">{Math.round(bmr)}</div>
              </div>
              <div className="bg-[var(--color-bg-secondary)] rounded-xl p-3">
                <div className="text-xs text-[var(--color-text-secondary)]">日总消耗 TDEE</div>
                <div className="text-lg font-bold">{tdee}</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-divider)] mb-4">
            <div className="text-sm font-semibold mb-4">三大营养素每日目标</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-protein)]"></div>
                  <span className="text-sm">蛋白质</span>
                </div>
                <span className="text-sm font-bold">{macros.protein}g</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-carbs)]"></div>
                  <span className="text-sm">碳水化合物</span>
                </div>
                <span className="text-sm font-bold">{macros.carbs}g</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-fat)]"></div>
                  <span className="text-sm">脂肪</span>
                </div>
                <span className="text-sm font-bold">{macros.fat}g</span>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[var(--color-bg-primary)]">
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="py-3 px-6 rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium">
                ← 返回
              </button>
              <button onClick={handleComplete} className="flex-1 py-3 rounded-2xl bg-[var(--color-calories)] text-white font-semibold text-lg">
                ✅ 开始记录
              </button>
            </div>
          </div>
        </motion.div>
      );
    })(),
  ];

  return (
    <AnimatePresence mode="wait">
      {steps[step]}
    </AnimatePresence>
  );
}
