import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { addDays } from 'date-fns';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useApproval } from '../../contexts/ApprovalContext';
import { getSixMonthsOfWeeks, getWeekDates } from '../../utils/dateUtils';
import { getScheduleEntry } from '../../services/schedule';
import { ScheduleCell } from './ScheduleCell';
import './ScheduleGrid.css';

interface ScheduleGridProps {
  showHistorical: boolean;
  onCellClick: (employeeId: string, date: string) => void;
}

export function ScheduleGrid({ showHistorical, onCellClick }: ScheduleGridProps) {
  const { employees, refreshTrigger } = useSchedule();
  const { allRequests } = useApproval();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  
  // Re-render when schedules are refreshed
  useEffect(() => {
    // This effect will run when refreshTrigger changes, forcing a re-render
  }, [refreshTrigger]);

  const allWeeks = useMemo(() => getSixMonthsOfWeeks(), []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter weeks based on historical toggle
  const visibleWeeks = useMemo(() => {
    if (showHistorical) {
      return allWeeks;
    }
    // Only show current and future weeks
    return allWeeks.filter(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return weekEnd >= today;
    });
  }, [allWeeks, showHistorical, today]);

  // Find initial week index (current week or first visible week)
  const initialWeekIndex = useMemo(() => {
    const currentWeekStart = allWeeks.find(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return weekStart <= today && weekEnd >= today;
    });
    
    if (currentWeekStart) {
      const index = visibleWeeks.findIndex(w => 
        w.getTime() === currentWeekStart.getTime()
      );
      return index >= 0 ? index : 0;
    }
    return 0;
  }, [allWeeks, visibleWeeks, today]);

  // Initialize selected week index
  useEffect(() => {
    if (visibleWeeks.length > 0 && initialWeekIndex >= 0) {
      setSelectedWeekIndex(initialWeekIndex);
    }
  }, [initialWeekIndex, visibleWeeks.length]);

  // Get the 4 weeks to display (2x2 grid)
  const week1 = visibleWeeks[selectedWeekIndex] || visibleWeeks[0] || allWeeks[0];
  const week2Index = selectedWeekIndex + 1;
  const week2 = visibleWeeks[week2Index] || addDays(week1, 7);
  const week3Index = selectedWeekIndex + 2;
  const week3 = visibleWeeks[week3Index] || addDays(week2, 7);
  const week4Index = selectedWeekIndex + 3;
  const week4 = visibleWeeks[week4Index] || addDays(week3, 7);

  // Check if a cell has a pending request
  const hasPendingRequest = (employeeId: string, date: string): boolean => {
    return allRequests.some(
      req =>
        req.employeeId === employeeId &&
        (req.date === date || req.swapFrom === date || req.swapTo === date) &&
        req.status === 'pending'
    );
  };

  if (employees.length === 0) {
    return (
      <div className="schedule-grid-empty">
        <p>No employees found. Add team members in Settings to get started.</p>
      </div>
    );
  }

  return (
    <div className="schedule-grid-container">
      <div className="week-navigation">
        <button
          onClick={() => setSelectedWeekIndex(Math.max(0, selectedWeekIndex - 4))}
          disabled={selectedWeekIndex === 0}
          className="nav-button"
        >
          ← Previous
        </button>
        <span className="week-info">
          {(() => {
            // Get the first date of week 1 (Sunday)
            const firstDate = week1;
            // Get the last date of week 4 (Saturday)
            const lastDate = addDays(week4, 6);
            // Format as MM/dd/yy
            return `${format(firstDate, 'M/d/yy')} - ${format(lastDate, 'M/d/yy')}`;
          })()}
        </span>
        <button
          onClick={() =>
            setSelectedWeekIndex(Math.min(visibleWeeks.length - 4, selectedWeekIndex + 4))
          }
          disabled={selectedWeekIndex >= visibleWeeks.length - 4}
          className="nav-button"
        >
          Next →
        </button>
      </div>

      <div className="schedule-grid">
        <div className="schedule-body">
          {/* Top Section: Weeks 1-2 */}
          {/* Header for Weeks 1-2 */}
          <div className="schedule-header-row">
            <div className="header-spacer"></div>
            {/* Week 1 */}
            {getWeekDates(week1).map((date) => {
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <div key={`week1-${date.toISOString()}`} className={`header-cell ${isWeekend ? 'weekend' : ''}`}>
                  <div className="day-name">{format(date, 'EEE')}</div>
                  <div className="day-number">{format(date, 'd')}</div>
                  <div className="month-name">{format(date, 'MMM')}</div>
                </div>
              );
            })}
            {/* Week 2 */}
            {getWeekDates(week2).map((date) => {
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <div key={`week2-${date.toISOString()}`} className={`header-cell ${isWeekend ? 'weekend' : ''}`}>
                  <div className="day-name">{format(date, 'EEE')}</div>
                  <div className="day-number">{format(date, 'd')}</div>
                  <div className="month-name">{format(date, 'MMM')}</div>
                </div>
              );
            })}
          </div>
          {/* All employees for Weeks 1-2 */}
          {employees.map((employee, index) => (
            <div 
              key={`${employee.id}-weeks12-${refreshTrigger}`} 
              className={`employee-four-week-row ${index === employees.length - 1 ? 'section-separator' : ''}`}
            >
              <div className="employee-name-cell">
                <span className="employee-name">{employee.name}</span>
              </div>
              {/* Week 1 */}
              {getWeekDates(week1).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = getScheduleEntry(employee.id, dateStr);
                const hasPending = hasPendingRequest(employee.id, dateStr);
                return (
                  <ScheduleCell
                    key={`week1-${dateStr}`}
                    entry={entry}
                    date={date}
                    employeeId={employee.id}
                    onClick={() => onCellClick(employee.id, dateStr)}
                    hasPendingRequest={hasPending}
                  />
                );
              })}
              {/* Week 2 */}
              {getWeekDates(week2).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = getScheduleEntry(employee.id, dateStr);
                const hasPending = hasPendingRequest(employee.id, dateStr);
                return (
                  <ScheduleCell
                    key={`week2-${dateStr}`}
                    entry={entry}
                    date={date}
                    employeeId={employee.id}
                    onClick={() => onCellClick(employee.id, dateStr)}
                    hasPendingRequest={hasPending}
                  />
                );
              })}
            </div>
          ))}
          {/* Bottom Section: Weeks 3-4 */}
          {/* Header for Weeks 3-4 */}
          <div className="schedule-header-row">
            <div className="header-spacer"></div>
            {/* Week 3 */}
            {getWeekDates(week3).map((date) => {
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <div key={`week3-${date.toISOString()}`} className={`header-cell ${isWeekend ? 'weekend' : ''}`}>
                  <div className="day-name">{format(date, 'EEE')}</div>
                  <div className="day-number">{format(date, 'd')}</div>
                  <div className="month-name">{format(date, 'MMM')}</div>
                </div>
              );
            })}
            {/* Week 4 */}
            {getWeekDates(week4).map((date) => {
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <div key={`week4-${date.toISOString()}`} className={`header-cell ${isWeekend ? 'weekend' : ''}`}>
                  <div className="day-name">{format(date, 'EEE')}</div>
                  <div className="day-number">{format(date, 'd')}</div>
                  <div className="month-name">{format(date, 'MMM')}</div>
                </div>
              );
            })}
          </div>
          {/* All employees for Weeks 3-4 */}
          {employees.map((employee) => (
            <div key={`${employee.id}-weeks34-${refreshTrigger}`} className="employee-four-week-row">
              <div className="employee-name-cell">
                <span className="employee-name">{employee.name}</span>
              </div>
              {/* Week 3 */}
              {getWeekDates(week3).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = getScheduleEntry(employee.id, dateStr);
                const hasPending = hasPendingRequest(employee.id, dateStr);
                return (
                  <ScheduleCell
                    key={`week3-${dateStr}`}
                    entry={entry}
                    date={date}
                    employeeId={employee.id}
                    onClick={() => onCellClick(employee.id, dateStr)}
                    hasPendingRequest={hasPending}
                  />
                );
              })}
              {/* Week 4 */}
              {getWeekDates(week4).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = getScheduleEntry(employee.id, dateStr);
                const hasPending = hasPendingRequest(employee.id, dateStr);
                return (
                  <ScheduleCell
                    key={`week4-${dateStr}`}
                    entry={entry}
                    date={date}
                    employeeId={employee.id}
                    onClick={() => onCellClick(employee.id, dateStr)}
                    hasPendingRequest={hasPending}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

