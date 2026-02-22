// import api from "./api";


// export const FieldAPI = {
//   // Attendance
//   getTodayAttendance: () => api.get("/attendance/today"),
//   punchIn: (payload: { lat?: number; lng?: number; note?: string }) =>
//     api.post("/attendance/punch-in", payload),
//   punchOut: (payload: { lat?: number; lng?: number; note?: string }) =>
//     api.post("/attendance/punch-out", payload),

//   // Route plan
//   getTodayRoute: () => api.get("/routes/today"),
//   getRouteCustomers: (routeId: number) => api.get(`/routes/${routeId}/customers`),

//   // Visits
//   listVisits: (params?: any) => api.get("/visits", { params }),
//   createVisit: (payload: {
//     customerId: number;
//     notes?: string;
//     lat?: number;
//     lng?: number;
//   }) => api.post("/visits", payload),

//   // Orders
//   listOrders: (params?: any) => api.get("/orders", { params }),
//   createOrder: (payload: {
//     customerId: number;
//     items: { productId: number; qty: number; price?: number }[];
//     notes?: string;
//   }) => api.post("/orders", payload),
// };







// import api from "./api";

// /**
//  * Field-only mobile endpoints.
//  * Adjust paths if your backend differs.
//  */

// const toForm = (payload: {
//   lat?: number;
//   lng?: number;
//   note?: string;
//   photoUri?: string;
// }) => {
//   const fd = new FormData();

//   if (payload.lat != null) fd.append("lat", String(payload.lat));
//   if (payload.lng != null) fd.append("lng", String(payload.lng));
//   if (payload.note) fd.append("note", payload.note);

//   if (payload.photoUri) {
//     // Expo file upload format
//     fd.append("photo", {
//       uri: payload.photoUri,
//       name: `attendance_${Date.now()}.jpg`,
//       type: "image/jpeg",
//     } as any);
//   }

//   return fd;
// };


// export const FieldAPI = {
//   // Attendance
//   getTodayAttendance: () => api.get("/attendance/today"),

//   punchIn: (payload: { lat?: number; lng?: number; note?: string; photoUri?: string }) =>
//     api.post("/attendance/punch-in", toForm(payload), {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   punchOut: (payload: { lat?: number; lng?: number; note?: string; photoUri?: string }) =>
//     api.post("/attendance/punch-out", toForm(payload), {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   // Route plan
//   getTodayRoute: () => api.get("/routes/today"),
//   getRouteCustomers: (routeId: number) => api.get(`/routes/${routeId}/customers`),

//   // Visits
//   listTodayVisits: () => api.get("/visits/today"),
//   startVisit: (payload: { customerId: number; notes?: string; lat?: number; lng?: number }) =>
//     api.post("/visits/start", payload),
//   endVisit: (payload: { visitId: number; notes?: string; lat?: number; lng?: number }) =>
//     api.post("/visits/end", payload),

//   // Orders (you already have basic ones; keep)
//   listOrders: (params?: any) => api.get("/orders", { params }),
//   createOrder: (payload: {
//     customerId: number;
//     items: { productId: number; qty: number; price?: number }[];
//     notes?: string;
//   }) => api.post("/orders", payload),

//   // Collections
//   listCollections: () => api.get("/collections"),
//   createCollection: (payload: {
//     customerId: number;
//     orderId?: number;
//     amount: number;
//     method?: string;
//     note?: string;
//   }) => api.post("/collections", payload),

//   // Expenses
//   listExpenses: () => api.get("/expenses"),
//   createExpense: (payload: { amount: number; category?: string; note?: string }) =>
//     api.post("/expenses", payload),
// };










// import { Platform } from "react-native";
// import api from "./api"; // or your axios instance path

// async function uriToBlob(uri: string): Promise<Blob> {
//   const res = await fetch(uri);
//   return await res.blob();
// }

// export const FieldAPI = {
//   getTodayAttendance() {
//     return api.get("/attendance/today");
//   },

//   async punchIn({ lat, lng, photoUri }: { lat: number; lng: number; photoUri: string }) {
//     const fd = new FormData();

//     fd.append("lat", String(lat));
//     fd.append("lng", String(lng));

