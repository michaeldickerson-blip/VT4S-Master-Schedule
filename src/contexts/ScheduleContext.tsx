import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Employee, ScheduleEntry } from '../types';
import { getAllEmployees, getScheduleEntries } from '../services/storage';
import { generateAllSchedules } from '../services/schedule';

interface ScheduleContextType {
  employees: Employee[];
  getEmployeeSchedule: (employeeId: string) => ScheduleEntry[];
  refreshSchedules: () => void;
  refreshEmployees: () => void;
  refreshTrigger: number;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    refreshEmployees();
    refreshSchedules();
  }, []);

  const refreshEmployees = () => {
    const allEmployees = getAllEmployees();
    setEmployees(allEmployees);
  };

  const refreshSchedules = () => {
    const allEmployees = getAllEmployees();
    generateAllSchedules(allEmployees);
    setEmployees(allEmployees);
    // Trigger re-render by updating refresh trigger
    setRefreshTrigger(prev => prev + 1);
  };

  const getEmployeeSchedule = (employeeId: string): ScheduleEntry[] => {
    return getScheduleEntries(employeeId);
  };

  const value: ScheduleContextType = {
    employees,
    getEmployeeSchedule,
    refreshSchedules,
    refreshEmployees,
    refreshTrigger,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}

