import { parseISO } from 'date-fns';
import { getSixMonthsOfDates } from '../utils/dateUtils';
import { generateScheduleEntry } from '../utils/scheduleUtils';
import type { Employee, ScheduleEntry } from '../types';
import { getScheduleEntries, saveScheduleEntries, getLatestTeamChange, getChangeRequests, getAllEmployees, updateChangeRequest } from './storage';

/**
 * Generate or update schedule for an employee
 */
export function generateEmployeeSchedule(employee: Employee): ScheduleEntry[] {
  const dates = getSixMonthsOfDates();
  const existingEntries = getScheduleEntries(employee.id);
  const latestChange = getLatestTeamChange(employee.id);
  const changeTimestamp = latestChange?.timestamp;
  
  // Get all approved change requests for this employee
  const allRequests = getChangeRequests();
  const approvedRequests = allRequests.filter(
    req => req.employeeId === employee.id && req.status === 'approved'
  );
  
  const entries: ScheduleEntry[] = [];
  const existingMap = new Map<string, ScheduleEntry>();
  const approvedChangesMap = new Map<string, { type: 'time_off' | 'swap' | 'custom_hours'; swapFrom?: string; swapTo?: string; customShift?: string; customHours?: number }>();
  
  // Create map of existing entries
  existingEntries.forEach(entry => {
    existingMap.set(entry.date, entry);
  });
  
  // Create map of approved changes
  const swapRequests: Array<{ swapFrom: string; swapTo: string }> = [];
  approvedRequests.forEach(request => {
    if (request.type === 'time_off') {
      approvedChangesMap.set(request.date, { type: 'time_off' });
    } else if (request.type === 'custom_hours') {
      approvedChangesMap.set(request.date, { type: 'custom_hours', customShift: request.customShift, customHours: request.customHours });
    } else if (request.type === 'swap' && request.swapFrom && request.swapTo) {
      approvedChangesMap.set(request.swapFrom, { type: 'swap', swapFrom: request.swapFrom, swapTo: request.swapTo });
      approvedChangesMap.set(request.swapTo, { type: 'swap', swapFrom: request.swapFrom, swapTo: request.swapTo });
      swapRequests.push({ swapFrom: request.swapFrom, swapTo: request.swapTo });
    }
  });
  
  // Process swaps first to get the correct shift values
  swapRequests.forEach(swap => {
    const fromEntry = existingMap.get(swap.swapFrom);
    const toEntry = existingMap.get(swap.swapTo);
    if (fromEntry && toEntry) {
      // Swap the shifts
      const tempShift = fromEntry.shift;
      const tempHours = fromEntry.hours;
      fromEntry.shift = toEntry.shift;
      fromEntry.hours = toEntry.hours;
      fromEntry.isSwapped = true;
      toEntry.shift = tempShift;
      toEntry.hours = tempHours;
      toEntry.isSwapped = true;
    } else if (fromEntry && !toEntry) {
      // "To" entry doesn't exist, generate it and swap
      const toDate = parseISO(swap.swapTo);
      const toEntry = generateScheduleEntry(employee, toDate, changeTimestamp);
      const tempShift = fromEntry.shift;
      const tempHours = fromEntry.hours;
      fromEntry.shift = toEntry.shift;
      fromEntry.hours = toEntry.hours;
      fromEntry.isSwapped = true;
      toEntry.shift = tempShift;
      toEntry.hours = tempHours;
      toEntry.isSwapped = true;
      existingMap.set(swap.swapTo, toEntry);
    } else if (!fromEntry && toEntry) {
      // "From" entry doesn't exist, generate it and swap
      const fromDate = parseISO(swap.swapFrom);
      const fromEntry = generateScheduleEntry(employee, fromDate, changeTimestamp);
      const tempShift = fromEntry.shift;
      const tempHours = fromEntry.hours;
      fromEntry.shift = toEntry.shift;
      fromEntry.hours = toEntry.hours;
      fromEntry.isSwapped = true;
      toEntry.shift = tempShift;
      toEntry.hours = tempHours;
      toEntry.isSwapped = true;
      existingMap.set(swap.swapFrom, fromEntry);
    } else {
      // Neither exists, generate both and swap
      const fromDate = parseISO(swap.swapFrom);
      const toDate = parseISO(swap.swapTo);
      const fromEntry = generateScheduleEntry(employee, fromDate, changeTimestamp);
      const toEntry = generateScheduleEntry(employee, toDate, changeTimestamp);
      const tempShift = fromEntry.shift;
      const tempHours = fromEntry.hours;
      fromEntry.shift = toEntry.shift;
      fromEntry.hours = toEntry.hours;
      fromEntry.isSwapped = true;
      toEntry.shift = tempShift;
      toEntry.hours = tempHours;
      toEntry.isSwapped = true;
      existingMap.set(swap.swapFrom, fromEntry);
      existingMap.set(swap.swapTo, toEntry);
    }
  });
  
  dates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    const existingEntry = existingMap.get(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDate = parseISO(dateStr);
    const approvedChange = approvedChangesMap.get(dateStr);
    
    // Preserve existing entries if:
    // 1. They are in the past (historical)
    // 2. They have approved changes (isTimeOff, isSwapped, or isCustomHours flags)
    // 3. There's an approved change request for this date
    if (existingEntry && (entryDate < today || existingEntry.isTimeOff || existingEntry.isSwapped || existingEntry.isCustomHours || approvedChange)) {
      // If there's an approved change, ensure the entry reflects it
      if (approvedChange) {
        if (approvedChange.type === 'time_off') {
          existingEntry.shift = 'OFF';
          existingEntry.hours = 0;
          existingEntry.isTimeOff = true;
          delete existingEntry.isCustomHours;
        } else if (approvedChange.type === 'custom_hours' && approvedChange.customShift && approvedChange.customHours !== undefined) {
          existingEntry.shift = approvedChange.customShift;
          existingEntry.hours = approvedChange.customHours;
          existingEntry.isCustomHours = true;
          delete existingEntry.isTimeOff;
        }
      }
      entries.push(existingEntry);
    } else if (approvedChange) {
      if (approvedChange.type === 'time_off') {
        // Apply approved time off even if entry doesn't exist yet
        entries.push({
          date: dateStr,
          shift: 'OFF',
          hours: 0,
          isTimeOff: true,
        });
      } else if (approvedChange.type === 'custom_hours' && approvedChange.customShift && approvedChange.customHours !== undefined) {
        // Apply approved custom hours even if entry doesn't exist yet
        entries.push({
          date: dateStr,
          shift: approvedChange.customShift,
          hours: approvedChange.customHours,
          isCustomHours: true,
        });
      } else {
        // Generate new entry based on pattern
        const entry = generateScheduleEntry(employee, date, changeTimestamp);
        entries.push(entry);
      }
    } else {
      // Generate new entry based on pattern
      const entry = generateScheduleEntry(employee, date, changeTimestamp);
      entries.push(entry);
    }
  });
  
  // Save and return
  saveScheduleEntries(employee.id, entries);
  return entries;
}

