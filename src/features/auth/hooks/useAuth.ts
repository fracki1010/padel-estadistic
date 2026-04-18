import { createContext, useContext } from 'react';
import type { AuthState } from '@/features/auth/types/auth';

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
