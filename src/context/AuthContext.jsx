import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { getToken, setToken } from "../api/http";
import { ROLE_SUPER_ADMIN } from "../constants/labels";

const AuthContext = createContext(null);

// authService returns firstName/middleName/lastName rather than one display name.
function normalizeUser(profile) {
  if (!profile) return null;
  const name = [profile.firstName, profile.middleName, profile.lastName]
    .filter(Boolean)
    .join(" ");
  return { ...profile, name };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function rehydrate() {
      const token = getToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const profile = await authApi.fetchMe();
        if (!cancelled) setUser(normalizeUser(profile));
      } catch {
        // Expired or invalid — drop it rather than keep retrying with it.
        setToken(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    rehydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email, password) {
    const { token } = await authApi.login(email, password);
    setToken(token);
    const profile = await authApi.fetchMe();
    const loggedInUser = normalizeUser(profile);
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  // Only SUPER_ADMIN is decided by the JWT role claim. Being a *center* admin is not a
  // role at all — v2 §3: holding at least one center_members row is what makes someone
  // one. So this app cannot gate entry on a role; it gates on membership, which lives in
  // CenterContext.
  const isSuperAdmin = user?.role === ROLE_SUPER_ADMIN;

  return (
    <AuthContext.Provider value={{ user, initializing, isSuperAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
