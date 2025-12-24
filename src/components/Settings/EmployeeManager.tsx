import { useState } from 'react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { addTeamMember, updateTeamMemberName, removeTeamMember } from '../../services/teamManagement';
import { createDefaultPattern } from '../../utils/scheduleUtils';
import './EmployeeManager.css';

export function EmployeeManager() {
  const { employees, refreshEmployees, refreshSchedules } = useSchedule();
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddEmployee = async () => {
    if (newEmployeeName.trim()) {
      await addTeamMember(newEmployeeName.trim(), createDefaultPattern());
      setNewEmployeeName('');
      await refreshEmployees();
      await refreshSchedules();
    }
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = async (id: string) => {
    if (editName.trim()) {
      await updateTeamMemberName(id, editName.trim());
      setEditingId(null);
      setEditName('');
      await refreshEmployees();
      await refreshSchedules();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: string) => {
    await removeTeamMember(id);
    setDeleteConfirmId(null);
    await refreshEmployees();
    await refreshSchedules();
  };

  return (
    <div className="employee-manager">
      <div className="add-employee-section">
        <h3>Add New Team Member</h3>
        <div className="add-employee-form">
          <input
            type="text"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder="Enter employee name"
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmployee()}
          />
          <button onClick={handleAddEmployee} className="add-button">
            Add
          </button>
        </div>
      </div>

      <div className="employees-list">
        <h3>Team Members ({employees.length})</h3>
        {employees.length === 0 ? (
          <p className="empty-message">No team members yet. Add one above.</p>
        ) : (
          <ul>
            {employees.map((employee) => (
              <li key={employee.id} className="employee-item">
                {editingId === employee.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(employee.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(employee.id)}
                      className="save-button"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="employee-name">{employee.name}</span>
                    <div className="employee-actions">
                      <button
                        onClick={() => handleStartEdit(employee.id, employee.name)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === employee.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="confirm-delete-button"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(employee.id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

