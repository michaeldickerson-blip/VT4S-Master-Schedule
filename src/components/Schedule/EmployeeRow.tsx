import type { Employee } from '../../types';
import { ScheduleCell } from './ScheduleCell';
import { getWeekDates } from '../../utils/dateUtils';
import { getScheduleEntry } from '../../services/schedule';
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

  return (
    <div className="employee-row">
      <div className="employee-name-cell">
        <span className="employee-name">{employee.name}</span>
      </div>
      {weekDates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const entry = getScheduleEntry(employee.id, dateStr);
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

