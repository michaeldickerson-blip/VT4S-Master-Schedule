export interface ShiftConfig {
  shift: string; // e.g., "8-5 CT", "11-8 CT", "OFF"
  hours: number; // e.g., 8, 0
}

export interface WeeklyPattern {
  monday: ShiftConfig;
  tuesday: ShiftConfig;
  wednesday: ShiftConfig;
  thursday: ShiftConfig;
  friday: ShiftConfig;
  saturday: ShiftConfig;
  sunday: ShiftConfig;
}

export interface Employee {
  id: string;
  name: string;
  weeklyPattern: WeeklyPattern; // Fixed schedule pattern for the week
  createdAt: string; // When employee was added
  updatedAt?: string; // Last modification timestamp
}

export interface ScheduleEntry {
  date: string; // ISO date string
  shift: string; // e.g., "8-5 CT", "11-8 CT", "OFF"
  hours: number;
  isSwapped?: boolean;
  isTimeOff?: boolean;
  isCustomHours?: boolean; // Indicates custom hours were set
}

export interface ScheduleChangeRequest {
  id: string;
  employeeId: string;
  type: 'time_off' | 'swap' | 'custom_hours';
  date: string; // For time off and custom hours
  swapFrom?: string; // For swap
  swapTo?: string; // For swap
  customShift?: string; // For custom hours
  customHours?: number; // For custom hours
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'fes' | 'guest';
  passwordHash: string; // Simple hash for local storage
  employeeId?: string; // Link to Employee for FES users (required for FES, optional for admin)
}

export interface TeamChange {
  id: string;
  type: 'employee_added' | 'employee_updated' | 'employee_removed' | 'schedule_pattern_changed';
  employeeId?: string;
  timestamp: string; // ISO date string
  changes: Record<string, any>; // Details of what changed (old name, new name, etc.)
}

export interface AppData {
  employees: Employee[];
  scheduleEntries: Record<string, ScheduleEntry[]>; // employeeId -> entries
  changeRequests: ScheduleChangeRequest[];
  users: User[];
  teamChanges: TeamChange[];
}

