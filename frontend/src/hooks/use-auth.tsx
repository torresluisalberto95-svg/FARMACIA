import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister, type AuthUser } from "@/api/auth";

export type AppRole = "admin" | "empleado";

interface AuthState {
  user: AuthUser | null;
  role: AppRole | null;
  fullName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const saveUser = (u: AuthUser) => {
    localStorage.setItem("token", u.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const signIn = async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    saveUser(u);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const u = await apiRegister(email, password, fullName);
    saveUser(u);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{
      user,
      role: user ? (user.role as AppRole) : null,
      fullName: user?.fullName ?? "",
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
