"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  AuthSuccess,
  AuthUser,
  getCurrentUser,
  logoutUser,
} from "@/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  user: AuthUser | null;
  login: (payload: AuthSuccess) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isReady || !user) return;
    if (user.must_change_password && pathname !== "/change-password") {
      router.replace("/change-password");
    }
  }, [isReady, user, pathname, router]);

  useEffect(() => {
    let isMounted = true;

    async function syncAuthState() {
      try {
        const authenticatedUser = await getCurrentUser();

        if (isMounted) {
          setUser(authenticatedUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void syncAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshUser() {
    try {
      const authenticatedUser = await getCurrentUser();
      setUser(authenticatedUser);
    } catch {
      // ignore
    }
  }

  const value: AuthContextValue = {
    isAuthenticated: Boolean(user),
    isReady,
    user,
    login(payload) {
      setUser(payload.user);
    },
    async logout() {
      try {
        await logoutUser();
      } finally {
        setUser(null);
      }
      window.location.href = "/";
    },
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
