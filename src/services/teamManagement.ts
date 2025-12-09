import type { Employee, WeeklyPattern } from '../types';
import { addEmployee, updateEmployee, removeEmployee, getAllEmployees, getLatestTeamChange, loadData, saveData } from './storage';
import { generateAllSchedules, generateEmployeeSchedule } from './schedule';
import { createDefaultPattern } from '../utils/scheduleUtils';

/**
 * Create a new employee with default pattern
 */
export function createEmployee(name: string, pattern?: WeeklyPattern): Employee {
  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    weeklyPattern: pattern || createDefaultPattern(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Add a new employee to the team
 */
export function addTeamMember(name: string, pattern?: WeeklyPattern): Employee {
  const employee = createEmployee(name, pattern);
  addEmployee(employee);
  generateAllSchedules([employee]);
  return employee;
}

/**
 * Update employee name
 */
export function updateTeamMemberName(employeeId: string, newName: string): void {
  updateEmployee(employeeId, { name: newName });
}

/**
 * Update employee schedule pattern
 */
export function updateTeamMemberPattern(employeeId: string, pattern: WeeklyPattern): void {
  updateEmployee(employeeId, { weeklyPattern: pattern });
  
  // Record pattern change
  const data = loadData();
  data.teamChanges.push({
    id: `change-${Date.now()}`,
    type: 'schedule_pattern_changed',
    employeeId: employeeId,
    timestamp: new Date().toISOString(),
    changes: { pattern },
  });
  saveData(data);
  
  // Regenerate schedule for this employee
  const employee = getAllEmployees().find(emp => emp.id === employeeId);
  if (employee) {
    generateEmployeeSchedule(employee);
  }
}

/**
 * Remove team member
 */
export function removeTeamMember(employeeId: string): void {
  removeEmployee(employeeId);
}

/**
 * Get change timestamp for an employee (when their pattern was last changed)
 */
export function getEmployeeChangeTimestamp(employeeId: string): string | undefined {
  const change = getLatestTeamChange(employeeId);
  if (change && (change.type === 'schedule_pattern_changed' || change.type === 'employee_added')) {
    return change.timestamp;
  }
  return undefined;
}

