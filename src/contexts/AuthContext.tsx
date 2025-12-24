import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { getUserByUsername, hashPassword, initializeDefaultAdmin } from '../services/storage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setGuestMode: () => void;
  isAdmin: boolean;
  isFES: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a guest user object
const createGuestUser = (): User => ({
  id: 'guest',
  username: 'Guest',
  role: 'guest',
  passwordHash: '',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize default admin on first load
    initializeDefaultAdmin().catch(console.error);
    
    // Check if user is stored in sessionStorage
    const storedUser = sessionStorage.getItem('current_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // If parsing fails, default to guest mode
        setUser(createGuestUser());
      }
    } else {
      // No stored user, default to guest mode
      setUser(createGuestUser());
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = await getUserByUsername(username);
    if (foundUser && foundUser.passwordHash === hashPassword(password)) {
      setUser(foundUser);
      sessionStorage.setItem('current_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('current_user');
    // After logout, set to guest mode
    setUser(createGuestUser());
  };

  const setGuestMode = () => {
    setUser(createGuestUser());
    sessionStorage.removeItem('current_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    setGuestMode,
    isAdmin: user?.role === 'admin',
    isFES: user?.role === 'fes',
    isGuest: user?.role === 'guest',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

