import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "astro_admin_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Attach token to axios
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  // Verify token on load
  useEffect(() => {
    let mounted = true;
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get("/admin/me")
      .then((r) => {
        if (mounted) setUser(r.data);
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setToken("");
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => mounted && setReady(true));
    return () => {
      mounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post("/admin/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({ email: data.email, role: data.role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
