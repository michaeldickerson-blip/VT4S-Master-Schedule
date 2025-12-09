import type { ScheduleEntry } from '../../types';
import './ScheduleCell.css';

interface ScheduleCellProps {
  entry?: ScheduleEntry;
  date: Date;
  employeeId: string;
  onClick: () => void;
  hasPendingRequest: boolean;
}

export function ScheduleCell({
  entry,
  date,
  onClick,
  hasPendingRequest,
}: ScheduleCellProps) {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isSwapped = entry?.isSwapped;
  const isTimeOff = entry?.isTimeOff;
  const isCustomHours = entry?.isCustomHours;
  const shift = entry?.shift || 'OFF';
  const hours = entry?.hours || 0;

  const cellClass = [
    'schedule-cell',
    isWeekend ? 'weekend' : '',
    isSwapped ? 'swapped' : '',
    isTimeOff ? 'time-off' : '',
    isCustomHours ? 'custom-hours' : '',
    hasPendingRequest ? 'pending' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="shift-time">{shift}</div>
      <div className="shift-hours">{hours}h</div>
      {hasPendingRequest && (
        <div className="pending-indicator" title="Pending approval">
          ⏳
        </div>
      )}
    </div>
  );
}

