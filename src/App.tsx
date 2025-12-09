import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { ApprovalProvider } from './contexts/ApprovalContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SettingsMenu } from './components/Settings/SettingsMenu';
import { HistoricalToggle } from './components/Navigation/HistoricalToggle';
import { ScheduleGrid } from './components/Schedule/ScheduleGrid';
import { ApprovalTodoList } from './components/TodoList/ApprovalTodoList';
import { ScheduleChangeModal } from './components/Modals/ScheduleChangeModal';
import './App.css';

function AppContent() {
  const { user, logout, isAdmin, isGuest } = useAuth();
  const [showHistorical, setShowHistorical] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    employeeId: string;
    date: string;
  }>({
    isOpen: false,
    employeeId: '',
    date: '',
  });

  // Close login modal when user successfully logs in (transitions from guest to logged in)
  useEffect(() => {
    if (showLoginModal && user && !isGuest) {
      setShowLoginModal(false);
    }
  }, [user, isGuest, showLoginModal]);

  // Show login form only if user explicitly wants to login (not guest)
  if (showLoginModal) {
    return (
      <div>
        <LoginForm onCancel={() => setShowLoginModal(false)} />
      </div>
    );
  }

  // If no user at all (shouldn't happen with guest mode, but safety check)
  if (!user) {
    return <LoginForm />;
  }

  const handleCellClick = (employeeId: string, date: string) => {
    // Guest users cannot click on cells to make changes
    if (isGuest) {
      return;
    }
    
    // FES users can only click on their own employee's cells
    if (user && user.role === 'fes' && user.employeeId !== employeeId) {
      alert('You can only request schedule changes for your own schedule.');
      return;
    }
    
    // Both FES (for their own schedule) and Admin can click on cells
    // FES will request changes, Admin will directly apply them
    setModalState({
      isOpen: true,
      employeeId,
      date,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      employeeId: '',
      date: '',
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>VT4S Master Schedule</h1>
        </div>
        <div className="header-right">
          <HistoricalToggle
            showHistorical={showHistorical}
            onToggle={setShowHistorical}
          />
          {!isGuest && <SettingsMenu />}
          <div className="user-info">
            {isGuest ? (
              <>
                <span className="username">Guest Viewer</span>
                <button onClick={() => setShowLoginModal(true)} className="login-button">
                  Login
                </button>
              </>
            ) : (
              <>
                <span className="username">{user.username}</span>
                <span className="user-role">({user.role})</span>
                <button onClick={logout} className="logout-button">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <ScheduleGrid
            showHistorical={showHistorical}
            onCellClick={handleCellClick}
          />
        </div>

        {isAdmin && (
          <aside className="sidebar">
            <ApprovalTodoList />
          </aside>
        )}
      </main>

      {!isGuest && (
        <ScheduleChangeModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          employeeId={modalState.employeeId}
          date={modalState.date}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <ApprovalProvider>
          <AppContent />
        </ApprovalProvider>
      </ScheduleProvider>
    </AuthProvider>
  );
}

export default App;
