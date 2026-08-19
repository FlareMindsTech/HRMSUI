import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchAuthContext } from "../services/rbacService";
import { getAuthToken, setAuthToken, clearAuthToken } from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(() => {
    let initialUser = null;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        initialUser = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to parse stored user profile:", e);
    }
    return {
      user: initialUser,
      menus: [],
      permissions: [],
      loading: !initialUser,
    };
  });

  // Load access context from GET /api/auth/me
  const loadAuthContext = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setAuthData({ user: null, menus: [], permissions: [], loading: false });
      return;
    }

    try {
      const data = await fetchAuthContext();
      if (data) {
        setAuthData({
          user: data.user,
          menus: data.menus || [],
          permissions: data.permissions || [],
          loading: false,
        });
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.warn("Failed to load access context:", error.message);
      if (
        error.message?.includes("User account not found") ||
        error.message?.includes("token") ||
        error.message?.includes("Authentication")
      ) {
        clearAuthToken();
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        setAuthData({ user: null, menus: [], permissions: [], loading: false });
        window.location.href = "/login";
        return;
      }
      setAuthData((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Run on mount
  useEffect(() => {
    loadAuthContext();
  }, [loadAuthContext]);

  // Synchronous Login Handler
  const loginUser = useCallback(
    async (token, userData) => {
      setAuthToken(token);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setAuthData((prev) => ({
          ...prev,
          user: userData,
          loading: true,
        }));
      }
      localStorage.setItem("isAuthenticated", "true");
      await loadAuthContext();
    },
    [loadAuthContext]
  );

  // Logout Handler
  const logoutUserLocal = useCallback(() => {
    clearAuthToken();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    setAuthData({ user: null, menus: [], permissions: [], loading: false });
  }, []);

  // Permission Evaluation Helper
  const hasPermission = useCallback(
    (permCode) => {
      if (!authData.user) return false;
      // System Owner or Wildcard has full permissions
      if (
        authData.user.priority === 1 ||
        authData.user.roleCode === "OWNER" ||
        authData.permissions.includes("*")
      ) {
        return true;
      }
      return authData.permissions.includes(permCode);
    },
    [authData]
  );

  // Menu Access Evaluation Helper
  const hasMenu = useCallback(
    (menuCode) => {
      if (!authData.user) return false;
      // System Owner or Wildcard has access to all active menus
      if (
        authData.user.priority === 1 ||
        authData.user.roleCode === "OWNER" ||
        authData.permissions.includes("*")
      ) {
        return true;
      }
      return authData.menus.includes(menuCode);
    },
    [authData]
  );

  const isSystemAdmin =
    authData.user?.priority === 1 ||
    authData.user?.priority === 2 ||
    authData.user?.roleCode === "OWNER" ||
    authData.user?.roleCode === "ADMIN" ||
    authData.permissions.includes("*");

  return (
    <AuthContext.Provider
      value={{
        user: authData.user,
        menus: authData.menus,
        permissions: authData.permissions,
        loading: authData.loading,
        hasPermission,
        hasMenu,
        isSystemAdmin,
        loginUser,
        logoutUserLocal,
        refreshAuthContext: loadAuthContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
