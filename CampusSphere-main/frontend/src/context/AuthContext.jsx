import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("cs_token");
    const storedUser  = localStorage.getItem("cs_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("cs_token");
        localStorage.removeItem("cs_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem("cs_token", tokenValue);
    localStorage.setItem("cs_user", JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cs_token");
    localStorage.removeItem("cs_user");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  // Role helpers
  const isAdmin   = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const hasRole = useCallback((...roles) => {
    return roles.includes(user?.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated,
      isAdmin, isTeacher, isStudent,
      hasRole, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
