// import React, { createContext, useEffect, useMemo, useState } from "react";
// import api, { setAuthToken } from "../api/api";
// import { deleteItem, getItem, setItem, TOKEN_KEY, USER_KEY } from "../storage/token";

// type User = {
//   id: number;
//   name?: string;
//   email?: string;
//   role?: string; // FIELD
// };

// type AuthContextType = {
//   user: User | null;
//   token: string | null;
//   booting: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
// };

// export const AuthContext = createContext<AuthContextType>({
//   user: null,
//   token: null,
//   booting: true,
//   login: async () => {},
//   logout: async () => {},
// });

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [booting, setBooting] = useState(true);

//   // Restore session on app start
//   useEffect(() => {
//     (async () => {
//       try {
//         const savedToken = await getItem(TOKEN_KEY);
//         const savedUser = await getItem(USER_KEY);

//         if (savedToken) {
//           setToken(savedToken);
//           setAuthToken(savedToken);
//         }

//         if (savedUser) {
//           try {
//             setUser(JSON.parse(savedUser));
//           } catch {
//             // corrupted user data -> clear
//             await deleteItem(USER_KEY);
//           }
//         }
//       } finally {
//         setBooting(false);
//       }
//     })();
//   }, []);

//   const login = async (email: string, password: string) => {
//     // Backend: POST /auth/login
//     const res = await api.post("/auth/login", { email, password });

//     const nextToken = res.data?.token;
//     const nextUser: User | undefined = res.data?.user;

//     if (!nextToken || !nextUser) {
//       throw new Error("Invalid login response.");
//     }

//     // FIELD only enforcement (optional)
//     const role = String(nextUser?.role || "").toUpperCase();
//     if (role !== "FIELD") {
//       throw new Error("This app is for FIELD users only.");
//     }

//     setToken(nextToken);
//     setUser(nextUser);
//     setAuthToken(nextToken);

//     await setItem(TOKEN_KEY, nextToken);
//     await setItem(USER_KEY, JSON.stringify(nextUser));
//   };

//   const logout = async () => {
//     // Clear state + axios header + storage
//     setUser(null);
//     setToken(null);
//     setAuthToken(null);

//     await deleteItem(TOKEN_KEY);
//     await deleteItem(USER_KEY);
//   };

//   const value = useMemo(
//     () => ({ user, token, booting, login, logout }),
//     [user, token, booting]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }




// import React, { createContext, useEffect, useMemo, useState } from "react";
// import api, { setAuthToken } from "../api/api";
// import { deleteItem, getItem, setItem, TOKEN_KEY, USER_KEY } from "../storage/token";

// export type User = {
//   id: string;               // ✅ backend usually UUID, not number
//   name?: string;
//   email?: string;
//   role?: string;            // FIELD
//   faceEnrolled?: boolean;   // ✅ NEW
// };

// type AuthContextType = {
//   user: User | null;
//   token: string | null;
//   booting: boolean;
//   login: (email: string, password: string) => Promise<User>;
//   logout: () => Promise<void>;
//   setUser: (u: User | null) => void; // ✅ allow updating after enroll
// };

// export const AuthContext = createContext<AuthContextType>({
//   user: null,
//   token: null,
//   booting: true,
//   login: async () => {
//     throw new Error("AuthProvider not mounted");
//   },
//   logout: async () => {},
//   setUser: () => {},
// });

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [booting, setBooting] = useState(true);

//   useEffect(() => {
//     (async () => {
//       try {
//         const savedToken = await getItem(TOKEN_KEY);
//         const savedUser = await getItem(USER_KEY);

//         if (savedToken) {
//           setToken(savedToken);
//           setAuthToken(savedToken);
//         }

//         if (savedUser) {
//           try {
//             setUser(JSON.parse(savedUser));
//           } catch {
//             await deleteItem(USER_KEY);
//           }
//         }
//       } finally {
//         setBooting(false);
//       }
//     })();
//   }, []);

