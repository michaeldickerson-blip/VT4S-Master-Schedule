import { useState, useEffect } from 'react';
import { addUser, removeUser, getAllUsers, hashPassword } from '../../services/storage';
import { useSchedule } from '../../contexts/ScheduleContext';
import type { User } from '../../types';
import './UserManager.css';

export function UserManager() {
  const [users, setUsers] = useState<User[]>(getAllUsers());
  const { employees } = useSchedule();
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'fes'>('fes');
  const [newEmployeeId, setNewEmployeeId] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    setUsers(getAllUsers());
  };

  const handleAddUser = () => {
    setError('');
    
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!newPassword.trim()) {
      setError('Password is required');
      return;
    }
    
    if (newPassword.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }

    // For FES users, employeeId is required
    if (newRole === 'fes' && !newEmployeeId) {
      setError('Please select an employee for FES users');
      return;
    }

    // Check if employee is already linked to another user
    if (newRole === 'fes' && newEmployeeId) {
      const existingUser = users.find(u => u.employeeId === newEmployeeId);
      if (existingUser) {
        setError(`This employee is already linked to user "${existingUser.username}"`);
        return;
      }
    }

    try {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: newUsername.trim(),
        role: newRole,
        passwordHash: hashPassword(newPassword),
        employeeId: newRole === 'fes' ? newEmployeeId : undefined,
      };
      
      addUser(newUser);
      refreshUsers();
      setNewUsername('');
      setNewPassword('');
      setNewRole('fes');
      setNewEmployeeId('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const handleDelete = (userId: string) => {
    try {
      removeUser(userId);
      setDeleteConfirmId(null);
      refreshUsers();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  return (
    <div className="user-manager">
      <div className="add-user-section">
        <h3>Add New User</h3>
        {error && <div className="error-message">{error}</div>}
        <div className="add-user-form">
          <div className="form-row">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
              onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password"
              onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
            />
            <select
              value={newRole}
              onChange={(e) => {
                setNewRole(e.target.value as 'admin' | 'fes');
                setNewEmployeeId(''); // Reset employee selection when role changes
              }}
            >
              <option value="fes">FES</option>
              <option value="admin">Admin</option>
            </select>
            {newRole === 'fes' && (
              <select
                value={newEmployeeId}
                onChange={(e) => setNewEmployeeId(e.target.value)}
                required
              >
                <option value="">-- Select Employee --</option>
                {employees
                  .filter(emp => !users.some(u => u.employeeId === emp.id))
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
            )}
            <button onClick={handleAddUser} className="add-button">
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="users-list">
        <h3>Users ({users.length})</h3>
        {users.length === 0 ? (
          <p className="empty-message">No users found.</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <div className="user-info">
                  <span className="user-username">{user.username}</span>
                  <span className={`user-role role-${user.role}`}>
                    {user.role.toUpperCase()}
                  </span>
                  {user.employeeId && (
                    <span className="user-employee">
                      ({employees.find(e => e.id === user.employeeId)?.name || 'Unknown Employee'})
                    </span>
                  )}
                </div>
                <div className="user-actions">
                  {deleteConfirmId === user.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="confirm-delete-button"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmId(null);
                          setError('');
                        }}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(user.id)}
                      className="delete-button"
                      disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                      title={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 ? 'Cannot delete the last admin' : 'Delete user'}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

