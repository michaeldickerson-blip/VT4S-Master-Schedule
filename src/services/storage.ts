import type { AppData, Employee, ScheduleEntry, ScheduleChangeRequest, User, TeamChange } from '../types';

const STORAGE_KEY = 'vt4s_master_schedule_data';

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
 * Load data from localStorage
 */
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  
  // Return default data structure
  return {
    employees: [],
    scheduleEntries: {},
    changeRequests: [],
    users: [],
    teamChanges: [],
  };
}

/**
 * Save data to localStorage
 */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    throw error;
  }
}

/**
 * Initialize default admin user if no users exist
 */
export function initializeDefaultAdmin(): void {
  const data = loadData();
  if (data.users.length === 0) {
    data.users.push({
      id: 'admin-1',
      username: 'admin',
      role: 'admin',
      passwordHash: hashPassword('admin'),
      // Admin doesn't need employeeId
    });
    saveData(data);
  }
}

/**
 * Get employee by ID
 */
export function getEmployeeById(employeeId: string): Employee | undefined {
  const data = loadData();
  return data.employees.find(emp => emp.id === employeeId);
}

/**
 * Get all employees
 */
export function getAllEmployees(): Employee[] {
  const data = loadData();
  return data.employees;
}

/**
 * Add employee
 */
export function addEmployee(employee: Employee): void {
  const data = loadData();
  data.employees.push(employee);
  
  // Record team change
  data.teamChanges.push({
    id: `change-${Date.now()}`,
    type: 'employee_added',
    employeeId: employee.id,
    timestamp: new Date().toISOString(),
    changes: { name: employee.name },
  });
  
  saveData(data);
}

/**
 * Update employee
 */
export function updateEmployee(employeeId: string, updates: Partial<Employee>): void {
  const data = loadData();
  const index = data.employees.findIndex(emp => emp.id === employeeId);
  if (index !== -1) {
    const oldEmployee = { ...data.employees[index] };
    data.employees[index] = {
      ...data.employees[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Record team change
    data.teamChanges.push({
      id: `change-${Date.now()}`,
      type: 'employee_updated',
      employeeId: employeeId,
      timestamp: new Date().toISOString(),
      changes: {
        oldName: oldEmployee.name,
        newName: updates.name || oldEmployee.name,
      },
    });
    
    saveData(data);
  }
}

/**
 * Remove employee
 */
export function removeEmployee(employeeId: string): void {
  const data = loadData();
  const employee = data.employees.find(emp => emp.id === employeeId);
  if (employee) {
    data.employees = data.employees.filter(emp => emp.id !== employeeId);
    delete data.scheduleEntries[employeeId];
    
    // Record team change
    data.teamChanges.push({
      id: `change-${Date.now()}`,
      type: 'employee_removed',
      employeeId: employeeId,
      timestamp: new Date().toISOString(),
      changes: { name: employee.name },
    });
    
    saveData(data);
  }
}

/**
 * Get schedule entries for an employee
 */
export function getScheduleEntries(employeeId: string): ScheduleEntry[] {
  const data = loadData();
  return data.scheduleEntries[employeeId] || [];
}

/**
 * Save schedule entries for an employee
 */
export function saveScheduleEntries(employeeId: string, entries: ScheduleEntry[]): void {
  const data = loadData();
  data.scheduleEntries[employeeId] = entries;
  saveData(data);
}

/**
 * Get all change requests
 */
export function getChangeRequests(): ScheduleChangeRequest[] {
  const data = loadData();
  return data.changeRequests;
}

/**
 * Add change request
 */
export function addChangeRequest(request: ScheduleChangeRequest): void {
  const data = loadData();
  data.changeRequests.push(request);
  saveData(data);
}

/**
 * Update change request
 */
export function updateChangeRequest(requestId: string, updates: Partial<ScheduleChangeRequest>): void {
  const data = loadData();
  const index = data.changeRequests.findIndex(req => req.id === requestId);
  if (index !== -1) {
    data.changeRequests[index] = {
      ...data.changeRequests[index],
      ...updates,
    };
    saveData(data);
  }
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): User | undefined {
  const data = loadData();
  return data.users.find(user => user.username === username);
}

/**
 * Get all users
 */
export function getAllUsers(): User[] {
  const data = loadData();
  return data.users;
}

/**
 * Add a new user
 */
export function addUser(user: User): void {
  const data = loadData();
  // Check if username already exists
  if (data.users.some(u => u.username === user.username)) {
    throw new Error('Username already exists');
  }
  data.users.push(user);
  saveData(data);
}

/**
 * Remove a user
 */
export function removeUser(userId: string): void {
  const data = loadData();
  // Prevent removing the last admin
  const admins = data.users.filter(u => u.role === 'admin');
  const userToRemove = data.users.find(u => u.id === userId);
  if (userToRemove?.role === 'admin' && admins.length === 1) {
    throw new Error('Cannot remove the last admin user');
  }
  data.users = data.users.filter(u => u.id !== userId);
  saveData(data);
}

/**
 * Update user password
 */
export function updateUserPassword(userId: string, newPassword: string): void {
  const data = loadData();
  const user = data.users.find(u => u.id === userId);
  if (user) {
    user.passwordHash = hashPassword(newPassword);
    saveData(data);
  }
}

/**
 * Get team changes
 */
export function getTeamChanges(): TeamChange[] {
  const data = loadData();
  return data.teamChanges;
}

/**
 * Get latest team change for an employee
 */
export function getLatestTeamChange(employeeId: string): TeamChange | undefined {
  const data = loadData();
  const changes = data.teamChanges
    .filter(change => change.employeeId === employeeId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return changes[0];
}

