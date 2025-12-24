import { useState, useEffect } from 'react';
import type { Employee, ScheduleEntry } from '../../types';
import { ScheduleCell } from './ScheduleCell';
import { getWeekDates } from '../../utils/dateUtils';
import { useSchedule } from '../../contexts/ScheduleContext';
import './EmployeeRow.css';

interface EmployeeRowProps {
  employee: Employee;
  weekStart: Date;
  onCellClick: (employeeId: string, date: string) => void;
  hasPendingRequest: (employeeId: string, date: string) => boolean;
}

export function EmployeeRow({
  employee,
  weekStart,
  onCellClick,
  hasPendingRequest,
}: EmployeeRowProps) {
  const weekDates = getWeekDates(weekStart);
  const { getEmployeeSchedule } = useSchedule();
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    const loadSchedule = async () => {
      const schedule = await getEmployeeSchedule(employee.id);
      setScheduleEntries(schedule);
    };
    loadSchedule();
  }, [employee.id, getEmployeeSchedule]);

  const getEntryForDate = (dateStr: string): ScheduleEntry | undefined => {
    return scheduleEntries.find(entry => entry.date === dateStr);
  };

  return (
    <div className="employee-row">
      <div className="employee-name-cell">
        <span className="employee-name">{employee.name}</span>
      </div>
      {weekDates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const entry = getEntryForDate(dateStr);
        const hasPending = hasPendingRequest(employee.id, dateStr);
        
        return (
          <ScheduleCell
            key={dateStr}
            entry={entry}
            date={date}
            employeeId={employee.id}
            onClick={() => onCellClick(employee.id, dateStr)}
            hasPendingRequest={hasPending}
          />
        );
      })}
    </div>
  );
}

