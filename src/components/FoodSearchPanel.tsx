import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MealType, FoodItem, FoodCategory } from '@/types';
import { CATEGORY_META, MEAL_META } from '@/types';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useAppStore } from '@/stores/appStore';
import { calculatePortion } from '@/utils/calculator';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

interface FoodSearchPanelProps {
  mealType: MealType;
  onClose: () => void;
}

export function FoodSearchPanel({ mealType: initialMealType, onClose }: FoodSearchPanelProps) {
  const [currentMeal, setCurrentMeal] = useState<MealType>(initialMealType);
  const { search, results, recentFoods, query, setQuery } = useFoodSearch();
  const addMealEntry = useAppStore((s) => s.addMealEntry);

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);

  // Manual override for existing food
  const [isCustomizingNutrients, setIsCustomizingNutrients] = useState(false);
  const [customCal, setCustomCal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // Brand-new custom food creator mode
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<FoodCategory>('custom');
  const [newFoodGrams, setNewFoodGrams] = useState('100');
  const [newFoodCal, setNewFoodCal] = useState('');
  const [newFoodProtein, setNewFoodProtein] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const [newFoodFat, setNewFoodFat] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // When selected food changes, update nutrient states
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    const defaultG = food.commonServings?.[0]?.grams ?? 100;
    setGrams(defaultG);
    const portion = calculatePortion(food.per100g, defaultG);
    setCustomCal(String(portion.calories));
    setCustomProtein(String(portion.protein));
    setCustomCarbs(String(portion.carbs));
    setCustomFat(String(portion.fat));
    setIsCustomizingNutrients(false);
  };

  const handleGramsChange = (newG: number) => {
    setGrams(newG);
    if (selectedFood) {
      const portion = calculatePortion(selectedFood.per100g, newG);
      setCustomCal(String(portion.calories));
      setCustomProtein(String(portion.protein));
      setCustomCarbs(String(portion.carbs));
      setCustomFat(String(portion.fat));
    }
  };

  const handleAddSelectedFood = async () => {
    if (!selectedFood) return;

    const cal = parseInt(customCal) || 0;
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFat) || 0;
    const catMeta = CATEGORY_META[selectedFood.category];

    await addMealEntry(currentMeal, {
      foodId: selectedFood.id,
      name: selectedFood.name,
      emoji: catMeta.emoji,
      grams,
      calories: cal,
      protein: p,
      fat: f,
      carbs: c,
    });

    await db.foods.update(selectedFood.id, {
      lastUsedAt: Date.now(),
      useCount: (selectedFood.useCount ?? 0) + 1,
    });

    toast.success(`已添加 ${selectedFood.name}`);
    setSelectedFood(null);
    onClose();
  };

  // Create brand new custom food
  const handleCreateNewFood = async () => {
    if (!newFoodName.trim()) {
      toast.error('请输入食物名称');
      return;
    }
    const cal = parseInt(newFoodCal) || 0;
    const g = parseFloat(newFoodGrams) || 100;
    const p = parseFloat(newFoodProtein) || 0;
    const c = parseFloat(newFoodCarbs) || 0;
    const f = parseFloat(newFoodFat) || 0;

    const foodId = 'custom_' + nanoid();
    const catMeta = CATEGORY_META[newFoodCategory];

    // Calculate per 100g for database storage
    const ratioTo100g = 100 / g;
    const per100g = {
      calories: Math.round(cal * ratioTo100g),
      protein: Math.round(p * ratioTo100g * 10) / 10,
      fat: Math.round(f * ratioTo100g * 10) / 10,
      carbs: Math.round(c * ratioTo100g * 10) / 10,
    };

    if (saveToLibrary) {
      await db.foods.add({
        id: foodId,
        name: newFoodName.trim(),
        pinyinIndex: 'zdy',
        category: newFoodCategory,
        source: 'USER_CUSTOM',
        per100g,
        commonServings: [{ label: '1份', grams: g }],
        lastUsedAt: Date.now(),
        useCount: 1,
      });
    }

    // Add directly to current meal
    await addMealEntry(currentMeal, {
      foodId,
      name: newFoodName.trim(),
      emoji: catMeta.emoji,
      grams: g,
      calories: cal,
      protein: p,
      fat: f,
      carbs: c,
    });

    toast.success(`✅ 已自定义记录 ${newFoodName}`);
    setIsCreatingFood(false);
    onClose();
  };

  const displayFoods = query.trim() ? results : recentFoods;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-[var(--color-bg-primary)] flex flex-col text-[var(--color-text-primary)]"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      {/* Top Navigation & Meal Selector */}
      <div className="px-4 pt-2 pb-2 border-b border-[var(--color-divider)] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          {/* Meal tabs */}
          <div className="flex bg-[var(--color-bg-secondary)] p-0.5 rounded-xl">
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((m) => {
              const meta = MEAL_META[m];
              const isActive = currentMeal === m;
              return (
                <button
                  key={m}
                  onClick={() => setCurrentMeal(m)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
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

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="text-sm font-semibold text-[var(--color-calories)] px-2 py-1 rounded-lg hover:bg-[var(--color-bg-secondary)] active:scale-95 transition-all"
          >
            取消
          </button>
        </div>

        {/* Pinned Search Input */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-sm text-[var(--color-text-secondary)] pointer-events-none">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索食物名称或拼音 (如: 鸡蛋、jxr、米饭)..."
            value={query}
            onChange={(e) => {
              search(e.target.value);
              setIsCreatingFood(false);
            }}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-sm font-medium text-[var(--color-text-primary)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/40 placeholder:text-[var(--color-text-secondary)]/60"
          />
          {query.trim() && (
            <button
              onClick={() => {
                setQuery('');
                search('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 w-5 h-5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] flex items-center justify-center text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scroll">
        <AnimatePresence mode="wait">
          {/* Mode 1: Brand new custom food creation */}
          {isCreatingFood ? (
            <motion.div
              key="create-custom"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-divider)] shadow-sm space-y-3.5 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-bold text-base">自定义录入新食物</h3>
                </div>
                <button
                  onClick={() => setIsCreatingFood(false)}
                  className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-secondary)] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Name & Category */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-1">
                  食物名称
                </label>
                <input
                  type="text"
                  placeholder="如：自制低脂肉丸、黑麦欧包..."
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-sm font-semibold"
                />
              </div>

              {/* Category picker */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-1">
                  分类
                </label>
                <select
                  value={newFoodCategory}
                  onChange={(e) => setNewFoodCategory(e.target.value as FoodCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-xs"
                >
                  {Object.entries(CATEGORY_META).map(([cat, meta]) => (
                    <option key={cat} value={cat}>
                      {meta.emoji} {meta.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grams */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-1">
                  本次食用重量 (g)
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={newFoodGrams}
                  onChange={(e) => setNewFoodGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-sm font-bold text-center"
                />
              </div>

              {/* 4 Macros */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                    总热量 (kcal)
                  </label>
                  <input
                    type="number"
                    placeholder="如 250"
                    value={newFoodCal}
                    onChange={(e) => setNewFoodCal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-bold text-[var(--color-calories)] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                    蛋白质 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 20"
                    value={newFoodProtein}
                    onChange={(e) => setNewFoodProtein(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-bold text-[#FB7185] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                    碳水化合物 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 30"
                    value={newFoodCarbs}
                    onChange={(e) => setNewFoodCarbs(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-bold text-[#10B981] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1">
                    脂肪 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 5"
                    value={newFoodFat}
                    onChange={(e) => setNewFoodFat(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-bold text-[#FBBF24] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>
              </div>

              {/* Save to library toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)] pt-1">
                <input
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="rounded text-[var(--color-calories)]"
                />
                <span>保存到我的自定义食物库（方便以后直接搜索）</span>
              </label>

              <button
                onClick={handleCreateNewFood}
                className="w-full py-3 rounded-2xl bg-[var(--color-calories)] text-white font-bold text-sm shadow-md hover:opacity-95"
              >
                ✅ 添加并入账到{MEAL_META[currentMeal].label}
              </button>
            </motion.div>
          ) : selectedFood ? (
            /* Mode 2: Selected Food Portion Detail Card with custom nutrient tweak */
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-divider)] shadow-sm space-y-4 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {CATEGORY_META[selectedFood.category]?.emoji ?? '🥗'}
                  </span>
                  <div>
                    <h3 className="font-bold text-base">{selectedFood.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {selectedFood.source === 'USDA' ? 'USDA 官方库' : '中国食物成分表'} ·{' '}
                      {selectedFood.per100g.calories} kcal / 100g
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-secondary)] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Portion Capsules */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-2">
                  快捷份量选择：
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedFood.commonServings?.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleGramsChange(s.grams)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        grams === s.grams
                          ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)] shadow-xs'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                      }`}
                    >
                      {s.label} ({s.grams}g)
                    </button>
                  ))}
                  <button
                    onClick={() => handleGramsChange(100)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      grams === 100
                        ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)] shadow-xs'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                    }`}
                  >
                    100g
                  </button>
                  <button
                    onClick={() => handleGramsChange(200)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      grams === 200
                        ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)] shadow-xs'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                    }`}
                  >
                    200g
                  </button>
                </div>
              </div>

              {/* Exact gram input */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-1.5">
                  摄入克数：
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={grams}
                    onChange={(e) => handleGramsChange(Math.max(1, Number(e.target.value)))}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-xl font-bold text-center"
                    min={1}
                  />
                  <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    克 (g)
                  </span>
                </div>
              </div>

              {/* Nutrition numbers (Interactive / Custom editable) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    折算营养素数值：
                  </span>
                  <button
                    onClick={() => setIsCustomizingNutrients(!isCustomizingNutrients)}
                    className="text-xs text-[var(--color-calories)] font-semibold"
                  >
                    {isCustomizingNutrients ? '完成微调' : '✎ 自定义微调数值'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded-2xl text-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">热量</span>
                    {isCustomizingNutrients ? (
                      <input
                        type="number"
                        value={customCal}
                        onChange={(e) => setCustomCal(e.target.value)}
                        className="w-full text-center font-bold text-sm bg-transparent text-[var(--color-calories)]"
                      />
                    ) : (
                      <span className="text-base font-bold text-[var(--color-calories)]">
                        {customCal}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--color-text-tertiary)] block">kcal</span>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded-2xl text-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">蛋白质</span>
                    {isCustomizingNutrients ? (
                      <input
                        type="number"
                        step="0.1"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        className="w-full text-center font-bold text-sm bg-transparent text-[#FB7185]"
                      />
                    ) : (
                      <span className="text-base font-bold text-[#FB7185]">{customProtein}</span>
                    )}
                    <span className="text-[10px] text-[var(--color-text-tertiary)] block">g</span>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded-2xl text-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">碳水</span>
                    {isCustomizingNutrients ? (
                      <input
                        type="number"
                        step="0.1"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(e.target.value)}
                        className="w-full text-center font-bold text-sm bg-transparent text-[#10B981]"
                      />
                    ) : (
                      <span className="text-base font-bold text-[#10B981]">{customCarbs}</span>
                    )}
                    <span className="text-[10px] text-[var(--color-text-tertiary)] block">g</span>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded-2xl text-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">脂肪</span>
                    {isCustomizingNutrients ? (
                      <input
                        type="number"
                        step="0.1"
                        value={customFat}
                        onChange={(e) => setCustomFat(e.target.value)}
                        className="w-full text-center font-bold text-sm bg-transparent text-[#FBBF24]"
                      />
                    ) : (
                      <span className="text-base font-bold text-[#FBBF24]">{customFat}</span>
                    )}
                    <span className="text-[10px] text-[var(--color-text-tertiary)] block">g</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddSelectedFood}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-calories)] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all"
              >
                ✅ 添加到今日{MEAL_META[currentMeal].label}
              </button>
            </motion.div>
          ) : (
            /* Mode 3: Search Results List */
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Quick Custom Food Action Card */}
              <div
                onClick={() => {
                  setNewFoodName(query.trim());
                  setIsCreatingFood(true);
                }}
                className="mb-3 p-3 rounded-2xl bg-[var(--color-calories)]/10 border border-[var(--color-calories)]/30 flex items-center justify-between cursor-pointer hover:bg-[var(--color-calories)]/15 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">➕</span>
                  <div>
                    <div className="text-xs font-bold text-[var(--color-calories)]">
                      {query.trim()
                        ? `没搜到？点此自定义添加「${query.trim()}」`
                        : '自定义录入新食物（自定义热量与三大营养素）'}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">
                      自由输入能量、蛋白质、碳水和脂肪数据
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[var(--color-calories)] font-semibold">录入 ›</span>
              </div>

              {!query.trim() && recentFoods.length > 0 && (
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 px-1">
                  ⏱ 最近使用食物
                </div>
              )}

              {query.trim() && displayFoods.length === 0 && (
                <div className="text-center py-12 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-3xl block mb-2">🥗</span>
                  食物库中暂无「{query}」
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    点击上方按钮即可一键录入该食物并保存到个人库！
                  </p>
                </div>
              )}

              <div className="space-y-1.5 pb-20">
                {displayFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] hover:border-[var(--color-calories)] active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">
                        {CATEGORY_META[food.category]?.emoji ?? '🥗'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
                          {food.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {food.per100g.calories} kcal / 100g · 蛋白质 {food.per100g.protein}g ·
                          碳水 {food.per100g.carbs}g · 脂肪 {food.per100g.fat}g
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-xs px-2 py-1 rounded-lg bg-[var(--color-calories)]/10 text-[var(--color-calories)] font-semibold">
                        选份量 ›
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
