import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

interface AuthContextValue {
  user: any;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, role: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => false,
  signUp: async () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    const storedToken = await AsyncStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);
      const me = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await me.json();
      // Backend gibt userId zurück, aber Frontend erwartet id
      const user = { ...data, id: data.userId };
      setUser(user);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function login(email: string, password: string) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Login response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Login fehlgeschlagen' }));
        console.error('❌ Login failed:', errorData);
        throw new Error(errorData.detail || 'E-Mail oder Passwort falsch');
      }

      const data = await res.json();
      console.log('✅ Login successful, token received');
      
      await AsyncStorage.setItem("token", data.token);
      setToken(data.token);

      const me = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      
      if (!me.ok) {
        console.error('❌ Failed to fetch user data');
        throw new Error('Fehler beim Laden der Benutzerdaten');
      }
      
      const userData = await me.json();
      console.log('✅ User data loaded:', userData.email, 'role:', userData.role);
      
      // Backend gibt userId zurück, aber Frontend erwartet id
      const user = { ...userData, id: userData.userId };
      setUser(user);
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async function signUp(email: string, password: string, role: string) {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Registrierung fehlgeschlagen");
    }

    const data = await res.json();
    await AsyncStorage.setItem("token", data.token);
    setToken(data.token);

    const me = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    const userData = await me.json();
    
    // Backend gibt userId zurück, aber Frontend erwartet id
    const user = { ...userData, id: userData.userId };
    setUser(user);
    return true;
  }

  async function signOut() {
    await AsyncStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
