import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { getWeekDates, getWeekStart } from '../../utils/dateUtils';
import { useApproval } from '../../contexts/ApprovalContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useAuth } from '../../contexts/AuthContext';
import { getScheduleEntry } from '../../services/schedule';
import './ScheduleChangeModal.css';

interface ScheduleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
}

export function ScheduleChangeModal({
  isOpen,
  onClose,
  employeeId,
  date,
}: ScheduleChangeModalProps) {
  const [requestType, setRequestType] = useState<'time_off' | 'swap' | 'custom_hours' | 'revert'>('time_off');
  const [swapToDate, setSwapToDate] = useState<string>('');
  const [customShift, setCustomShift] = useState<string>('');
  const [customHours, setCustomHours] = useState<number>(8);
  const { createChangeRequest, applyDirectChange, revertChange } = useApproval();
  const { employees, refreshSchedules } = useSchedule();
  const { user, isAdmin } = useAuth();

  const [currentEntry, setCurrentEntry] = useState<Awaited<ReturnType<typeof getScheduleEntry>>>(undefined);
  const [, setLoading] = useState(false);

  // Load current entry when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadEntry = async () => {
        setLoading(true);
        const entry = await getScheduleEntry(employeeId, date);
        setCurrentEntry(entry);
        setLoading(false);
      };
      loadEntry();
    }
  }, [isOpen, date, employeeId]);

  // Reset form when modal opens/closes or when switching types
  useEffect(() => {
    if (isOpen && currentEntry !== undefined) {
      // Initialize custom hours from current entry if it exists
      if (currentEntry && currentEntry.isCustomHours) {
        setCustomShift(currentEntry.shift);
        setCustomHours(currentEntry.hours);
      } else {
        setCustomShift('');
        setCustomHours(8);
      }
      setSwapToDate('');
      const hasApprovedChange = currentEntry?.isTimeOff || currentEntry?.isSwapped || currentEntry?.isCustomHours;
      if (!hasApprovedChange) {
        setRequestType('time_off');
      } else {
        setRequestType('revert');
      }
    }
  }, [isOpen, date, employeeId, currentEntry]);

  if (!isOpen) return null;

  const selectedDate = parseISO(date);
  const weekStart = getWeekStart(selectedDate);
  const weekDates = getWeekDates(weekStart);
  const employee = employees.find(emp => emp.id === employeeId);
  
  // Check permissions: FES users can only request changes for their own employee
  if (!isAdmin && user && user.role === 'fes' && user.employeeId !== employeeId) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Permission Denied</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>You can only request schedule changes for your own schedule.</p>
            <div className="modal-actions">
              <button onClick={onClose} className="cancel-button">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if this day has an approved change
  const hasApprovedChange = currentEntry?.isTimeOff || currentEntry?.isSwapped || currentEntry?.isCustomHours;

  // Filter out the selected date
  // For FES: only allow future dates
  // For Admin: allow any date in the week
  const availableSwapDates = weekDates.filter(d => {
    const dateStr = d.toISOString().split('T')[0];
    if (dateStr === date) return false;
    if (isAdmin) return true; // Admin can swap with any date
    return dateStr >= new Date().toISOString().split('T')[0]; // FES can only swap with future dates
  });

  const handleSubmit = async () => {
    if (!user) {
      return;
    }

    if (requestType === 'revert') {
      // Revert change (only admins can do this directly)
      if (isAdmin) {
        await revertChange(employeeId, date);
        await refreshSchedules();
        alert('Schedule change has been reverted to the original pattern.');
        onClose();
      }
      return;
    }

    if (isAdmin) {
      // Admin directly applies changes
      if (requestType === 'time_off') {
        await applyDirectChange(employeeId, 'time_off', date);
        await refreshSchedules();
        alert('Time off has been applied to the schedule.');
        onClose();
      } else if (requestType === 'swap') {
        if (!swapToDate) {
          alert('Please select a date to swap with.');
          return;
        }
        await applyDirectChange(employeeId, 'swap', date, date, swapToDate);
        await refreshSchedules();
        alert('Day swap has been applied to the schedule.');
        onClose();
      } else if (requestType === 'custom_hours') {
        if (!customShift.trim()) {
          alert('Please enter a shift time.');
          return;
        }
        if (customHours < 0 || customHours > 24) {
          alert('Hours must be between 0 and 24.');
          return;
        }
        await applyDirectChange(employeeId, 'custom_hours', date, undefined, undefined, customShift, customHours);
        await refreshSchedules();
        alert('Custom hours have been applied to the schedule.');
        onClose();
      }
    } else {
      // FES creates a request that needs approval
      if (requestType === 'time_off') {
        await createChangeRequest(employeeId, 'time_off', date);
        alert('Time off request submitted! Waiting for approval.');
        onClose();
      } else if (requestType === 'swap') {
        if (!swapToDate) {
          alert('Please select a date to swap with.');
          return;
        }
        await createChangeRequest(employeeId, 'swap', date, date, swapToDate);
        alert('Swap request submitted! Waiting for approval.');
        onClose();
      } else if (requestType === 'custom_hours') {
        if (!customShift.trim()) {
          alert('Please enter a shift time.');
          return;
        }
        if (customHours < 0 || customHours > 24) {
          alert('Hours must be between 0 and 24.');
          return;
        }
        await createChangeRequest(employeeId, 'custom_hours', date, undefined, undefined, customShift, customHours);
        alert('Custom hours request submitted! Waiting for approval.');
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isAdmin ? 'Apply Schedule Change' : 'Request Schedule Change'}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {employee && (
            <div className="request-info">
              <p>
                <strong>Employee:</strong> {employee.name}
              </p>
              <p>
                <strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}

          <div className="request-type-selection">
            {hasApprovedChange && (
              <label>
                <input
                  type="radio"
                  value="revert"
                  checked={requestType === 'revert'}
                  onChange={(e) => setRequestType(e.target.value as 'revert')}
                />
                Revert to Normal Schedule
              </label>
            )}
            <label>
              <input
                type="radio"
                value="time_off"
                checked={requestType === 'time_off'}
                onChange={(e) => setRequestType(e.target.value as 'time_off')}
                disabled={hasApprovedChange && requestType !== 'revert'}
              />
              {hasApprovedChange ? 'Change to Day Off' : 'Request Day Off'}
            </label>
            <label>
              <input
                type="radio"
                value="swap"
                checked={requestType === 'swap'}
                onChange={(e) => setRequestType(e.target.value as 'swap')}
                disabled={hasApprovedChange && requestType !== 'revert'}
              />
              Swap with Another Day (Same Week)
            </label>
            <label>
              <input
                type="radio"
                value="custom_hours"
                checked={requestType === 'custom_hours'}
                onChange={(e) => setRequestType(e.target.value as 'custom_hours')}
                disabled={hasApprovedChange && requestType !== 'revert'}
              />
              Set Custom Hours
            </label>
          </div>

          {requestType === 'revert' && hasApprovedChange && (
            <div className="revert-info">
              <p>This will restore the day to its original schedule pattern.</p>
              {currentEntry?.isSwapped && (
                <p className="revert-warning">
                  Note: This will also revert the swapped day back to its original schedule.
                </p>
              )}
            </div>
          )}

          {requestType === 'swap' && (
            <div className="swap-selection">
              <label htmlFor="swap-date">Swap with:</label>
              <select
                id="swap-date"
                value={swapToDate}
                onChange={(e) => setSwapToDate(e.target.value)}
              >
                <option value="">-- Select a date --</option>
                {availableSwapDates.map((d) => {
                  const dateStr = d.toISOString().split('T')[0];
                  return (
                    <option key={dateStr} value={dateStr}>
                      {format(d, 'EEEE, MMMM d')}
                    </option>
                  );
                })}
              </select>
              {availableSwapDates.length === 0 && (
                <p className="no-dates-message">
                  No available dates in this week for swapping.
                </p>
              )}
            </div>
          )}

          {requestType === 'custom_hours' && (
            <div className="custom-hours-selection">
              <div className="form-group">
                <label htmlFor="custom-shift">Shift Time:</label>
                <input
                  id="custom-shift"
                  type="text"
                  value={customShift}
                  onChange={(e) => setCustomShift(e.target.value)}
                  placeholder="e.g., 8-5 CT, 10-6 CT, 9-3 CT"
                />
              </div>
              <div className="form-group">
                <label htmlFor="custom-hours">Hours:</label>
                <input
                  id="custom-hours"
                  type="number"
                  min="0"
                  max="24"
                  value={customHours}
                  onChange={(e) => setCustomHours(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={requestType === 'revert' ? 'revert-button' : 'submit-button'}
              disabled={(requestType === 'swap' && !swapToDate) || (requestType === 'custom_hours' && !customShift.trim())}
            >
              {requestType === 'revert' 
                ? 'Revert Change' 
                : isAdmin 
                  ? 'Apply Change' 
                  : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

