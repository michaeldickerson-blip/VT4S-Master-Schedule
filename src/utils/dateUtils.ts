import { addDays, addMonths, format, isBefore, getDay, startOfWeek } from 'date-fns';

export const WEEK_START_DAY = 0; // Sunday (0 = Sunday, 6 = Saturday)

/**
 * Get the start of a week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  // Use date-fns startOfWeek with Sunday as the start
  return startOfWeek(date, { weekStartsOn: 0 });
}

/**
 * Get the end of a week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  return addDays(weekStart, 6);
}

/**
 * Get all dates in a week (Sunday through Saturday)
 */
export function getWeekDates(date: Date): Date[] {
  const weekStart = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Get all weeks for the next 6 months from today
 */
export function getSixMonthsOfWeeks(): Date[] {
  const today = new Date();
  const sixMonthsFromNow = addMonths(today, 6);
  const weeks: Date[] = [];
  
  let currentWeekStart = getWeekStart(today);
  
  while (currentWeekStart <= sixMonthsFromNow) {
    weeks.push(currentWeekStart);
    currentWeekStart = addDays(currentWeekStart, 7);
  }
  
  return weeks;
}

/**
 * Get all dates for the next 6 months
 */
export function getSixMonthsOfDates(): Date[] {
  const today = new Date();
  const sixMonthsFromNow = addMonths(today, 6);
  const dates: Date[] = [];
  
  let currentDate = new Date(today);
  
  while (currentDate <= sixMonthsFromNow) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Format date as ISO string
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return isBefore(checkDate, today);
}

/**
 * Check if a date is today or in the future
 */
export function isFutureOrToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return !isBefore(checkDate, today);
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  const day = getDay(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

/**
 * Get day of week index (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return getDay(date);
}

