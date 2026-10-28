import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MealType, FoodItem, FoodCategory } from '@/types';
import { CATEGORY_META, MEAL_META } from '@/types';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useAppStore } from '@/stores/appStore';
import { calculatePortion } from '@/utils/calculator';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import { pinyin } from 'pinyin-pro';
import toast from 'react-hot-toast';

function detectIsLiquid(name: string): boolean {
  return /奶|油|水|咖啡|茶|可乐|汤|豆浆|汁|酒|拿铁|美式|汽水/.test(name);
}

export function SearchPage() {
  const { query, search, results, recentFoods, allFoods, setQuery } = useFoodSearch();
  const addMealEntry = useAppStore((s) => s.addMealEntry);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [targetMeal, setTargetMeal] = useState<MealType>('lunch');

  // Portion system
  const [unit, setUnit] = useState<'g' | 'ml'>('g');
  const [servingUnitWeight, setServingUnitWeight] = useState(60);
  const [servingLabel, setServingLabel] = useState('份');
  const [servingCount, setServingCount] = useState(1);
  const [totalGrams, setTotalGrams] = useState(100);

  // Manual override for nutrients in detail modal
  const [isCustomizingNutrients, setIsCustomizingNutrients] = useState(false);
  const [customCal, setCustomCal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // Brand-new custom food creator modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<FoodCategory>('custom');
  const [newFoodUnit, setNewFoodUnit] = useState<'g' | 'ml'>('g');
  const [newFoodGrams, setNewFoodGrams] = useState('100');
  const [newFoodKj, setNewFoodKj] = useState('');
  const [newFoodCal, setNewFoodCal] = useState('');
  const [newFoodProtein, setNewFoodProtein] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const [newFoodFat, setNewFoodFat] = useState('');
  const [recordAfterCreate, setRecordAfterCreate] = useState(false);

  // kJ to kcal conversion
  const handleKjChange = (val: string) => {
    setNewFoodKj(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setNewFoodCal(String(Math.round(num / 4.184)));
    } else {
      setNewFoodCal('');
    }
  };

  // Filter foods according to query & category
  const filteredFoods = useMemo(() => {
    let list: FoodItem[] = [];

    if (query.trim()) {
      list = results;
    } else if (selectedCategory === 'recent') {
      list = recentFoods;
    } else if (selectedCategory === 'custom') {
      list = allFoods.filter((f) => f.source === 'USER_CUSTOM');
    } else if (selectedCategory === 'all') {
      list = allFoods;
    } else {
      list = allFoods.filter((f) => f.category === selectedCategory);
    }

    if (query.trim() && selectedCategory !== 'all') {
      if (selectedCategory === 'custom') {
        list = list.filter((f) => f.source === 'USER_CUSTOM');
      } else if (selectedCategory === 'recent') {
        list = list.filter((f) => f.lastUsedAt);
      } else {
        list = list.filter((f) => f.category === selectedCategory);
      }
    }

    return list;
  }, [query, results, allFoods, recentFoods, selectedCategory]);

  const customFoodsCount = useMemo(
    () => allFoods.filter((f) => f.source === 'USER_CUSTOM').length,
    [allFoods],
  );

  // When selecting a food item
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    const isLiq = food.isLiquid || food.defaultUnit === 'ml' || detectIsLiquid(food.name);
    const initialUnit = isLiq ? 'ml' : 'g';
    setUnit(initialUnit);

    const firstServing = food.commonServings?.[0];
    const unitW = firstServing?.grams ?? (isLiq ? 200 : 100);
    const label = firstServing?.label?.replace(/[0-9(gml)]/gi, '').trim() || (isLiq ? '杯' : '份');

    setServingUnitWeight(unitW);
    setServingLabel(label || (isLiq ? '杯' : '份'));
    setServingCount(1);

    const total = unitW * 1;
    setTotalGrams(total);

    const portion = calculatePortion(food.per100g, total);
    setCustomCal(String(portion.calories));
    setCustomProtein(String(portion.protein));
    setCustomCarbs(String(portion.carbs));
    setCustomFat(String(portion.fat));
    setIsCustomizingNutrients(false);
  };

  // Single portion weight change
  const handleServingUnitWeightChange = (newWeight: number) => {
    const validWeight = Math.max(1, newWeight);
    setServingUnitWeight(validWeight);
    const newTotal = Math.round(validWeight * servingCount);
    setTotalGrams(newTotal);

    if (selectedFood) {
      const portion = calculatePortion(selectedFood.per100g, newTotal);
      setCustomCal(String(portion.calories));
      setCustomProtein(String(portion.protein));
      setCustomCarbs(String(portion.carbs));
      setCustomFat(String(portion.fat));
    }
  };

  // Portion count change
  const handleServingCountChange = (newCount: number) => {
    const validCount = Math.max(0.1, Math.round(newCount * 10) / 10);
    setServingCount(validCount);
    const newTotal = Math.round(servingUnitWeight * validCount);
    setTotalGrams(newTotal);

    if (selectedFood) {
      const portion = calculatePortion(selectedFood.per100g, newTotal);
      setCustomCal(String(portion.calories));
      setCustomProtein(String(portion.protein));
      setCustomCarbs(String(portion.carbs));
      setCustomFat(String(portion.fat));
    }
  };

  // Direct total grams change
  const handleTotalGramsChange = (newTotal: number) => {
    const validTotal = Math.max(1, newTotal);
    setTotalGrams(validTotal);
    if (servingUnitWeight > 0) {
      setServingCount(Math.round((validTotal / servingUnitWeight) * 10) / 10);
    }

    if (selectedFood) {
      const portion = calculatePortion(selectedFood.per100g, validTotal);
      setCustomCal(String(portion.calories));
      setCustomProtein(String(portion.protein));
      setCustomCarbs(String(portion.carbs));
      setCustomFat(String(portion.fat));
    }
  };

  // Add entry to today's log
  const handleAddMealEntry = async () => {
    if (!selectedFood) return;

    const cal = parseInt(customCal) || 0;
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFat) || 0;
    const catMeta = CATEGORY_META[selectedFood.category];

    await addMealEntry(targetMeal, {
      foodId: selectedFood.id,
      name: selectedFood.name,
      emoji: catMeta.emoji,
      unit,
      servingLabel,
      servingUnitWeight,
      servingCount,
      grams: totalGrams,
      calories: cal,
      protein: p,
      fat: f,
      carbs: c,
    });

    await db.foods.update(selectedFood.id, {
      lastUsedAt: Date.now(),
      useCount: (selectedFood.useCount ?? 0) + 1,
    });

    toast.success(`已添加「${selectedFood.name}」到今日${MEAL_META[targetMeal].label}！`);
    setSelectedFood(null);
  };

  // Delete custom food
  const handleDeleteCustomFood = async (e: React.MouseEvent, food: FoodItem) => {
    e.stopPropagation();
    if (!confirm(`确定要从数据库中删除自定义食物「${food.name}」吗？`)) return;
    await db.foods.delete(food.id);
    if (selectedFood?.id === food.id) setSelectedFood(null);
    toast.success(`已删除「${food.name}」`);
  };

  // Create new custom food
  const handleCreateFood = async () => {
    if (!newFoodName.trim()) {
      toast.error('请输入食物名称');
      return;
    }
    const cal = parseInt(newFoodCal) || Math.round((parseFloat(newFoodKj) || 0) / 4.184) || 0;
    const g = parseFloat(newFoodGrams) || 100;
    const p = parseFloat(newFoodProtein) || 0;
    const c = parseFloat(newFoodCarbs) || 0;
    const f = parseFloat(newFoodFat) || 0;

    const foodId = 'custom_' + nanoid();
    const catMeta = CATEGORY_META[newFoodCategory];

    const ratioTo100 = 100 / g;
    const per100g = {
      calories: Math.round(cal * ratioTo100),
      protein: Math.round(p * ratioTo100 * 10) / 10,
      fat: Math.round(f * ratioTo100 * 10) / 10,
      carbs: Math.round(c * ratioTo100 * 10) / 10,
    };

    // Full & acronym pinyin for fuzzy search
    const pyFull = pinyin(newFoodName.trim(), { toneType: 'none', type: 'array' }).join('');
    const pyAcronym = pinyin(newFoodName.trim(), { pattern: 'first', toneType: 'none', type: 'array' }).join('');
    const pinyinIndex = `${pyAcronym} ${pyFull}`;

    const newFoodItem: FoodItem = {
      id: foodId,
      name: newFoodName.trim(),
      pinyinIndex,
      category: newFoodCategory,
      source: 'USER_CUSTOM',
      defaultUnit: newFoodUnit,
      per100g,
      commonServings: [{ label: `1份 (${g}${newFoodUnit})`, grams: g, unit: newFoodUnit }],
      lastUsedAt: Date.now(),
      useCount: 1,
    };

    await db.foods.add(newFoodItem);

    if (recordAfterCreate) {
      await addMealEntry(targetMeal, {
        foodId,
        name: newFoodName.trim(),
        emoji: catMeta.emoji,
        unit: newFoodUnit,
        servingLabel: '份',
        servingUnitWeight: g,
        servingCount: 1,
        grams: g,
        calories: cal,
        protein: p,
        fat: f,
        carbs: c,
      });
      toast.success(`✅ 已保存新食物并入账到${MEAL_META[targetMeal].label}！`);
    } else {
      toast.success(`✅ 已成功添加「${newFoodName}」到食物库！`);
    }

    // Reset & close
    setNewFoodName('');
    setNewFoodKj('');
    setNewFoodCal('');
    setNewFoodProtein('');
    setNewFoodCarbs('');
    setNewFoodFat('');
    setShowCreateModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto px-4 pt-4 pb-28"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
            <span>🔍</span>
            <span>食物数据库</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            收录 {allFoods.length} 种食物（含 {customFoodsCount} 项个人录入）
          </p>
        </div>

        <button
          onClick={() => {
            setNewFoodName(query.trim());
            setShowCreateModal(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-[var(--color-calories)] text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>✨</span>
          <span>录入新食物</span>
        </button>
      </div>

      {/* Pinned Search Input Box */}
      <div className="relative flex items-center mb-3">
        <span className="absolute left-3.5 text-base text-[var(--color-text-secondary)] pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="搜索食物名称、全拼或首字母 (如: 鸡蛋、jxr、牛奶)..."
          value={query}
          onChange={(e) => search(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-sm font-medium text-[var(--color-text-primary)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/40 placeholder:text-[var(--color-text-secondary)]/60"
        />
        {query.trim() && (
          <button
            onClick={() => {
              setQuery('');
              search('');
            }}
            className="absolute right-3 w-5 h-5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] flex items-center justify-center text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Horizontal Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar custom-scroll">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-[var(--color-calories)] text-white shadow-xs'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-divider)]'
          }`}
        >
          全部 ({allFoods.length})
        </button>

        <button
          onClick={() => setSelectedCategory('custom')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
            selectedCategory === 'custom'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-[var(--color-bg-card)] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          }`}
        >
          <span>⭐</span>
          <span>我的录入 ({customFoodsCount})</span>
        </button>

        {recentFoods.length > 0 && (
          <button
            onClick={() => setSelectedCategory('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedCategory === 'recent'
                ? 'bg-[var(--color-calories)] text-white shadow-xs'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-divider)]'
            }`}
          >
            <span>🔥</span>
            <span>常用</span>
          </button>
        )}

        {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
          const isActive = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-[var(--color-calories)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-divider)]'
              }`}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State / Not Found */}
      {filteredFoods.length === 0 && (
        <div className="bg-[var(--color-bg-card)] rounded-3xl p-8 border border-[var(--color-divider)] text-center my-4 space-y-3">
          <span className="text-4xl block">🥗</span>
          <div className="text-sm font-bold text-[var(--color-text-primary)]">
            {query.trim()
              ? `未在食物库中找到与「${query}」匹配的食物`
              : selectedCategory === 'custom'
              ? '您尚未录入任何自定义食物'
              : '暂无该分类的食物'}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto">
            食物成分表中没有？支持自由录入新食物，能量自动通过 kJ 换算大卡，并同步保存到个人库！
          </p>
          <button
            onClick={() => {
              setNewFoodName(query.trim());
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--color-calories)] text-white text-xs font-bold shadow-xs hover:opacity-95"
          >
            ➕ 点此自定义录入「{query.trim() || '新食物'}」
          </button>
        </div>
      )}

      {/* Food Cards Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredFoods.map((food) => {
          const isLiq = food.isLiquid || food.defaultUnit === 'ml' || detectIsLiquid(food.name);
          const displayUnit = isLiq ? 'ml' : 'g';
          const isUserCustom = food.source === 'USER_CUSTOM';
          const kjVal = Math.round(food.per100g.calories * 4.184);

          return (
            <div
              key={food.id}
              onClick={() => handleSelectFood(food)}
              className="p-3.5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] hover:border-[var(--color-calories)] active:scale-[0.99] transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">
                  {CATEGORY_META[food.category]?.emoji ?? '🥗'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-[var(--color-text-primary)] truncate">
                      {food.name}
                    </span>
                    {isUserCustom && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                        ⭐ 自定义
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    <span className="font-bold text-[var(--color-calories)]">
                      {food.per100g.calories} kcal
                    </span>{' '}
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      ({kjVal} kJ)
                    </span>{' '}
                    / 100{displayUnit}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                    蛋白质 {food.per100g.protein}g · 碳水 {food.per100g.carbs}g · 脂肪 {food.per100g.fat}g
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isUserCustom && (
                  <button
                    type="button"
                    title="删除此自定义食物"
                    onClick={(e) => handleDeleteCustomFood(e, food)}
                    className="w-7 h-7 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                  >
                    🗑
                  </button>
                )}
                <span className="text-xs px-2.5 py-1 rounded-xl bg-[var(--color-calories)]/10 text-[var(--color-calories)] font-bold group-hover:bg-[var(--color-calories)] group-hover:text-white transition-all">
                  记账 / 份量 ›
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Selected Food Detail & Portion Selector */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-divider)] shadow-2xl space-y-4 max-w-md w-full text-[var(--color-text-primary)] max-h-[90vh] overflow-y-auto custom-scroll"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {CATEGORY_META[selectedFood.category]?.emoji ?? '🥗'}
                  </span>
                  <div>
                    <h3 className="font-bold text-base">{selectedFood.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {selectedFood.source === 'USER_CUSTOM'
                        ? '⭐ 个人自定义食物'
                        : selectedFood.source === 'USDA'
                        ? 'USDA 官方营养库'
                        : '中国食物成分表'}{' '}
                      · {selectedFood.per100g.calories} kcal ({Math.round(selectedFood.per100g.calories * 4.184)} kJ) / 100{unit}
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

              {/* Target Meal Selector */}
              <div className="flex items-center justify-between bg-[var(--color-bg-secondary)]/50 p-2 rounded-2xl">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  入账餐次：
                </span>
                <div className="flex bg-[var(--color-bg-secondary)] p-0.5 rounded-xl">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((m) => {
                    const meta = MEAL_META[m];
                    const isActive = targetMeal === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTargetMeal(m)}
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
              </div>

              {/* Liquid Unit Switcher: g vs ml */}
              <div className="flex items-center justify-between bg-[var(--color-bg-secondary)]/50 p-2 rounded-2xl">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  计算单位切换：
                </span>
                <div className="flex bg-[var(--color-bg-secondary)] p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUnit('g')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      unit === 'g'
                        ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    克 (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('ml')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      unit === 'ml'
                        ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    毫升 (ml)
                  </button>
                </div>
              </div>

              {/* Step 1: Input single portion weight */}
              <div className="bg-[var(--color-bg-secondary)]/50 p-3.5 rounded-2xl border border-[var(--color-divider)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--color-text-primary)]">
                    1. 输入单份重量 / 规格：
                  </label>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    单份克数自己输入
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="单份克数"
                      value={servingUnitWeight || ''}
                      onChange={(e) => handleServingUnitWeightChange(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-3 text-lg font-black text-[var(--color-calories)] rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/30 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-secondary)] pointer-events-none">
                      {unit}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">/ 份</span>
                </div>

                {/* Common Serving Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[var(--color-text-secondary)] mr-0.5">快捷预设:</span>
                  {selectedFood.commonServings?.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        setServingLabel(s.label.replace(/[0-9(gml)]/gi, '').trim() || '份');
                        handleServingUnitWeightChange(s.grams);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        servingUnitWeight === s.grams
                          ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)] shadow-xs'
                          : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                      }`}
                    >
                      {s.label} ({s.grams}{unit})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setServingLabel('份');
                      handleServingUnitWeightChange(100);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      servingUnitWeight === 100
                        ? 'bg-[var(--color-calories)] text-white border-[var(--color-calories)] shadow-xs'
                        : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-divider)]'
                    }`}
                  >
                    基准 100{unit}
                  </button>
                </div>
              </div>

              {/* Step 2: Select portion count and total weight */}
              <div className="bg-[var(--color-bg-secondary)]/50 p-3.5 rounded-2xl border border-[var(--color-divider)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    2. 食用份数与总重：
                  </span>
                  <div className="flex gap-1">
                    {[0.5, 1, 1.5, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleServingCountChange(num)}
                        className={`text-xs px-2 py-0.5 rounded-lg font-bold transition-all ${
                          servingCount === num
                            ? 'bg-[var(--color-calories)] text-white'
                            : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {num}份
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count Stepper & Total weight */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-[var(--color-bg-card)] p-1 rounded-2xl border border-[var(--color-divider)]">
                    <button
                      type="button"
                      onClick={() => handleServingCountChange(servingCount - (servingCount > 1 ? 1 : 0.5))}
                      className="w-8 h-8 rounded-xl bg-[var(--color-bg-secondary)] text-sm font-bold flex items-center justify-center active:scale-95"
                    >
                      －
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={servingCount}
                      onChange={(e) => handleServingCountChange(parseFloat(e.target.value) || 1)}
                      className="w-14 text-center font-bold text-base bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-[var(--color-text-secondary)] pr-1 font-semibold">
                      份
                    </span>
                    <button
                      type="button"
                      onClick={() => handleServingCountChange(servingCount + (servingCount >= 1 ? 1 : 0.5))}
                      className="w-8 h-8 rounded-xl bg-[var(--color-bg-secondary)] text-sm font-bold flex items-center justify-center active:scale-95"
                    >
                      ＋
                    </button>
                  </div>

                  {/* Total Weight direct input */}
                  <div className="flex-1 text-right">
                    <div className="text-[11px] text-[var(--color-text-secondary)]">计算总重</div>
                    <div className="flex items-baseline justify-end gap-1">
                      <input
                        type="number"
                        value={totalGrams}
                        onChange={(e) => handleTotalGramsChange(Number(e.target.value))}
                        className="w-20 text-right font-black text-xl text-[var(--color-text-primary)] bg-transparent border-b border-dashed border-[var(--color-divider)] focus:outline-none"
                      />
                      <span className="text-sm font-bold text-[var(--color-text-secondary)]">{unit}</span>
                    </div>
                  </div>
                </div>

                {/* Formula summary pill */}
                <div className="p-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] text-center text-xs font-semibold text-[var(--color-calories)]">
                  💡 {selectedFood.name}：单份 {servingUnitWeight}{unit} × {servingCount}份 ＝ 总重 {totalGrams} {unit}
                </div>
              </div>

              {/* Nutrition summary */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    折算能量与营养素：
                  </span>
                  <button
                    type="button"
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
                    <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                      kcal ({Math.round((parseInt(customCal) || 0) * 4.184)} kJ)
                    </span>
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

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAddMealEntry}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-calories)] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all"
              >
                ✅ 记录 {servingCount}份 ({totalGrams}{unit}) 到今日{MEAL_META[targetMeal].label}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Custom Food Creator */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-divider)] shadow-2xl space-y-3.5 max-w-md w-full text-[var(--color-text-primary)] max-h-[90vh] overflow-y-auto custom-scroll"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-bold text-base">自定义录入新食物</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-secondary)] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-1">
                  食物名称
                </label>
                <input
                  type="text"
                  placeholder="如：自制减脂三明治、高蛋白轻食..."
                  value={newFoodName}
                  onChange={(e) => {
                    setNewFoodName(e.target.value);
                    if (detectIsLiquid(e.target.value)) setNewFoodUnit('ml');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/30"
                />
              </div>

              {/* Unit Toggle: g vs ml */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--color-text-secondary)] font-medium">
                  计算单位
                </label>
                <div className="flex bg-[var(--color-bg-secondary)] p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewFoodUnit('g')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      newFoodUnit === 'g'
                        ? 'bg-[var(--color-calories)] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    固体 · 克 (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFoodUnit('ml')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      newFoodUnit === 'ml'
                        ? 'bg-[var(--color-calories)] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    液体 · 毫升 (ml)
                  </button>
                </div>
              </div>

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

              <div>
                <label className="text-xs text-[var(--color-text-secondary)] font-medium block mb-1">
                  食用份量 ({newFoodUnit})
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={newFoodGrams}
                  onChange={(e) => setNewFoodGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)] text-sm font-bold text-center"
                />
              </div>

              {/* Requirement: Energy in kJ with auto kcal conversion */}
              <div className="bg-[var(--color-bg-secondary)]/60 p-3 rounded-2xl border border-[var(--color-divider)]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-primary)]">
                    能量 (kJ 千焦)
                  </label>
                  <div className="text-xs font-black text-[var(--color-calories)] bg-[var(--color-calories)]/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">自动换算:</span>
                    <span>{newFoodCal ? `≈ ${newFoodCal} kcal` : '-- kcal'}</span>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="如 840 (包装标签能量数值)"
                    value={newFoodKj}
                    onChange={(e) => handleKjChange(e.target.value)}
                    className="w-full px-3 py-2 text-base font-bold text-[var(--color-calories)] rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-divider)] pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--color-calories)]/30"
                  />
                  <span className="absolute right-3 text-xs font-bold text-[var(--color-text-secondary)] pointer-events-none">
                    kJ
                  </span>
                </div>
              </div>

              {/* 3 Macros */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1 text-center font-medium">
                    蛋白质 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 15"
                    value={newFoodProtein}
                    onChange={(e) => setNewFoodProtein(e.target.value)}
                    className="w-full py-1.5 px-2 text-center text-sm font-bold text-[#FB7185] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1 text-center font-medium">
                    碳水化合物 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 25"
                    value={newFoodCarbs}
                    onChange={(e) => setNewFoodCarbs(e.target.value)}
                    className="w-full py-1.5 px-2 text-center text-sm font-bold text-[#10B981] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--color-text-secondary)] block mb-1 text-center font-medium">
                    脂肪 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 5"
                    value={newFoodFat}
                    onChange={(e) => setNewFoodFat(e.target.value)}
                    className="w-full py-1.5 px-2 text-center text-sm font-bold text-[#FBBF24] rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-divider)]"
                  />
                </div>
              </div>

              {/* Optional Record to Meal checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)] pt-1">
                <input
                  type="checkbox"
                  checked={recordAfterCreate}
                  onChange={(e) => setRecordAfterCreate(e.target.checked)}
                  className="rounded text-[var(--color-calories)]"
                />
                <span>同时记账到今日餐食</span>
              </label>

              {recordAfterCreate && (
                <div className="flex gap-1.5 bg-[var(--color-bg-secondary)] p-1 rounded-xl">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((m) => {
                    const meta = MEAL_META[m];
                    const isActive = targetMeal === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTargetMeal(m)}
                        className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
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
              )}

              <button
                type="button"
                onClick={handleCreateFood}
                className="w-full py-3 rounded-2xl bg-[var(--color-calories)] text-white font-bold text-sm shadow-md hover:opacity-95"
              >
                ✅ 保存到食物库
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
