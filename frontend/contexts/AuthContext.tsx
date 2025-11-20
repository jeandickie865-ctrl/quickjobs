// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { getItem, setItem, removeItem } from '../utils/storage';

export type Role = 'worker' | 'employer';

export type User = {
  id: string;
  email: string;
  role?: Role;
  accountType?: 'private' | 'business';
} | null;

type AuthContextValue = {
  user: User;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = '@shiftmatch:user';
const USERS_DATABASE_KEY = '@shiftmatch:users_database';
const CREDENTIALS_KEY = '@shiftmatch:auth_users';

type StoredUser = {
  id: string;
  email: string;
  role?: Role;
  accountType?: 'private' | 'business';
};

type StoredCredentials = {
  email: string;
  password: string;
}[];

type UsersDatabase = {
  [email: string]: StoredUser;
};

async function loadCredentials(): Promise<StoredCredentials> {
  const data = await getItem<StoredCredentials>(CREDENTIALS_KEY);
  return data ?? [];
}

async function saveCredentials(creds: StoredCredentials): Promise<void> {
  await setItem(CREDENTIALS_KEY, creds);
}

async function loadUsersDatabase(): Promise<UsersDatabase> {
  const data = await getItem<UsersDatabase>(USERS_DATABASE_KEY);
  return data ?? {};
}

async function saveUsersDatabase(db: UsersDatabase): Promise<void> {
  await setItem(USERS_DATABASE_KEY, db);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // beim Start User aus Storage holen
  useEffect(() => {
    (async () => {
      const stored = await getItem<StoredUser>(USER_KEY);
      if (stored) {
        setUser(stored);
      }
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoading,

      async signUp(email, password) {
        const creds = await loadCredentials();
        const exists = creds.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          throw new Error('E-Mail ist bereits registriert');
        }

        const newUser: StoredUser = {
          id: 'u-' + Date.now().toString(),
          email,
        };

        // Speichere Credentials
        const nextCreds: StoredCredentials = [
          ...creds,
          { email: email.toLowerCase(), password },
        ];
        await saveCredentials(nextCreds);

        // Speichere User in der Datenbank
        const usersDb = await loadUsersDatabase();
        usersDb[email.toLowerCase()] = newUser;
        await saveUsersDatabase(usersDb);

        // Setze als aktuellen User
        await setItem(USER_KEY, newUser);
        setUser(newUser);
      },

      async signIn(email, password) {
        const creds = await loadCredentials();
        const found = creds.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (!found || found.password !== password) {
          throw new Error('E-Mail oder Passwort ist falsch');
        }

        // Lade User aus der Datenbank (mit persistierter Rolle falls vorhanden)
        const usersDb = await loadUsersDatabase();
        const userFromDb = usersDb[email.toLowerCase()];
        
        if (userFromDb) {
          // User existiert bereits in Datenbank - nutze seine Daten (inkl. Rolle)
          await setItem(USER_KEY, userFromDb);
          setUser(userFromDb);
        } else {
          // Fallback: User existiert noch nicht in Datenbank (alte Accounts)
          // Erstelle neuen User ohne Rolle
          const newUser: StoredUser = {
            id: 'u-' + Date.now().toString(),
            email,
          };
          
          usersDb[email.toLowerCase()] = newUser;
          await saveUsersDatabase(usersDb);
          await setItem(USER_KEY, newUser);
          setUser(newUser);
        }
      },

      async signOut() {
        setUser(null);
        await removeItem(USER_KEY);
      },

      async setRole(role) {
        if (!user) return;
        const updated: StoredUser = {
          id: user.id,
          email: user.email,
          role,
          accountType: user.accountType,
        };
        await setItem(USER_KEY, updated);
        setUser(updated);
      },
    };
  }, [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthProvider fehlt');
  }
  return ctx;
}