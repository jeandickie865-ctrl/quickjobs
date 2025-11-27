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
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUserRaw = await AsyncStorage.getItem(USER_KEY);

      if (!storedToken || !storedUserRaw) {
        setLoading(false);
        return;
      }

      const storedUser = JSON.parse(storedUserRaw);
      const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (!response.ok) {
        await AsyncStorage.clear();
        setLoading(false);
        return;
      }

      const backendUser = await response.json();

      // WICHTIG: IDs müssen übereinstimmen
      if (backendUser.userId !== storedUser.id) {
        console.log("❌ Token/User mismatch – resetting auth");
        await AsyncStorage.clear();
        setLoading(false);
        return;
      }

      // Erfolg → Benutze backendUser
      setToken(storedToken);

      setUser({
        id: backendUser.userId,
        email: backendUser.email,
        role: backendUser.role,
      });

      console.log("✅ Auth restored & verified");
    } catch (err) {
      console.error("Auth load error:", err);
      await AsyncStorage.clear();
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
    // Call backend API
    const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registrierung fehlgeschlagen');
      }

      const data = await response.json();
      
      // Create user object
      const newUser: User = {
        id: data.userId,
        email: data.email,
        role: data.role,
      };

      // Save auth state
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(data.token);
      setUser(newUser);

      console.log('✅ User registered successfully (Backend)');
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Call backend API
    const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login fehlgeschlagen');
      }

      const data = await response.json();
      
      // Create user object
      const loggedInUser: User = {
        id: data.userId,
        email: data.email,
        role: data.role,
      };

      // Save auth state
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

      setToken(data.token);
      setUser(loggedInUser);

      console.log('✅ User logged in successfully (Backend)');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.clear();  // Alle Keys löschen
      setToken(null);
      setUser(null);
      console.log('✅ User logged out - AsyncStorage cleared');
    } catch (e) {
      console.error('❌ Logout Error:', e);
    }
  };

  // setRole entfernt - Rolle darf nicht lokal geändert werden
  // Role kommt IMMER vom Backend via /auth/me

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
