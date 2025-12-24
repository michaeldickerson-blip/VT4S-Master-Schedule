import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './LoginForm.css';

interface LoginFormProps {
  onCancel?: () => void;
}

export function LoginForm({ onCancel }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    } else {
      // Login successful - if there's a cancel callback, it means we're in guest mode
      // and the modal will be closed by the parent component
      // The login function already updates the user state, so the App will re-render
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>VT4S Master Schedule</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            {onCancel && (
              <button type="button" onClick={onCancel} className="cancel-button">
                Cancel
              </button>
            )}
            <button type="submit" className="login-button">
              Login
            </button>
          </div>
        </form>
        <p className="login-hint">Default: admin / admin</p>
      </div>
    </div>
  );
}