//     if (Platform.OS === "web") {
//       const blob = await uriToBlob(photoUri);
//       fd.append("photo", blob, `punchin_${Date.now()}.jpg`);
//       // ✅ do NOT set content-type on web
//       return api.post("/attendance/punch-in", fd);
//     } else {
//       fd.append("photo", {
//         uri: photoUri,
//         name: `punchin_${Date.now()}.jpg`,
//         type: "image/jpeg",
//       } as any);

//       return api.post("/attendance/punch-in", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//     }
//   },

//   async punchOut({ lat, lng, photoUri }: { lat: number; lng: number; photoUri: string }) {
//     const fd = new FormData();

//     fd.append("lat", String(lat));
//     fd.append("lng", String(lng));

//     if (Platform.OS === "web") {
//       const blob = await uriToBlob(photoUri);
//       fd.append("photo", blob, `punchout_${Date.now()}.jpg`);
//       // ✅ do NOT set content-type on web
//       return api.post("/attendance/punch-out", fd);
//     } else {
//       fd.append("photo", {
//         uri: photoUri,
//         name: `punchout_${Date.now()}.jpg`,
//         type: "image/jpeg",
//       } as any);

//       return api.post("/attendance/punch-out", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//     }
//   },
// };









// import api from "./api";
// import { Platform } from "react-native";

// async function uriToFilePart(uri: string, filename: string) {
//   // ✅ web needs Blob -> File
//   if (Platform.OS === "web") {
//     const r = await fetch(uri);
//     const blob = await r.blob();
//     return new File([blob], filename, { type: blob.type || "image/jpeg" });
//   }

//   // ✅ native
//   return {
//     uri,
//     name: filename,
//     type: "image/jpeg",
//   } as any;
// }

// export const FieldAPI = {
//   getTodayAttendance() {
//     return api.get("/attendance/today");
//   },

//   punchIn: async ({ lat, lng, photoUri }: any) => {
//     const fd = new FormData();
//     fd.append("lat", String(lat));
//     fd.append("lng", String(lng));

//     const filePart = await uriToFilePart(photoUri, `punchin_${Date.now()}.jpg`);
//     fd.append("photo", filePart as any);

//     return api.post("/attendance/punch-in", fd, {
//       headers: { "Content-Type": "multipart/form-data" },
//       timeout: 120000,
//     });
//   },

//   punchOut: async ({ lat, lng, photoUri }: any) => {
//     const fd = new FormData();
//     fd.append("lat", String(lat));
//     fd.append("lng", String(lng));

//     const filePart = await uriToFilePart(photoUri, `punchout_${Date.now()}.jpg`);
//     fd.append("photo", filePart as any);

//     return api.post("/attendance/punch-out", fd, {
//       headers: { "Content-Type": "multipart/form-data" },
//       timeout: 120000,
//     });
//   },
// };








import api from "./api";
import { Platform } from "react-native";

async function uriToFilePart(uri: string, filename: string) {
  // ✅ web needs Blob -> File
  if (Platform.OS === "web") {
    const r = await fetch(uri);
    const blob = await r.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  }

  // ✅ native
  return {
    uri,
    name: filename,
    type: "image/jpeg",
  } as any;
}

function multipartConfig() {
  // ✅ IMPORTANT: don't set Content-Type manually on web
  if (Platform.OS === "web") {
    return { timeout: 120000 };
  }
  return {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  };
}

export const FieldAPI = {
  getTodayAttendance() {
    return api.get("/attendance/today");
  },

  punchIn: async ({ lat, lng, photoUri }: any) => {
    const fd = new FormData();
    fd.append("lat", String(lat));
    fd.append("lng", String(lng));

    const filePart = await uriToFilePart(photoUri, `punchin_${Date.now()}.jpg`);
    fd.append("photo", filePart as any);

    return api.post("/attendance/punch-in", fd, multipartConfig() as any);
  },

  punchOut: async ({ lat, lng, photoUri }: any) => {
    const fd = new FormData();
    fd.append("lat", String(lat));
    fd.append("lng", String(lng));

    const filePart = await uriToFilePart(photoUri, `punchout_${Date.now()}.jpg`);
    fd.append("photo", filePart as any);

    return api.post("/attendance/punch-out", fd, multipartConfig() as any);
  },
};
