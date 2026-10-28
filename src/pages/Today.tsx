import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { DateSelector } from '@/components/DateSelector';
import { CalorieCard } from '@/components/CalorieCard';
import { MealCard } from '@/components/MealCard';
import { WaterTracker } from '@/components/WaterTracker';
import { FoodSearchPanel } from '@/components/FoodSearchPanel';
import { FloatingActionBar, AiQuickDialog } from '@/components/FloatingActionBar';
import { QuickMealModal } from '@/components/QuickMealModal';
import { parseFoodText } from '@/utils/aiParser';
import type { MealType } from '@/types';
import toast from 'react-hot-toast';

export function TodayPage() {
  const {
    profile,
    todayLog,
    setCurrentTab,
    updateExerciseCalories,
    addMealEntry,
  } = useAppStore();

  const [searchMealType, setSearchMealType] = useState<MealType | null>(null);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showQuickMealModal, setShowQuickMealModal] = useState(false);

  if (!profile || !todayLog) return null;

  const meals = todayLog.meals;
  const allEntries = [
    ...meals.breakfast,
    ...meals.lunch,
    ...meals.dinner,
    ...meals.snacks,
  ];

  const totalCalories = allEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = allEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = allEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = allEntries.reduce((s, e) => s + e.fat, 0);

  const handleAiParsedFood = async (mealType: MealType, text: string) => {
    const parsedEntries = await parseFoodText(text);
    if (parsedEntries.length === 0) {
      toast.error('未能识别食物，请尝试直接搜索录入');
      return;
    }
    for (const entry of parsedEntries) {
      await addMealEntry(mealType, entry);
    }
    toast.success(`已智能记录 ${parsedEntries.length} 种食物！`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto px-4 pt-3 pb-24"
    >
      {/* Date header & Week bar */}
      <DateSelector
        onOpenSettings={() => setCurrentTab('settings')}
        onExport={() => setCurrentTab('settings')}
      />

      {/* iPad Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column on Desktop / Top on Mobile: Dashboard & Water */}
        <div className="md:col-span-5 space-y-4">
          <CalorieCard
            consumed={totalCalories}
            target={todayLog.targetCalories}
            exercise={todayLog.exerciseCalories ?? 0}
            protein={{ current: totalProtein, target: profile.targetProtein }}
            carbs={{ current: totalCarbs, target: profile.targetCarbs }}
            fat={{ current: totalFat, target: profile.targetFat }}
            onUpdateExercise={(cals) => updateExerciseCalories(cals)}
          />

          <WaterTracker />
        </div>

        {/* Right Column on Desktop / Bottom on Mobile: Meals List */}
        <div className="md:col-span-7 space-y-3">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((mealType) => (
            <MealCard
              key={mealType}
              mealType={mealType}
              entries={meals[mealType]}
              targetCalories={todayLog.targetCalories}
              onAddClick={() => setSearchMealType(mealType)}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Pill matching 薄荷健康 screenshot */}
      <FloatingActionBar
        onQuickFastLog={() => setShowQuickMealModal(true)}
        onQuickSearch={() => setSearchMealType('lunch')}
        onQuickScan={() => setCurrentTab('scan')}
        onQuickAi={() => setShowAiDialog(true)}
      />

      {/* Quick Meal Direct Input Modal */}
      <QuickMealModal
        isOpen={showQuickMealModal}
        initialMealType="lunch"
        onClose={() => setShowQuickMealModal(false)}
      />

      {/* Food search modal panel */}
      {searchMealType && (
        <FoodSearchPanel
          mealType={searchMealType}
          onClose={() => setSearchMealType(null)}
        />
      )}

      {/* AI Quick text dialog */}
      <AiQuickDialog
        isOpen={showAiDialog}
        onClose={() => setShowAiDialog(false)}
        onAddParsedFood={handleAiParsedFood}
      />
    </motion.div>
  );
}
