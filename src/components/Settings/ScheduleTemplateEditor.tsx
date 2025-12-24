import { useState } from 'react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { updateTeamMemberPattern } from '../../services/teamManagement';
import type { WeeklyPattern } from '../../types';
import './ScheduleTemplateEditor.css';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const COMMON_SHIFTS = ['8-5 CT', '11-8 CT', 'OFF'];

export function ScheduleTemplateEditor() {
  const { employees, refreshSchedules } = useSchedule();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [pattern, setPattern] = useState<WeeklyPattern | null>(null);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setPattern({ ...employee.weeklyPattern });
    }
  };

  const handleShiftChange = (day: keyof WeeklyPattern, shift: string) => {
    if (!pattern) return;
    
    const hours = shift === 'OFF' ? 0 : 8;
    setPattern({
      ...pattern,
      [day]: { shift, hours },
    });
  };

  const handleHoursChange = (day: keyof WeeklyPattern, hours: number) => {
    if (!pattern) return;
    
    setPattern({
      ...pattern,
      [day]: { ...pattern[day], hours },
    });
  };

  const handleSave = async () => {
    if (selectedEmployeeId && pattern) {
      await updateTeamMemberPattern(selectedEmployeeId, pattern);
      await refreshSchedules();
      alert('Schedule pattern updated! Changes will apply to all future dates.');
    }
  };

  const handleReset = () => {
    if (selectedEmployee) {
      setPattern({ ...selectedEmployee.weeklyPattern });
    }
  };

  if (employees.length === 0) {
    return (
      <div className="schedule-editor-empty">
        <p>No team members available. Add team members first.</p>
      </div>
    );
  }

  return (
    <div className="schedule-template-editor">
      <div className="employee-selector">
        <label htmlFor="employee-select">Select Employee:</label>
        <select
          id="employee-select"
          value={selectedEmployeeId}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
        >
          <option value="">-- Select an employee --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && pattern && (
        <>
          <div className="pattern-editor">
            <h3>Weekly Schedule Pattern for {selectedEmployee.name}</h3>
            <p className="pattern-note">
              Changes will only apply to dates after today. Historical schedules remain unchanged.
            </p>
            <table className="pattern-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Shift</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map(({ key, label }) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <select
                        value={pattern[key].shift}
                        onChange={(e) => handleShiftChange(key, e.target.value)}
                      >
                        {COMMON_SHIFTS.map((shift) => (
                          <option key={shift} value={shift}>
                            {shift}
                          </option>
                        ))}
                        <option value={pattern[key].shift}>
                          {pattern[key].shift}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={pattern[key].hours}
                        onChange={(e) => handleHoursChange(key, parseInt(e.target.value) || 0)}
                        disabled={pattern[key].shift === 'OFF'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pattern-actions">
            <button onClick={handleSave} className="save-pattern-button">
              Save Pattern
            </button>
            <button onClick={handleReset} className="reset-pattern-button">
              Reset
            </button>
          </div>
        </>
      )}

      {!selectedEmployeeId && (
        <div className="select-prompt">
          <p>Select an employee to edit their schedule pattern.</p>
        </div>
      )}
    </div>
  );
}

