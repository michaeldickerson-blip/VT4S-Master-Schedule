import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeeManager } from './EmployeeManager';
import { ScheduleTemplateEditor } from './ScheduleTemplateEditor';
import { UserManager } from './UserManager';
import './SettingsMenu.css';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'schedules' | 'users'>('employees');
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null; // Only admins can access settings
  }

  return (
    <div className="settings-container">
      <button
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle settings"
      >
        <span className="settings-icon">⚙️</span>
        <span className="settings-label">Settings</span>
      </button>
      
      {isOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Settings</h2>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>
          
          <div className="settings-tabs">
            <button
              className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              Team Members
            </button>
            <button
              className={`tab ${activeTab === 'schedules' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedules')}
            >
              Schedule Patterns
            </button>
            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>
          
          <div className="settings-content">
            {activeTab === 'employees' && <EmployeeManager />}
            {activeTab === 'schedules' && <ScheduleTemplateEditor />}
            {activeTab === 'users' && <UserManager />}
          </div>
        </div>
      )}
    </div>
  );
}

