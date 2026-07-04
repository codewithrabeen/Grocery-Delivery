/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../config/api";
import { readJsonStorage, removeStorage, writeJsonStorage } from "../lib/storage";
import type { User } from "../types";

type AuthResponse = {
  token: string;
  refreshToken?: string;
  user: User;
  message?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  googleLogin: (credential: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readSavedToken = () => localStorage.getItem("auth_token");
const readSavedUser = () => readJsonStorage<User | null>("auth_user", null);
const readInitialSession = () => {
  const savedToken = readSavedToken();
  return {
    token: savedToken,
    user: savedToken ? readSavedUser() : null,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session] = useState(readInitialSession);
  const [user, setUser] = useState<User | null>(session.user);
  const [token, setToken] = useState<string | null>(session.token);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      removeStorage("auth_token");
      removeStorage("auth_refresh_token");
      removeStorage("auth_user");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const persistSession = useCallback((nextToken: string, nextUser: User, nextRefreshToken?: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem("auth_token", nextToken);
    if (nextRefreshToken) localStorage.setItem("auth_refresh_token", nextRefreshToken);
    writeJsonStorage("auth_user", nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
        persistSession(data.token, data.user, data.refreshToken);
        toast.success("Signed in successfully");
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not sign in"));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthResponse>("/auth/register", { name, email, password });
        persistSession(data.token, data.user, data.refreshToken);
        toast.success("Account created successfully");
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not create account"));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistSession],
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthResponse>("/auth/google", { credential });
        persistSession(data.token, data.user, data.refreshToken);
        toast.success("Signed in with Google");
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not sign in with Google"));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    removeStorage("auth_token");
    removeStorage("auth_refresh_token");
    removeStorage("auth_user");
    toast.success("Signed out");
    navigate("/");
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...userData, updatedAt: new Date().toISOString() };
      writeJsonStorage("auth_user", updated);
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      googleLogin,
      logout,
      updateUser,
    }),
    [googleLogin, loading, login, logout, register, token, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