//   const login = async (email: string, password: string) => {
//     const res = await api.post("/auth/login", { email, password });

//     const nextToken = res.data?.token;
//     const nextUser: User | undefined = res.data?.user;

//     if (!nextToken || !nextUser) throw new Error("Invalid login response.");

//     const role = String(nextUser?.role || "").toUpperCase();
//     if (role !== "FIELD") throw new Error("This app is for FIELD users only.");

//     setToken(nextToken);
//     setUser(nextUser);
//     setAuthToken(nextToken);

//     await setItem(TOKEN_KEY, nextToken);
//     await setItem(USER_KEY, JSON.stringify(nextUser));

//     return nextUser;
//   };

//   const logout = async () => {
//     setUser(null);
//     setToken(null);
//     setAuthToken(null);

//     await deleteItem(TOKEN_KEY);
//     await deleteItem(USER_KEY);
//   };

//   const value = useMemo(
//     () => ({ user, token, booting, login, logout, setUser }),
//     [user, token, booting]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }







// import React, { createContext, useEffect, useMemo, useCallback, useState } from "react";
// import { useRouter, useSegments } from "expo-router";
// import api, { setUnauthorizedHandler } from "../api/api";
// import { getItem, setItem, removeItem, TOKEN_KEY, USER_KEY } from "../storage/token";

// type AuthCtx = {
//   user: any;
//   token: string | null;
//   ready: boolean;
//   login: (email: string, password: string) => Promise<any>;
//   logout: () => Promise<void>;
//   setUser: (u: any) => void;
//   setToken: (t: string | null) => void;
// };

// export const AuthContext = createContext<AuthCtx>({} as AuthCtx);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const segments = useSegments();

//   const [user, setUser] = useState<any>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [ready, setReady] = useState(false);

//   const logout = useCallback(async () => {
//     setUser(null);
//     setToken(null);

//     await removeItem(TOKEN_KEY);
//     await removeItem(USER_KEY);

//     // ✅ only navigate after app boot finished
//     if (ready) router.replace("/login");
//   }, [ready, router]);

//   const login = useCallback(
//     async (email: string, password: string) => {
//       // ✅ adjust endpoint if yours differs
//       const res = await api.post("/auth/login", { email, password });

//       const t = res.data?.token;
//       const u = res.data?.user;

//       if (!t || !u) throw new Error("Invalid login response (missing token/user)");

//       setToken(t);
//       setUser(u);

//       await setItem(TOKEN_KEY, t);
//       await setItem(USER_KEY, JSON.stringify(u));

//       return u; // ✅ Login.tsx uses this (faceEnrolled check)
//     },
//     []
//   );

//   // ✅ Handle 401 globally
//   useEffect(() => {
//     setUnauthorizedHandler(() => {
//       logout();
//     });
//   }, [logout]);

//   // ✅ Bootstrap from storage
//   useEffect(() => {
//     (async () => {
//       try {
//         const t = await getItem(TOKEN_KEY);
//         const uStr = await getItem(USER_KEY);

//         if (t) setToken(t);
//         if (uStr) {
//           try {
//             setUser(JSON.parse(uStr));
//           } catch {
//             await removeItem(USER_KEY);
//           }
//         }
//       } finally {
//         setReady(true);
//       }
//     })();
//   }, []);

//   // ✅ Route protection AFTER ready
//   useEffect(() => {
//     if (!ready) return;

//     const inTabs = segments[0] === "(tabs)";
//     const inLogin = segments[0] === "login"; // app/login.tsx

//     if (!token && inTabs) router.replace("/login");
//     if (token && inLogin) router.replace("/(tabs)");
//   }, [ready, token, segments.join("/")]);

//   const value = useMemo(
//     () => ({ user, token, ready, login, logout, setUser, setToken }),
//     [user, token, ready, login, logout]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }







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

  // prevent replace loops
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

  // handle 401 once
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // bootstrap from storage
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

  // ✅ ROUTE GUARD (single source of truth)
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
