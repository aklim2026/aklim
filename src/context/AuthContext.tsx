import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  role: Role;
  isAdmin: boolean;
  isLoading: boolean;
  login: () => void; // Triggered by Auth state change
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not initialized. Check your environment variables.');
      setIsLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        syncUser(session);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error('Auth session error:', err);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        syncUser(session);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const syncUser = (session: Session) => {
    const { user } = session;
    setCurrentUser({
      id: user.id,
      nom: user.user_metadata?.nom || user.email?.split('@')[0] || 'Utilisateur',
      email: user.email || '',
      role: (user.user_metadata?.role as Role) || 'utilisateur',
      actif: true,
      createdat: user.created_at,
    });
  };

  const login = () => {
    // This is handled by Supabase Auth UI or programmatic login
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  };

  const role: Role = currentUser?.role || 'utilisateur';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        role,
        isAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