/**
 * Generate schedules for all employees
 */
export function generateAllSchedules(employees: Employee[]): void {
  employees.forEach(employee => {
    generateEmployeeSchedule(employee);
  });
}

/**
 * Get schedule entry for a specific employee and date
 */
export function getScheduleEntry(employeeId: string, date: string): ScheduleEntry | undefined {
  const entries = getScheduleEntries(employeeId);
  return entries.find(entry => entry.date === date);
}

/**
 * Update schedule entry
 */
export function updateScheduleEntry(employeeId: string, entry: ScheduleEntry): void {
  const entries = getScheduleEntries(employeeId);
  const index = entries.findIndex(e => e.date === entry.date);
  
  if (index !== -1) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  
  saveScheduleEntries(employeeId, entries);
}

/**
 * Revert a schedule change back to the original pattern
 */
export function revertScheduleChange(employeeId: string, date: string): void {
  const entry = getScheduleEntry(employeeId, date);
  if (!entry) return;
  
  const employee = getAllEmployees().find(emp => emp.id === employeeId);
  if (!employee) return;
  
  const latestChange = getLatestTeamChange(employeeId);
  const changeTimestamp = latestChange?.timestamp;
  const dateObj = parseISO(date);
  
  // If it's a swap, we need to revert both days
  if (entry.isSwapped) {
    // Find the swap request to get both dates
    const requests = getChangeRequests();
    const swapRequest = requests.find(
      req => 
        req.employeeId === employeeId &&
        req.type === 'swap' &&
        req.status === 'approved' &&
        (req.swapFrom === date || req.swapTo === date)
    );
    
    if (swapRequest && swapRequest.swapFrom && swapRequest.swapTo) {
      // Revert both days in the swap
      const fromDate = parseISO(swapRequest.swapFrom);
      const toDate = parseISO(swapRequest.swapTo);
      
      const fromEntry = generateScheduleEntry(employee, fromDate, changeTimestamp);
      fromEntry.date = swapRequest.swapFrom;
      delete fromEntry.isSwapped;
      
      const toEntry = generateScheduleEntry(employee, toDate, changeTimestamp);
      toEntry.date = swapRequest.swapTo;
      delete toEntry.isSwapped;
      
      updateScheduleEntry(employeeId, fromEntry);
      updateScheduleEntry(employeeId, toEntry);
      
      // Mark the request as rejected (reverted)
      updateChangeRequest(swapRequest.id, { status: 'rejected' });
    } else {
      // Just revert this one day if we can't find the swap
      const restoredEntry = generateScheduleEntry(employee, dateObj, changeTimestamp);
      restoredEntry.date = date;
      delete restoredEntry.isSwapped;
      updateScheduleEntry(employeeId, restoredEntry);
    }
  } else if (entry.isTimeOff) {
    // If it's a time off, restore from pattern
    const restoredEntry = generateScheduleEntry(employee, dateObj, changeTimestamp);
    restoredEntry.date = date;
    delete restoredEntry.isTimeOff;
    updateScheduleEntry(employeeId, restoredEntry);
    
    // Mark the time off request as rejected (reverted)
    const requests = getChangeRequests();
    const timeOffRequest = requests.find(
      req => 
        req.employeeId === employeeId &&
        req.type === 'time_off' &&
        req.status === 'approved' &&
        req.date === date
    );
    if (timeOffRequest) {
      updateChangeRequest(timeOffRequest.id, { status: 'rejected' });
    }
  } else if (entry.isCustomHours) {
    // If it's custom hours, restore from pattern
    const restoredEntry = generateScheduleEntry(employee, dateObj, changeTimestamp);
    restoredEntry.date = date;
    delete restoredEntry.isCustomHours;
    updateScheduleEntry(employeeId, restoredEntry);
    
    // Mark the custom hours request as rejected (reverted)
    const requests = getChangeRequests();
    const customHoursRequest = requests.find(
      req => 
        req.employeeId === employeeId &&
        req.type === 'custom_hours' &&
        req.status === 'approved' &&
        req.date === date
    );
    if (customHoursRequest) {
      updateChangeRequest(customHoursRequest.id, { status: 'rejected' });
    }
  }
}

