// import axios from "axios";
// import { Platform } from "react-native";

// const getBaseUrl = () => {
//   // Expo standard env variable
//   const env = process.env.EXPO_PUBLIC_API_URL;

//   if (env) return env;

//   // Fallbacks (edit LAN IP when testing on device)
//   if (Platform.OS === "web") return "http://localhost:5000/api";
//   return "http://192.168.0.100:5000/api";
// };

// const api = axios.create({
//   baseURL: getBaseUrl(),
//   timeout: 20000,
// });

// export const setAuthToken = (token?: string | null) => {
//   if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
//   else delete api.defaults.headers.common.Authorization;
// };

// export default api;




// import axios from "axios";
// import { getItem, removeItem, TOKEN_KEY, USER_KEY } from "../storage/token";

// const api = axios.create({
//   baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api",
// });

// api.interceptors.request.use(async (config) => {
//   const token = await getItem(TOKEN_KEY);
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// let onUnauthorized: null | (() => void) = null;
// export function setUnauthorizedHandler(fn: () => void) {
//   onUnauthorized = fn;
// }

// let handling401 = false;

// api.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const status = err?.response?.status;

//     if (status === 401 && !handling401) {
//       handling401 = true;
//       try {
//         await removeItem(TOKEN_KEY);
//         await removeItem(USER_KEY);
//         onUnauthorized?.();
//       } finally {
//         // small delay prevents burst loops on many parallel requests
//         setTimeout(() => {
//           handling401 = false;
//         }, 300);
//       }
//     }

//     return Promise.reject(err);
//   }
// );

// export default api;






import axios from "axios";
import { getItem, removeItem, TOKEN_KEY, USER_KEY } from "../storage/token";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use(async (config) => {
  const token = await getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: null | (() => void) = null;
let alreadyHandling401 = false;

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    if (status === 401 && !alreadyHandling401) {
      alreadyHandling401 = true;
      try {
        await removeItem(TOKEN_KEY);
        await removeItem(USER_KEY);
        onUnauthorized?.();
      } finally {
        // allow future 401 handling after a short tick
        setTimeout(() => (alreadyHandling401 = false), 300);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
