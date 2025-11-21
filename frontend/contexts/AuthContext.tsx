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
        const emailNormalized = email.toLowerCase().trim();
        console.log('🔐 signUp called with email:', emailNormalized);
        
        const creds = await loadCredentials();
        console.log('📋 Current credentials:', creds.map(c => c.email));
        
        const exists = creds.find(c => c.email === emailNormalized);
        if (exists) {
          console.log('❌ Email already registered:', emailNormalized);
          throw new Error('Diese E-Mail ist bereits registriert. Bitte einloggen.');
        }

        const newUser: StoredUser = {
          id: 'u-' + Date.now().toString(),
          email: emailNormalized,
        };

        // Speichere Credentials
        const nextCreds: StoredCredentials = [
          ...creds,
          { email: emailNormalized, password },
        ];
        await saveCredentials(nextCreds);
        console.log('✅ Credentials saved');

        // Speichere User in der Datenbank
        const usersDb = await loadUsersDatabase();
        usersDb[emailNormalized] = newUser;
        await saveUsersDatabase(usersDb);
        console.log('✅ User saved to database');

        // Setze als aktuellen User
        await setItem(USER_KEY, newUser);
        setUser(newUser);
        console.log('✅ signUp successful, user set:', newUser);
      },

      async signIn(email, password) {
        const emailNormalized = email.toLowerCase().trim();
        console.log('🔐 signIn called with email:', emailNormalized);
        
        const creds = await loadCredentials();
        console.log('📋 Current credentials:', creds.map(c => c.email));
        
        const found = creds.find(c => c.email === emailNormalized);
        if (!found) {
          console.log('❌ User not found');
          throw new Error('E-Mail oder Passwort ist falsch');
        }
        
        if (found.password !== password) {
          console.log('❌ Wrong password');
          throw new Error('E-Mail oder Passwort ist falsch');
        }
        
        console.log('✅ Credentials valid');

        // Lade User aus der Datenbank (mit persistierter Rolle falls vorhanden)
        const usersDb = await loadUsersDatabase();
        console.log('📋 Users database:', Object.keys(usersDb));
        
        const userFromDb = usersDb[emailNormalized];
        
        if (userFromDb) {
          // User existiert bereits in Datenbank - nutze seine Daten (inkl. Rolle)
          console.log('✅ Found user in database:', userFromDb);
          await setItem(USER_KEY, userFromDb);
          setUser(userFromDb);
        } else {
          // Fallback: User existiert noch nicht in Datenbank (alte Accounts)
          // Erstelle neuen User ohne Rolle
          console.log('⚠️ User not in database, creating entry');
          const newUser: StoredUser = {
            id: 'u-' + Date.now().toString(),
            email: emailNormalized,
          };
          
          usersDb[emailNormalized] = newUser;
          await saveUsersDatabase(usersDb);
          await setItem(USER_KEY, newUser);
          setUser(newUser);
          console.log('✅ User created and set:', newUser);
        }
        
        console.log('✅ signIn successful');
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
        
        // Speichere in der User-Datenbank
        const usersDb = await loadUsersDatabase();
        usersDb[user.email.toLowerCase()] = updated;
        await saveUsersDatabase(usersDb);
        
        // Setze als aktuellen User
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