import { format, isToday, isYesterday, subDays, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDateKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  if (isToday(date)) return '今天';
  if (isYesterday(date)) return '昨天';
  return format(date, 'M月d日 · EEEE', { locale: zhCN });
}

export function formatShortDate(date: Date): string {
  return format(date, 'M/d');
}

export function getWeekDates(centerDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const dayOfWeek = centerDate.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDays(centerDate, mondayOffset);
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(monday, i));
  }
  return dates;
}

export function getDayLabel(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[date.getDay()] ?? '';
}

export { subDays, addDays, isToday, format };
