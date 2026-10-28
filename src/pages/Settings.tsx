import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros, getAge } from '@/utils/calculator';
import { db } from '@/db';
import { uploadToGist, downloadFromGist } from '@/utils/githubSync';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { profile, setProfile, theme, setTheme, todayLog, loadDailyLog } = useAppStore();
  const [editingWeight, setEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  // Custom Targets editing state
  const [editingTargets, setEditingTargets] = useState(false);
  const [customCal, setCustomCal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // GitHub Sync state
  const [syncToken, setSyncToken] = useState(profile?.githubSyncToken ?? '');
  const [syncGistId, setSyncGistId] = useState(profile?.gistId ?? '');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!profile) return null;

  const handleWeightUpdate = async (newWeight: number) => {
    const age = getAge(profile.birthYear);
    const bmr = calculateBMR(profile.gender, newWeight, profile.heightCm, age);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const targetCalories = calculateTargetCalories(tdee, profile.deficitMode);
    const macros = calculateMacros(targetCalories, newWeight);

    await setProfile({
      ...profile,
      currentWeightKg: newWeight,
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      ...macros,
      targetProtein: macros.protein,
      targetFat: macros.fat,
      targetCarbs: macros.carbs,
    });
    toast.success('体重已更新，目标已重算');
  };

  const handleSaveTargets = async () => {
    if (!profile) return;
    const cal = parseInt(customCal);
    const p = parseFloat(customProtein);
    const c = parseFloat(customCarbs);
    const f = parseFloat(customFat);

    if (!cal || cal < 500 || cal > 10000) {
      toast.error('请输入合理的热量预算 (500~10000 kcal)');
      return;
    }

    const updatedProfile = {
      ...profile,
      targetCalories: cal,
      targetProtein: p >= 0 ? p : profile.targetProtein,
      targetCarbs: c >= 0 ? c : profile.targetCarbs,
      targetFat: f >= 0 ? f : profile.targetFat,
      updatedAt: Date.now(),
    };

    await setProfile(updatedProfile);

    // If today's log exists, update its targetCalories too
    if (todayLog) {
      await db.dailyLogs.update(todayLog.date, { targetCalories: cal });
      await loadDailyLog(todayLog.date);
    }

    setEditingTargets(false);
    toast.success('🎯 每日热量与营养素目标已自定义更新！');
  };

  const handleResetTargets = async () => {
    if (!profile) return;
    const age = getAge(profile.birthYear);
    const bmr = calculateBMR(profile.gender, profile.currentWeightKg, profile.heightCm, age);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const targetCalories = calculateTargetCalories(tdee, profile.deficitMode);
    const macros = calculateMacros(targetCalories, profile.currentWeightKg);

    setCustomCal(String(targetCalories));
    setCustomProtein(String(macros.protein));
    setCustomCarbs(String(macros.carbs));
    setCustomFat(String(macros.fat));
    toast.success('已恢复为科学推荐值');
  };

  const handleExport = async () => {
    const logs = await db.dailyLogs.toArray();
    const foods = await db.foods.where('source').anyOf(['USER_CUSTOM', 'OCR_SCANNED']).toArray();
    const data = { profile, logs, customFoods: foods, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calobuddy-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('数据已导出');
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.logs) {
          await db.dailyLogs.bulkPut(data.logs);
        }
        if (data.customFoods) {
          await db.foods.bulkPut(data.customFoods);
        }
        toast.success(`已导入 ${data.logs?.length ?? 0} 天的记录`);
      } catch {
        toast.error('导入失败，请检查文件格式');
      }
    };
    input.click();
  };

  const handleCloudUpload = async () => {
    if (!syncToken.trim()) {
      toast.error('请先输入 GitHub Personal Access Token (需勾选 gist 权限)');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await uploadToGist(syncToken, syncGistId || undefined);
      setSyncGistId(res.gistId);
      if (profile) {
        await setProfile({
          ...profile,
          githubSyncToken: syncToken.trim(),
          gistId: res.gistId,
          lastSyncAt: Date.now(),
        });
      }
      toast.success('✨ 饮食记录已同步备份至云端私有 Gist！');
    } catch (err: any) {
      toast.error(err.message || '云端同步失败');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudDownload = async () => {
    if (!syncToken.trim() || !syncGistId.trim()) {
      toast.error('从云端恢复需同时提供 GitHub Token 和 Gist ID');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await downloadFromGist(syncToken, syncGistId);
      toast.success(`✅ 成功从云端恢复并合并 ${res.logCount} 天饮食记录！`);
    } catch (err: any) {
      toast.error(err.message || '拉取失败');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-4 pt-6 pb-10"
    >
      <h1 className="text-2xl font-bold mb-6">⚙️ 设置</h1>

      {/* Profile summary */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)] mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">个人资料</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[var(--color-text-secondary)]">性别</span>
            <div className="font-medium">{profile.gender === 'male' ? '男' : '女'}</div>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">年龄</span>
            <div className="font-medium">{getAge(profile.birthYear)} 岁</div>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">身高</span>
            <div className="font-medium">{profile.heightCm} cm</div>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">当前体重</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-medium">{profile.currentWeightKg} kg</span>
              <button
                onClick={() => {
                  setNewWeight(String(profile.currentWeightKg));
                  setEditingWeight(true);
                }}
                className="text-xs text-[var(--color-calories)] font-medium px-2 py-0.5 rounded bg-[var(--color-bg-secondary)]"
              >
                修改
              </button>
            </div>
          </div>
        </div>

        {editingWeight && (
          <div className="mt-4 pt-4 border-t border-[var(--color-divider)] flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="输入新体重(kg)"
              className="flex-1 px-3 py-1.5 text-sm rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
            />
            <button
              onClick={() => {
                const val = parseFloat(newWeight);
                if (val > 20 && val < 300) {
                  handleWeightUpdate(val);
                  setEditingWeight(false);
                } else {
                  toast.error('请输入有效体重');
                }
              }}
              className="px-3 py-1.5 text-sm rounded-xl bg-[var(--color-calories)] text-white font-medium"
            >
              保存
            </button>
            <button
              onClick={() => setEditingWeight(false)}
              className="px-3 py-1.5 text-sm rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
            >
              取消
            </button>
          </div>
        )}
      </section>

      {/* Targets */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)] mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">每日目标 (支持自定义)</h2>
          {!editingTargets ? (
            <button
              onClick={() => {
                setCustomCal(String(profile.targetCalories));
                setCustomProtein(String(profile.targetProtein));
                setCustomCarbs(String(profile.targetCarbs));
                setCustomFat(String(profile.targetFat));
                setEditingTargets(true);
              }}
              className="text-xs text-[var(--color-calories)] font-medium px-2 py-0.5 rounded bg-[var(--color-bg-secondary)]"
            >
              ✎ 自定义目标
            </button>
          ) : (
            <button
              onClick={handleResetTargets}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-calories)] px-2 py-0.5 rounded bg-[var(--color-bg-secondary)]"
            >
              ↺ 恢复推荐值
            </button>
          )}
        </div>

        {editingTargets ? (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">
                每日热量预算 (kcal)
              </label>
              <input
                type="number"
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
                placeholder="如 1800"
                className="w-full px-3 py-2 text-sm font-bold text-[var(--color-calories)] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                  蛋白质 (g)
                </label>
                <input
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  placeholder="如 135"
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-[#FB7185] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                  碳水化合物 (g)
                </label>
                <input
                  type="number"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  placeholder="如 200"
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-[#10B981] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                  脂肪 (g)
                </label>
                <input
                  type="number"
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value)}
                  placeholder="如 45"
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-[#FBBF24] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveTargets}
                className="flex-1 py-2 rounded-xl bg-[var(--color-calories)] text-white text-xs font-semibold shadow-xs"
              >
                保存自定义目标
              </button>
              <button
                onClick={() => setEditingTargets(false)}
                className="px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-secondary)]"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>热量预算</span>
              <span className="font-bold text-[var(--color-calories)]">{profile.targetCalories} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>蛋白质</span>
              <span className="font-bold text-[var(--color-protein)]">{profile.targetProtein}g</span>
            </div>
            <div className="flex justify-between">
              <span>碳水化合物</span>
              <span className="font-bold text-[var(--color-carbs)]">{profile.targetCarbs}g</span>
            </div>
            <div className="flex justify-between">
              <span>脂肪</span>
              <span className="font-bold text-[var(--color-fat)]">{profile.targetFat}g</span>
            </div>
            <div className="flex justify-between">
              <span>TDEE (总能量消耗)</span>
              <span className="font-medium">{profile.tdee} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>BMR (基础代谢)</span>
              <span className="font-medium">{profile.bmr} kcal</span>
            </div>
          </div>
        )}
      </section>

      {/* Theme */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)] mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">外观主题</h2>
        <div className="flex gap-2">
          {([
            { value: 'system' as const, label: '跟随系统', icon: '🌓' },
            { value: 'light' as const, label: '浅色', icon: '☀️' },
            { value: 'dark' as const, label: '暗色', icon: '🌙' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                theme === opt.value
                  ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Cloud Sync Section */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)] mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">☁️ 跨设备私有云同步 (GitHub Gist)</h2>
          {profile.lastSyncAt && (
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              上次同步: {new Date(profile.lastSyncAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
          利用你的 GitHub 账号免费私有 Gist 存储，在 iPhone 与 iPad 之间随时双向同步，数据 100% 仅归你所有。
        </p>

        <div className="space-y-2 mb-3">
          <div>
            <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              placeholder="ghp_xxxx (需勾选 gist 权限)"
              value={syncToken}
              onChange={(e) => setSyncToken(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
              云端 Gist ID（首次上传自动生成）
            </label>
            <input
              type="text"
              placeholder="自动生成或粘贴已有 Gist ID"
              value={syncGistId}
              onChange={(e) => setSyncGistId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCloudUpload}
            disabled={isSyncing}
            className="py-2 rounded-xl text-xs font-semibold bg-[var(--color-calories)] text-white shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isSyncing ? '同步中...' : '☁️ 备份上传至云端'}
          </button>
          <button
            onClick={handleCloudDownload}
            disabled={isSyncing}
            className="py-2 rounded-xl text-xs font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSyncing ? '同步中...' : '⬇️ 从云端同步合并'}
          </button>
        </div>
      </section>

      {/* Data management */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)] mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">本地备份与 AirDrop</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          也可通过 iPhone / iPad 自带的「隔空投送 (AirDrop)」或「iCloud 云盘」直接将数据导出文件发送给另一台设备快速导入。
        </p>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-80 transition-opacity"
          >
            📤 导出数据 (JSON)
          </button>
          <button
            onClick={handleImport}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-80 transition-opacity"
          >
            📥 导入数据
          </button>
        </div>
      </section>

      {/* About */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-divider)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">关于</h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          CaloBuddy v1.0 🥑<br />
          数据来源：USDA FoodData Central · 《中国食物成分表》第6版<br />
          所有数据存储在您的设备本地，完全隐私安全。
        </p>
      </section>
    </motion.div>
  );
}
