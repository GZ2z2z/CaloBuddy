import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/db';
import type { DailyLog } from '@/types';
import { subDays, format } from 'date-fns';
import toast from 'react-hot-toast';

export function TrendsPage() {
  const { profile, updateWeight, todayLog } = useAppStore();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');
  const [weightInput, setWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const all = await db.dailyLogs.toArray();
    setLogs(all);
  };

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const data: {
      date: string;
      label: string;
      weight?: number;
      calories: number;
      targetCalories: number;
    }[] = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const dateKey = format(d, 'yyyy-MM-dd');
      const label = format(d, 'M/d');
      const log = logs.find((l) => l.date === dateKey);

      let totalCal = 0;
      if (log?.meals) {
        const allEntries = [
          ...log.meals.breakfast,
          ...log.meals.lunch,
          ...log.meals.dinner,
          ...log.meals.snacks,
        ];
        totalCal = allEntries.reduce((s, e) => s + e.calories, 0);
      }

      data.push({
        date: dateKey,
        label,
        weight: log?.weight || undefined,
        calories: totalCal,
        targetCalories: log?.targetCalories || profile?.targetCalories || 1800,
      });
    }

    return data;
  }, [logs, timeRange, profile]);

  // Statistics calculation
  const stats = useMemo(() => {
    const loggedDays = chartData.filter((d) => d.calories > 0);
    const avgCal =
      loggedDays.length > 0
        ? Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length)
        : profile?.targetCalories ?? 1800;

    const currentW = todayLog?.weight || profile?.currentWeightKg || 70;
    const targetW = profile?.targetWeightKg || 65;
    const remainingToLose = Math.max(0, currentW - targetW);

    return {
      avgCal,
      currentW,
      targetW,
      remainingToLose: Math.round(remainingToLose * 10) / 10,
    };
  }, [chartData, todayLog, profile]);

  const handleSaveWeight = async () => {
    const w = parseFloat(weightInput);
    if (!w || w < 20 || w > 250) {
      toast.error('请输入有效体重数值');
      return;
    }
    await updateWeight(w);
    setShowWeightModal(false);
    setWeightInput('');
    await loadLogs();
    toast.success('今日体重打卡成功！');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl mx-auto px-4 pt-4 pb-24"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📊 减脂趋势与分析</h1>
        <button
          onClick={() => setShowWeightModal(true)}
          className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-calories)] text-white font-semibold shadow-xs"
        >
          + 体重打卡
        </button>
      </div>

      {/* Time range toggle */}
      <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-2xl mb-4">
        {(['7', '30', '90'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              timeRange === r
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-xs'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            近 {r} 天
          </button>
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-[var(--color-bg-card)] p-3 rounded-2xl border border-[var(--color-divider)] text-center">
          <span className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
            日均摄入
          </span>
          <span className="text-lg font-bold text-[var(--color-calories)]">
            {stats.avgCal}
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)] block">kcal</span>
        </div>

        <div className="bg-[var(--color-bg-card)] p-3 rounded-2xl border border-[var(--color-divider)] text-center">
          <span className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
            当前体重
          </span>
          <span className="text-lg font-bold text-[var(--color-text-primary)]">
            {stats.currentW}
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)] block">kg</span>
        </div>

        <div className="bg-[var(--color-bg-card)] p-3 rounded-2xl border border-[var(--color-divider)] text-center">
          <span className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
            距目标还差
          </span>
          <span className="text-lg font-bold text-[#F43F5E]">
            {stats.remainingToLose}
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)] block">kg</span>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="bg-[var(--color-bg-card)] rounded-3xl p-4 border border-[var(--color-divider)] shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            体重变化轨迹
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">
            目标: {profile?.targetWeightKg} kg
          </span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 11, fill: '#888' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-divider)',
                  fontSize: '12px',
                }}
              />
              {profile?.targetWeightKg && (
                <ReferenceLine
                  y={profile.targetWeightKg}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                name="体重(kg)"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#6366F1' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calorie Intake Chart */}
      <div className="bg-[var(--color-bg-card)] rounded-3xl p-4 border border-[var(--color-divider)] shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            每日热量摄入 vs 目标线
          </span>
          <span className="text-xs text-[var(--color-calories)]">
            预算: {profile?.targetCalories} kcal
          </span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-divider)',
                  fontSize: '12px',
                }}
              />
              {profile?.targetCalories && (
                <ReferenceLine
                  y={profile.targetCalories}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                />
              )}
              <Bar
                dataKey="calories"
                name="摄入(kcal)"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 max-w-xs w-full border border-[var(--color-divider)] shadow-2xl">
            <h3 className="text-base font-bold mb-2">⚖️ 今日体重打卡</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              建议每天早晨空腹、排便后测量，数据最准确
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                step="0.1"
                placeholder="70.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1 py-2 px-3 text-lg font-bold rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-center"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">kg</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveWeight}
                className="flex-1 py-2 rounded-xl bg-[var(--color-calories)] text-white text-sm font-semibold"
              >
                保存打卡
              </button>
              <button
                onClick={() => setShowWeightModal(false)}
                className="py-2 px-4 rounded-xl bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
