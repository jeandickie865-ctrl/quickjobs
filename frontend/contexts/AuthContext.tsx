import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

interface AuthContextValue {
  user: any;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
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
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return false;

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

  async function logout() {
    await AsyncStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
