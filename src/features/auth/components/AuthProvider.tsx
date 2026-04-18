import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authService } from '@/features/auth/services/authService';
import { AuthContext } from '@/features/auth/hooks/useAuth';
import type { AuthState } from '@/features/auth/types/auth';
import type { User } from 'firebase/auth';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = authService.observeAuth((user: User | null) => {
      setState({ user, loading: false });
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      logout: async () => authService.logout()
    }),
    [state.loading, state.user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
