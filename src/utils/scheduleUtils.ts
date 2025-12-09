import { parseISO } from 'date-fns';
import { formatDateISO, getDayOfWeek } from './dateUtils';
import type { Employee, ScheduleEntry, WeeklyPattern, ShiftConfig } from '../types';

/**
 * Get shift config for a specific day of week from weekly pattern
 */
export function getShiftForDay(pattern: WeeklyPattern, dayOfWeek: number): ShiftConfig {
  const dayMap: Record<number, keyof WeeklyPattern> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  
  const dayKey = dayMap[dayOfWeek];
  return pattern[dayKey];
}

/**
 * Generate schedule entry for a date based on employee's pattern
 */
export function generateScheduleEntry(
  employee: Employee,
  date: Date,
  changeTimestamp?: string
): ScheduleEntry {
  // If there's a change timestamp, only apply pattern if date is after the change
  if (changeTimestamp) {
    const changeDate = parseISO(changeTimestamp);
    if (date < changeDate) {
      // Return empty entry - should be filled from historical data
      return {
        date: formatDateISO(date),
        shift: 'OFF',
        hours: 0,
      };
    }
  }
  
  const dayOfWeek = getDayOfWeek(date);
  const shiftConfig = getShiftForDay(employee.weeklyPattern, dayOfWeek);
  
  return {
    date: formatDateISO(date),
    shift: shiftConfig.shift,
    hours: shiftConfig.hours,
  };
}

/**
 * Create default weekly pattern (Mon-Fri: 8-5 CT, Sat-Sun: OFF)
 */
export function createDefaultPattern(): WeeklyPattern {
  return {
    monday: { shift: '8-5 CT', hours: 8 },
    tuesday: { shift: '8-5 CT', hours: 8 },
    wednesday: { shift: '8-5 CT', hours: 8 },
    thursday: { shift: '8-5 CT', hours: 8 },
    friday: { shift: '8-5 CT', hours: 8 },
    saturday: { shift: 'OFF', hours: 0 },
    sunday: { shift: 'OFF', hours: 0 },
  };
}

/**
 * Create pattern from CSV example data
 */
export function createPatternFromCSV(shiftPattern: string): WeeklyPattern {
  const defaultPattern = createDefaultPattern();
  
  // If pattern is "8-5 CT" or "11-8 CT", apply to weekdays
  if (shiftPattern.includes('8-5 CT')) {
    return {
      ...defaultPattern,
      monday: { shift: '8-5 CT', hours: 8 },
      tuesday: { shift: '8-5 CT', hours: 8 },
      wednesday: { shift: '8-5 CT', hours: 8 },
      thursday: { shift: '8-5 CT', hours: 8 },
      friday: { shift: '8-5 CT', hours: 8 },
    };
  } else if (shiftPattern.includes('11-8 CT')) {
    return {
      ...defaultPattern,
      monday: { shift: '11-8 CT', hours: 8 },
      tuesday: { shift: '11-8 CT', hours: 8 },
      wednesday: { shift: '11-8 CT', hours: 8 },
      thursday: { shift: '11-8 CT', hours: 8 },
      friday: { shift: '11-8 CT', hours: 8 },
    };
  }
  
  return defaultPattern;
}

