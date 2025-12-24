import { supabase, TABLES } from './supabase';
import type { AppData, Employee, ScheduleEntry, ScheduleChangeRequest, User, TeamChange } from '../types';

/**
 * Simple hash function for passwords (not secure, but sufficient for local storage)
 */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Load all data from Supabase
 */
export async function loadData(): Promise<AppData> {
  try {
    // Load all tables in parallel
    const [employeesResult, scheduleEntriesResult, changeRequestsResult, usersResult, teamChangesResult] = await Promise.all([
      supabase.from(TABLES.EMPLOYEES).select('*'),
      supabase.from(TABLES.SCHEDULE_ENTRIES).select('*'),
      supabase.from(TABLES.CHANGE_REQUESTS).select('*'),
      supabase.from(TABLES.USERS).select('*'),
      supabase.from(TABLES.TEAM_CHANGES).select('*'),
    ]);

    // Check for errors
    if (employeesResult.error) throw employeesResult.error;
    if (scheduleEntriesResult.error) throw scheduleEntriesResult.error;
    if (changeRequestsResult.error) throw changeRequestsResult.error;
    if (usersResult.error) throw usersResult.error;
    if (teamChangesResult.error) throw teamChangesResult.error;

    // Convert database rows to TypeScript types
    const employees: Employee[] = (employeesResult.data || []).map(row => ({
      id: row.id,
      name: row.name,
      weeklyPattern: row.weekly_pattern,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Group schedule entries by employee ID
    const scheduleEntries: Record<string, ScheduleEntry[]> = {};
    (scheduleEntriesResult.data || []).forEach(row => {
      if (!scheduleEntries[row.employee_id]) {
        scheduleEntries[row.employee_id] = [];
      }
      scheduleEntries[row.employee_id].push({
        date: row.date,
        shift: row.shift,
        hours: row.hours,
        isSwapped: row.is_swapped || undefined,
        isTimeOff: row.is_time_off || undefined,
        isCustomHours: row.is_custom_hours || undefined,
      });
    });

    const changeRequests: ScheduleChangeRequest[] = (changeRequestsResult.data || []).map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      type: row.type,
      date: row.date || '',
      swapFrom: row.swap_from || undefined,
      swapTo: row.swap_to || undefined,
      customShift: row.custom_shift || undefined,
      customHours: row.custom_hours || undefined,
      status: row.status,
      requestedAt: row.requested_at,
      approvedBy: row.approved_by || undefined,
      approvedAt: row.approved_at || undefined,
    }));

    const users: User[] = (usersResult.data || []).map(row => ({
      id: row.id,
      username: row.username,
      role: row.role,
      passwordHash: row.password_hash,
      employeeId: row.employee_id || undefined,
    }));

    const teamChanges: TeamChange[] = (teamChangesResult.data || []).map(row => ({
      id: row.id,
      type: row.type,
      employeeId: row.employee_id || undefined,
      timestamp: row.timestamp,
      changes: row.changes,
    }));

    return {
      employees,
      scheduleEntries,
      changeRequests,
      users,
      teamChanges,
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    // Return default data structure on error
    return {
      employees: [],
      scheduleEntries: {},
      changeRequests: [],
      users: [],
      teamChanges: [],
    };
  }
}

/**
 * Initialize default admin user if no users exist
 */
export async function initializeDefaultAdmin(): Promise<void> {
  const { data, error } = await supabase.from(TABLES.USERS).select('id').limit(1);
  
  if (error) {
    console.error('Error checking users:', error);
    return;
  }

  if (!data || data.length === 0) {
    const adminUser = {
      id: 'admin-1',
      username: 'admin',
      role: 'admin',
      password_hash: hashPassword('admin'),
      employee_id: null,
    };

    const { error: insertError } = await supabase.from(TABLES.USERS).insert(adminUser);
    if (insertError) {
      console.error('Error creating default admin:', insertError);
    }
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(employeeId: string): Promise<Employee | undefined> {
  const { data, error } = await supabase
    .from(TABLES.EMPLOYEES)
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    name: data.name,
    weeklyPattern: data.weekly_pattern,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get all employees
 */
export async function getAllEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from(TABLES.EMPLOYEES)
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    weeklyPattern: row.weekly_pattern,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Add employee
 */
export async function addEmployee(employee: Employee): Promise<void> {
  const { error: employeeError } = await supabase.from(TABLES.EMPLOYEES).insert({
    id: employee.id,
    name: employee.name,
    weekly_pattern: employee.weeklyPattern,
    created_at: employee.createdAt,
    updated_at: employee.updatedAt,
  });

  if (employeeError) {
    console.error('Error adding employee:', employeeError);
    throw employeeError;
  }

  // Record team change
  await supabase.from(TABLES.TEAM_CHANGES).insert({
    id: `change-${Date.now()}`,
    type: 'employee_added',
    employee_id: employee.id,
    timestamp: new Date().toISOString(),
    changes: { name: employee.name },
  });
}

/**
 * Update employee
 */
export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
  // Get current employee to record changes
  const currentEmployee = await getEmployeeById(employeeId);
  if (!currentEmployee) {
    throw new Error('Employee not found');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.weeklyPattern !== undefined) updateData.weekly_pattern = updates.weeklyPattern;

  const { error } = await supabase
    .from(TABLES.EMPLOYEES)
    .update(updateData)
    .eq('id', employeeId);

  if (error) {
    console.error('Error updating employee:', error);
    throw error;
  }

  // Record team change
  await supabase.from(TABLES.TEAM_CHANGES).insert({
    id: `change-${Date.now()}`,
    type: 'employee_updated',
    employee_id: employeeId,
    timestamp: new Date().toISOString(),
    changes: {
      oldName: currentEmployee.name,
      newName: updates.name || currentEmployee.name,
    },
  });
}

/**
 * Remove employee
 */
export async function removeEmployee(employeeId: string): Promise<void> {
  const employee = await getEmployeeById(employeeId);
  if (!employee) return;

  // Delete schedule entries (cascade should handle this, but we'll do it explicitly)
  await supabase.from(TABLES.SCHEDULE_ENTRIES).delete().eq('employee_id', employeeId);

  // Delete employee
  const { error } = await supabase.from(TABLES.EMPLOYEES).delete().eq('id', employeeId);

  if (error) {
    console.error('Error removing employee:', error);
    throw error;
  }

  // Record team change
  await supabase.from(TABLES.TEAM_CHANGES).insert({
    id: `change-${Date.now()}`,
    type: 'employee_removed',
    employee_id: employeeId,
    timestamp: new Date().toISOString(),
    changes: { name: employee.name },
  });
}

/**
 * Get schedule entries for an employee
 */
export async function getScheduleEntries(employeeId: string): Promise<ScheduleEntry[]> {
  const { data, error } = await supabase
    .from(TABLES.SCHEDULE_ENTRIES)
    .select('*')
    .eq('employee_id', employeeId)
    .order('date');

  if (error) {
    console.error('Error fetching schedule entries:', error);
    return [];
  }

  return (data || []).map(row => ({
    date: row.date,
    shift: row.shift,
    hours: row.hours,
    isSwapped: row.is_swapped || undefined,
    isTimeOff: row.is_time_off || undefined,
    isCustomHours: row.is_custom_hours || undefined,
  }));
}

/**
 * Save schedule entries for an employee
 */
export async function saveScheduleEntries(employeeId: string, entries: ScheduleEntry[]): Promise<void> {
  // Delete existing entries for this employee
  await supabase.from(TABLES.SCHEDULE_ENTRIES).delete().eq('employee_id', employeeId);

  // Insert new entries
  if (entries.length > 0) {
    const rows = entries.map(entry => ({
      employee_id: employeeId,
      date: entry.date,
      shift: entry.shift,
      hours: entry.hours,
      is_swapped: entry.isSwapped || false,
      is_time_off: entry.isTimeOff || false,
      is_custom_hours: entry.isCustomHours || false,
    }));

    const { error } = await supabase.from(TABLES.SCHEDULE_ENTRIES).insert(rows);
    if (error) {
      console.error('Error saving schedule entries:', error);
      throw error;
    }
  }
}

/**
 * Get all change requests
 */
export async function getChangeRequests(): Promise<ScheduleChangeRequest[]> {
  const { data, error } = await supabase
    .from(TABLES.CHANGE_REQUESTS)
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching change requests:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    employeeId: row.employee_id,
    type: row.type,
    date: row.date || '',
    swapFrom: row.swap_from || undefined,
    swapTo: row.swap_to || undefined,
    customShift: row.custom_shift || undefined,
    customHours: row.custom_hours || undefined,
    status: row.status,
    requestedAt: row.requested_at,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
  }));
}

