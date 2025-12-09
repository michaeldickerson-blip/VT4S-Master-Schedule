import { format } from 'date-fns';
import { getWeekDates } from '../../utils/dateUtils';
import './WeekHeader.css';

interface WeekHeaderProps {
  weekStart: Date;
}

export function WeekHeader({ weekStart }: WeekHeaderProps) {
  const weekDates = getWeekDates(weekStart);

  return (
    <div className="week-header">
      {weekDates.map((date) => {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
        return (
          <div key={date.toISOString()} className={`header-cell ${isWeekend ? 'weekend' : ''}`}>
            <div className="day-name">{format(date, 'EEE')}</div>
            <div className="day-number">{format(date, 'd')}</div>
            <div className="month-name">{format(date, 'MMM')}</div>
          </div>
        );
      })}
    </div>
  );
}