/**
 * Apply approved change request to schedule
 */
export function applyApprovedChange(
  employeeId: string,
  request: { type: 'time_off' | 'swap' | 'custom_hours'; date: string; swapFrom?: string; swapTo?: string; customShift?: string; customHours?: number }
): void {
  if (request.type === 'time_off') {
    let entry = getScheduleEntry(employeeId, request.date);
    if (!entry) {
      // Create new entry if it doesn't exist
      entry = {
        date: request.date,
        shift: 'OFF',
        hours: 0,
        isTimeOff: true,
      };
    } else {
      entry.shift = 'OFF';
      entry.hours = 0;
      entry.isTimeOff = true;
      delete entry.isCustomHours; // Remove custom hours flag if it exists
    }
    updateScheduleEntry(employeeId, entry);
  } else if (request.type === 'custom_hours' && request.customShift && request.customHours !== undefined) {
    let entry = getScheduleEntry(employeeId, request.date);
    if (!entry) {
      // Create new entry if it doesn't exist
      entry = {
        date: request.date,
        shift: request.customShift,
        hours: request.customHours,
        isCustomHours: true,
      };
    } else {
      entry.shift = request.customShift;
      entry.hours = request.customHours;
      entry.isCustomHours = true;
      delete entry.isTimeOff; // Remove time off flag if it exists
      delete entry.isSwapped; // Remove swapped flag if it exists
    }
    updateScheduleEntry(employeeId, entry);
  } else if (request.type === 'swap' && request.swapFrom && request.swapTo) {
    const fromEntry = getScheduleEntry(employeeId, request.swapFrom);
    const toEntry = getScheduleEntry(employeeId, request.swapTo);
    
    if (fromEntry && toEntry) {
      // Swap the shifts
      const tempShift = fromEntry.shift;
      const tempHours = fromEntry.hours;
      
      fromEntry.shift = toEntry.shift;
      fromEntry.hours = toEntry.hours;
      fromEntry.isSwapped = true;
      
      toEntry.shift = tempShift;
      toEntry.hours = tempHours;
      toEntry.isSwapped = true;
      
      updateScheduleEntry(employeeId, fromEntry);
      updateScheduleEntry(employeeId, toEntry);
    }
  }
}

