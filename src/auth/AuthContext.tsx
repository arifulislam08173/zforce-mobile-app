import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSegments, type Href } from "expo-router";
import api, { setUnauthorizedHandler } from "../api/api";
import { getItem, setItem, removeItem, TOKEN_KEY, USER_KEY } from "../storage/token";

type UserLike = any;

function normalizeUser(u: UserLike) {
  if (!u) return u;

  const raw =
    u.faceEnrolled ??
    u.face_enrolled ??
    u.faceEnroll ??
    u.face_enroll ??
    u.isFaceEnrolled ??
    u.is_face_enrolled;

  const faceEnrolled = raw === true || raw === "true" || raw === 1 || raw === "1";
  return { ...u, faceEnrolled };
}

type AuthCtx = {
  user: any;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  setUser: (u: any) => void;
  setToken: (t: string | null) => void;
};

export const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const lastNavRef = useRef<string>("");

  const safeReplace = (to: Href) => {
    const key = typeof to === "string" ? to : JSON.stringify(to);
    if (lastNavRef.current === key) return;
    lastNavRef.current = key;
    router.replace(to);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
    safeReplace("/login");
  };

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const t = await getItem(TOKEN_KEY);
        const uStr = await getItem(USER_KEY);

        if (t) setToken(t);

        if (uStr) {
          try {
            const parsed = JSON.parse(uStr);
            setUser(normalizeUser(parsed));
          } catch {
            await removeItem(USER_KEY);
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data?.data ?? res.data;

    const t = data?.token;
    const u = normalizeUser(data?.user);

    if (!t || !u) throw new Error("Invalid login response (missing token/user)");

    setToken(t);
    setUser(u);

    await setItem(TOKEN_KEY, t);
    await setItem(USER_KEY, JSON.stringify(u));

    return u;
  };

  // ROUTE GUARD
  useEffect(() => {
    if (!ready) return;

    const root = (segments?.[0] ?? "") as string;

    const inTabs = root === "(tabs)";
    const inAuth = root === "(auth)";
    const inFaceEnroll = root === "face-enroll";

    // not logged in
    if (!token) {
      if (inTabs || inFaceEnroll) safeReplace("/login");
      return;
    }

    // logged in but user not loaded yet
    if (!user) return;

    const enrolled = !!user.faceEnrolled;

    // logged in but NOT enrolled
    if (!enrolled) {
      if (!inFaceEnroll) safeReplace("/face-enroll");
      return;
    }

    // logged in + enrolled -> keep out of auth + face-enroll
    if (inAuth || inFaceEnroll) {
      safeReplace("/(tabs)");
      return;
    }
  }, [ready, token, user, segments.join("/")]);

  const value = useMemo(
    () => ({ user, token, ready, login, logout, setUser, setToken }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
