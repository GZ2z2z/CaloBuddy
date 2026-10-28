import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { getWeekDates, getDayLabel, formatDateKey } from '@/utils/date';
import { addDays, subDays, format } from 'date-fns';

interface DateSelectorProps {
  onOpenSettings?: () => void;
  onExport?: () => void;
}

export function DateSelector({ onOpenSettings, onExport }: DateSelectorProps) {
  const { selectedDate, setSelectedDate, theme, setTheme } = useAppStore();
  const currentDate = useMemo(() => new Date(selectedDate), [selectedDate]);
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handlePrevDay = () => {
    const prev = subDays(currentDate, 1);
    setSelectedDate(formatDateKey(prev));
  };

  const handleNextDay = () => {
    const next = addDays(currentDate, 1);
    setSelectedDate(formatDateKey(next));
  };

  const formattedDateStr = useMemo(() => {
    return format(currentDate, 'yyyy.MM.dd');
  }, [currentDate]);

  return (
    <div className="mb-3">
      {/* Top action row */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="w-8 h-8 flex items-center justify-center rounded-full text-base text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-95 transition-all"
            title="前一天"
          >
            ‹
          </button>

          {/* Date dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[15px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-98 transition-all"
            >
              <span>{formattedDateStr}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">▾</span>
            </button>

            {showDatePicker && (
              <div className="absolute left-0 top-full mt-1.5 z-50 bg-[var(--color-bg-card)] rounded-2xl p-3 shadow-xl border border-[var(--color-divider)] flex flex-col gap-2 min-w-[200px]">
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] px-1">选择日期</div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setShowDatePicker(false);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--color-bg-secondary)] text-sm border border-[var(--color-divider)]"
                />
                <button
                  onClick={() => {
                    setSelectedDate(formatDateKey(new Date()));
                    setShowDatePicker(false);
                  }}
                  className="text-xs py-1.5 rounded-lg bg-[var(--color-calories)]/10 text-[var(--color-calories)] font-medium hover:bg-[var(--color-calories)]/20 transition-colors"
                >
                  回到今天
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="w-8 h-8 flex items-center justify-center rounded-full text-base text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-95 transition-all"
            title="后一天"
          >
            ›
          </button>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1">
          {onExport && (
            <button
              onClick={onExport}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] active:scale-95 transition-all text-sm"
              title="分享 / 导出"
            >
              📤
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] active:scale-95 transition-all text-sm"
            title={`主题: ${theme === 'system' ? '跟随系统' : theme === 'light' ? '浅色' : '暗色'}`}
          >
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🌓'}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] active:scale-95 transition-all text-sm"
              title="设置"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Week day strip (Matching Thin Mint App screenshot) */}
      <div className="flex items-center justify-between px-1 py-1">
        {weekDates.map((date) => {
          const key = formatDateKey(date);
          const isSelected = key === selectedDate;
          const label = getDayLabel(date);
          const dayNum = date.getDate();

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              className="flex-1 flex flex-col items-center py-1 transition-all group"
            >
              {/* Day label */}
              <span
                className={`text-[13px] font-medium transition-colors ${
                  isSelected
                    ? 'text-[var(--color-calories)] font-bold'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {label}
              </span>

              {/* Day number / capsule indicator */}
              <div
                className={`mt-1 w-7 h-7 rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#A7F3D0] dark:bg-[#064E3B] text-[#065F46] dark:text-[#A7F3D0] shadow-sm scale-105'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {dayNum}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
