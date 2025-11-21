// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  password: string;
  role?: 'worker' | 'employer';
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  setRole: (role: 'worker' | 'employer') => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Keys
const USER_KEY = '@shiftmatch:user';
const USER_DB_KEY = '@shiftmatch:users_database';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // App Start → Benutzer laden
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  // -----------------------------
  // Hilfsfunktionen
  // -----------------------------

  const normalizeEmail = (email: string) => {
    return email.trim().toLowerCase();
  };

  const loadUserDB = async (): Promise<Record<string, User>> => {
    const stored = await AsyncStorage.getItem(USER_DB_KEY);
    return stored ? JSON.parse(stored) : {};
  };

  const saveUserDB = async (db: Record<string, User>) => {
    await AsyncStorage.setItem(USER_DB_KEY, JSON.stringify(db));
  };

  // -----------------------------
  // SIGN IN (LOGIN)
  // -----------------------------
  const signIn = async (email: string, password: string): Promise<User> => {
    const normalized = normalizeEmail(email);
    const db = await loadUserDB();

    const existing = db[normalized];

    if (!existing) {
      throw new Error('Diese E-Mail ist nicht registriert.');
    }

    if (existing.password !== password) {
      throw new Error('E-Mail oder Passwort falsch.');
    }

    // Login OK
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(existing));
    setUser(existing);

    return existing;
  };

  // -----------------------------
  // SIGN UP (REGISTRIEREN)
  // -----------------------------
  const signUp = async (email: string, password: string): Promise<User> => {
    const normalized = normalizeEmail(email);
    const db = await loadUserDB();

    if (db[normalized]) {
      throw new Error('Diese E-Mail ist bereits registriert. Bitte logge dich ein.');
    }

    const newUser: User = {
      id: 'u-' + Date.now().toString(),
      email: normalized,
      password,
    };

    db[normalized] = newUser;
    await saveUserDB(db);

    // Direkt einloggen
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  };

  // -----------------------------
  // ROLLE SPEICHERN
  // -----------------------------
  const setRole = async (role: 'worker' | 'employer') => {
    if (!user) return;

    const updated = { ...user, role };

    const db = await loadUserDB();
    db[user.email] = updated;
    await saveUserDB(db);

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const signOut = async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};