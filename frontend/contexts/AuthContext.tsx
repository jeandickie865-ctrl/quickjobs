// contexts/AuthContext.tsx - AsyncStorage ONLY (NO BACKEND)
import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  role: 'worker' | 'employer';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'worker' | 'employer') => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: 'worker' | 'employer') => Promise<void>;
  loading: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@shiftmatch:token';
const USER_KEY = '@shiftmatch:user';
const USERS_DB_KEY = '@shiftmatch:users'; // Local "database" of all registered users

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY)
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✅ Auth loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all registered users from AsyncStorage
  const getUsersDb = async (): Promise<Record<string, { email: string; password: string; role: string }>> => {
    try {
      const db = await AsyncStorage.getItem(USERS_DB_KEY);
      return db ? JSON.parse(db) : {};
    } catch {
      return {};
    }
  };

  // Save users database to AsyncStorage
  const saveUsersDb = async (db: Record<string, { email: string; password: string; role: string }>) => {
    await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  };

  const signUp = async (email: string, password: string, role: 'worker' | 'employer') => {
    // Validation
    if (!email || !email.includes('@')) {
      throw new Error('Bitte gültige E-Mail-Adresse eingeben');
    }
    if (!password || password.length < 6) {
      throw new Error('Passwort muss mindestens 6 Zeichen lang sein');
    }

    // Check if user already exists
    const usersDb = await getUsersDb();
    const emailLower = email.toLowerCase().trim();
    
    if (usersDb[emailLower]) {
      throw new Error('Diese E-Mail-Adresse ist bereits registriert');
    }

    // Create new user - CONSISTENT ID from email
    const userId = `user_${emailLower.replace(/[^a-z0-9]/g, '_')}`;
    const newUser: User = {
      id: userId,
      email: emailLower,
      role,
    };

    // Save to users database
    usersDb[emailLower] = {
      email: emailLower,
      password, // In production, this should be hashed!
      role,
    };
    await saveUsersDb(usersDb);

    // Create token (just a simple UUID for local storage)
    const newToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save auth state
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    console.log('✅ User registered successfully (AsyncStorage)');
  };

  const signIn = async (email: string, password: string) => {
    // Validation
    if (!email || !password) {
      throw new Error('Bitte E-Mail und Passwort eingeben');
    }

    // Get users database
    const usersDb = await getUsersDb();
    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    const userData = usersDb[emailLower];
    if (!userData) {
      throw new Error('Kein Account mit dieser E-Mail gefunden');
    }

    // Check password
    if (userData.password !== password) {
      throw new Error('Falsches Passwort');
    }

    // Create user object
    const userId = `user_${emailLower.replace(/[^a-z0-9]/g, '_')}`;
    const loggedInUser: User = {
      id: userId,
      email: emailLower,
      role: userData.role as 'worker' | 'employer',
    };

    // Create token
    const newToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save auth state
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

    setToken(newToken);
    setUser(loggedInUser);

    console.log('✅ User logged in successfully (AsyncStorage)');
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    console.log('✅ User logged out');
  };

  const setRole = async (role: 'worker' | 'employer') => {
    if (!user) return;
    const updated = { ...user, role };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
    console.log(`✅ Role updated to ${role}`);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      signIn, 
      signUp, 
      signOut, 
      setRole, 
      loading,
      isLoading: loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
