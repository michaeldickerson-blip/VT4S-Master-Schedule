import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Employee, ScheduleEntry } from '../types';
import { getAllEmployees, getScheduleEntries } from '../services/storage';
import { generateAllSchedules } from '../services/schedule';

interface ScheduleContextType {
  employees: Employee[];
  getEmployeeSchedule: (employeeId: string) => Promise<ScheduleEntry[]>;
  refreshSchedules: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  refreshTrigger: number;
  loading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshEmployees();
    refreshSchedules();
  }, []);

  const refreshEmployees = async () => {
    try {
      setLoading(true);
      const allEmployees = await getAllEmployees();
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error refreshing employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSchedules = async () => {
    try {
      setLoading(true);
      const allEmployees = await getAllEmployees();
      await generateAllSchedules(allEmployees);
      setEmployees(allEmployees);
      // Trigger re-render by updating refresh trigger
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeSchedule = async (employeeId: string): Promise<ScheduleEntry[]> => {
    try {
      return await getScheduleEntries(employeeId);
    } catch (error) {
      console.error('Error getting employee schedule:', error);
      return [];
    }
  };

  const value: ScheduleContextType = {
    employees,
    getEmployeeSchedule,
    refreshSchedules,
    refreshEmployees,
    refreshTrigger,
    loading,
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

