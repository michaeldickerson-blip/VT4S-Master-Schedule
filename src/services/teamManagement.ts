import type { Employee, WeeklyPattern } from '../types';
import { addEmployee, updateEmployee, removeEmployee, getAllEmployees, getLatestTeamChange } from './storage';
import { supabase, TABLES } from './supabase';
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
export async function addTeamMember(name: string, pattern?: WeeklyPattern): Promise<Employee> {
  const employee = createEmployee(name, pattern);
  await addEmployee(employee);
  await generateAllSchedules([employee]);
  return employee;
}

/**
 * Update employee name
 */
export async function updateTeamMemberName(employeeId: string, newName: string): Promise<void> {
  await updateEmployee(employeeId, { name: newName });
}

/**
 * Update employee schedule pattern
 */
export async function updateTeamMemberPattern(employeeId: string, pattern: WeeklyPattern): Promise<void> {
  await updateEmployee(employeeId, { weeklyPattern: pattern });
  
  // Record pattern change
  await supabase.from(TABLES.TEAM_CHANGES).insert({
    id: `change-${Date.now()}`,
    type: 'schedule_pattern_changed',
    employee_id: employeeId,
    timestamp: new Date().toISOString(),
    changes: { pattern },
  });
  
  // Regenerate schedule for this employee
  const allEmployees = await getAllEmployees();
  const employee = allEmployees.find(emp => emp.id === employeeId);
  if (employee) {
    await generateEmployeeSchedule(employee);
  }
}

/**
 * Remove team member
 */
export async function removeTeamMember(employeeId: string): Promise<void> {
  await removeEmployee(employeeId);
}

/**
 * Get change timestamp for an employee (when their pattern was last changed)
 */
export async function getEmployeeChangeTimestamp(employeeId: string): Promise<string | undefined> {
  const change = await getLatestTeamChange(employeeId);
  if (change && (change.type === 'schedule_pattern_changed' || change.type === 'employee_added')) {
    return change.timestamp;
  }
  return undefined;
}

