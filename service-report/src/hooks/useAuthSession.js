import { useEffect, useState } from "react";
import { BACKEND_URL } from "../utils/config";

const AUTH_STORAGE_KEY = "service-report-auth";

export function useAuthSession() {
  const [authState, setAuthState] = useState({
    token: "",
    user: null,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [authNotice, setAuthNotice] = useState("");

  useEffect(() => {
    const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedAuth) {
      setIsAuthLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        if (!parsedAuth?.token) {
          throw new Error("Missing token");
        }

        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${parsedAuth.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const result = await response.json();
        setAuthState({
          token: parsedAuth.token,
          user: result.user || parsedAuth.user || null,
        });
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuthState({ token: "", user: null });
        setAuthNotice("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async ({ email, password }) => {
    setIsLoginSubmitting(true);
    setAuthNotice("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok || result.status !== "success" || !result.access_token) {
        return {
          ok: false,
          message: result.detail || result.message || "เข้าสู่ระบบไม่สำเร็จ",
        };
      }

      const nextAuthState = {
        token: result.access_token,
        user: result.user || { email },
      };

      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(nextAuthState),
      );
      setAuthState(nextAuthState);
      setAuthNotice("");

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error.message || "ไม่สามารถเชื่อมต่อ backend เพื่อเข้าสู่ระบบได้",
      };
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const logout = (noticeMessage = "") => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({ token: "", user: null });
    setAuthNotice(noticeMessage);
  };

  const clearAuthNotice = () => {
    setAuthNotice("");
  };

  return {
    authState,
    isAuthLoading,
    isLoginSubmitting,
    authNotice,
    login,
    logout,
    clearAuthNotice,
  };
}