/**
 * Add change request
 */
export async function addChangeRequest(request: ScheduleChangeRequest): Promise<void> {
  const { error } = await supabase.from(TABLES.CHANGE_REQUESTS).insert({
    id: request.id,
    employee_id: request.employeeId,
    type: request.type,
    date: request.date || null,
    swap_from: request.swapFrom || null,
    swap_to: request.swapTo || null,
    custom_shift: request.customShift || null,
    custom_hours: request.customHours || null,
    status: request.status,
    requested_at: request.requestedAt,
    approved_by: request.approvedBy || null,
    approved_at: request.approvedAt || null,
  });

  if (error) {
    console.error('Error adding change request:', error);
    throw error;
  }
}

/**
 * Update change request
 */
export async function updateChangeRequest(requestId: string, updates: Partial<ScheduleChangeRequest>): Promise<void> {
  const updateData: any = {};

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.approvedBy !== undefined) updateData.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) updateData.approved_at = updates.approvedAt;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.swapFrom !== undefined) updateData.swap_from = updates.swapFrom;
  if (updates.swapTo !== undefined) updateData.swap_to = updates.swapTo;
  if (updates.customShift !== undefined) updateData.custom_shift = updates.customShift;
  if (updates.customHours !== undefined) updateData.custom_hours = updates.customHours;

  const { error } = await supabase
    .from(TABLES.CHANGE_REQUESTS)
    .update(updateData)
    .eq('id', requestId);

  if (error) {
    console.error('Error updating change request:', error);
    throw error;
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    username: data.username,
    role: data.role,
    passwordHash: data.password_hash,
    employeeId: data.employee_id || undefined,
  };
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .order('username');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    username: row.username,
    role: row.role,
    passwordHash: row.password_hash,
    employeeId: row.employee_id || undefined,
  }));
}

