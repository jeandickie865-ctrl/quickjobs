// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// ----------------------
// TYPES
// ----------------------
type User = {
  id: string;
  email: string;
  passwordHash: string; // <-- WICHTIG: nicht mehr das Klartext-Passwort
  salt: string;
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

// ----------------------
// STORAGE KEYS
// ----------------------
const USER_KEY = '@shiftmatch:user';
const USER_DB_KEY = '@shiftmatch:users_database';

// ----------------------
// HELPERS
// ----------------------
async function hashPassword(password: string, salt: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + salt
  );
}

function generateSalt(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function loadUserDB(): Promise<Record<string, User>> {
  const stored = await AsyncStorage.getItem(USER_DB_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    console.log('❌ UserDB corrupted — resetting...');
    return {};
  }
}

async function saveUserDB(db: Record<string, User>) {
  await AsyncStorage.setItem(USER_DB_KEY, JSON.stringify(db));
}

// ----------------------
// PROVIDER
// ----------------------
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Benutzer bei App-Start laden
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          console.log('❌ Fehler beim Laden des Benutzers');
        }
      }
    })();
  }, []);

  // -----------------------------------------------------
  // SIGN UP (REGISTRIERUNG)
  // -----------------------------------------------------
  const signUp = async (email: string, password: string): Promise<User> => {
    const normalized = normalizeEmail(email);
    const db = await loadUserDB();

    if (db[normalized]) {
      throw new Error('Diese E-Mail ist bereits registriert.');
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const newUser: User = {
      id: 'u-' + Date.now().toString(),
      email: normalized,
      passwordHash,
      salt,
      role: undefined, // später per setRole gesetzt
    };

    db[normalized] = newUser;
    await saveUserDB(db);

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  };

  // -----------------------------------------------------
  // SIGN IN (LOGIN)
  // -----------------------------------------------------
  const signIn = async (email: string, password: string): Promise<User> => {
    const normalized = normalizeEmail(email);
    const db = await loadUserDB();

    const existing = db[normalized];
    if (!existing) throw new Error('Diese E-Mail ist nicht registriert.');

    const hashed = await hashPassword(password, existing.salt);

    if (hashed !== existing.passwordHash) {
      throw new Error('E-Mail oder Passwort falsch.');
    }

    // Falls Benutzer keine Rolle hat → Standard setzen
    if (!existing.role) {
      existing.role = 'worker';
      db[normalized] = existing;
      await saveUserDB(db);
    }

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(existing));
    setUser(existing);

    console.log("LOGIN OK:", existing);
    return existing;
  };

  // -----------------------------------------------------
  // SET ROLE
  // -----------------------------------------------------
  const setRole = async (role: 'worker' | 'employer') => {
    if (!user) return;

    const updated = { ...user, role };
    const db = await loadUserDB();

    db[user.email] = updated;
    await saveUserDB(db);

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  // -----------------------------------------------------
  // SIGN OUT
  // -----------------------------------------------------
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

// ----------------------
// DEV FUNCTION: WIPE AUTH
// ----------------------
export async function __wipeAuthDebug() {
  await AsyncStorage.removeItem('@shiftmatch:user');
  await AsyncStorage.removeItem('@shiftmatch:users_database');
  console.log('🧹 Auth Storage komplett gelöscht!');
}