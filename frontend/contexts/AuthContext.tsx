import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';

type UserRole = 'worker' | 'employer';

interface User {
  id: string;
  email: string;
  role?: UserRole;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = '@shiftmatch:user';
const AUTH_USERS_KEY = '@shiftmatch:auth_users';

interface StoredAuthUser {
  id: string;
  email: string;
  password: string;
  role?: UserRole;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await storage.getItem<User>(USER_KEY);
      setUser(storedUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthUsers = async (): Promise<StoredAuthUser[]> => {
    const users = await storage.getItem<StoredAuthUser[]>(AUTH_USERS_KEY);
    return users || [];
  };

  const saveAuthUsers = async (users: StoredAuthUser[]): Promise<void> => {
    await storage.setItem(AUTH_USERS_KEY, users);
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    const users = await getAuthUsers();
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      throw new Error('E-Mail bereits registriert');
    }

    // Create new user
    const newAuthUser: StoredAuthUser = {
      id: `u-${Date.now()}`,
      email,
      password, // In production, hash this!
    };

    users.push(newAuthUser);
    await saveAuthUsers(users);

    // Set current user (without role yet)
    const currentUser: User = {
      id: newAuthUser.id,
      email: newAuthUser.email,
    };
    setUser(currentUser);
    await storage.setItem(USER_KEY, currentUser);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const users = await getAuthUsers();
    
    const authUser = users.find(u => u.email === email && u.password === password);
    if (!authUser) {
      throw new Error('Falsche E-Mail oder Passwort');
    }

    const currentUser: User = {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
    };
    setUser(currentUser);
    await storage.setItem(USER_KEY, currentUser);
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    await storage.removeItem(USER_KEY);
  };

  const setRole = async (role: UserRole): Promise<void> => {
    if (!user) {
      throw new Error('Kein User angemeldet');
    }

    // Update user in context
    const updatedUser: User = { ...user, role };
    setUser(updatedUser);
    await storage.setItem(USER_KEY, updatedUser);

    // Update auth users storage
    const users = await getAuthUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index].role = role;
      await saveAuthUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};