/**
 * Add a new user
 */
export async function addUser(user: User): Promise<void> {
  // Check if username already exists
  const existing = await getUserByUsername(user.username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const { error } = await supabase.from(TABLES.USERS).insert({
    id: user.id,
    username: user.username,
    role: user.role,
    password_hash: user.passwordHash,
    employee_id: user.employeeId || null,
  });

  if (error) {
    console.error('Error adding user:', error);
    throw error;
  }
}

/**
 * Remove a user
 */
export async function removeUser(userId: string): Promise<void> {
  // Prevent removing the last admin
  const allUsers = await getAllUsers();
  const admins = allUsers.filter(u => u.role === 'admin');
  const userToRemove = allUsers.find(u => u.id === userId);

  if (userToRemove?.role === 'admin' && admins.length === 1) {
    throw new Error('Cannot remove the last admin user');
  }

  const { error } = await supabase.from(TABLES.USERS).delete().eq('id', userId);

  if (error) {
    console.error('Error removing user:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.USERS)
    .update({ password_hash: hashPassword(newPassword) })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
}

/**
 * Get team changes
 */
export async function getTeamChanges(): Promise<TeamChange[]> {
  const { data, error } = await supabase
    .from(TABLES.TEAM_CHANGES)
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching team changes:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    employeeId: row.employee_id || undefined,
    timestamp: row.timestamp,
    changes: row.changes,
  }));
}

/**
 * Get latest team change for an employee
 */
export async function getLatestTeamChange(employeeId: string): Promise<TeamChange | undefined> {
  const { data, error } = await supabase
    .from(TABLES.TEAM_CHANGES)
    .select('*')
    .eq('employee_id', employeeId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    type: data.type,
    employeeId: data.employee_id || undefined,
    timestamp: data.timestamp,
    changes: data.changes,
  };
}
