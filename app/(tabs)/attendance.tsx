// import React, { useEffect, useState } from "react";
// import { Alert, Pressable, Text, View, ActivityIndicator } from "react-native";
// import { FieldAPI } from "../../src/api/field";

// export default function AttendanceScreen() {
//   const [loading, setLoading] = useState(true);
//   const [today, setToday] = useState<any>(null);
//   const [actionLoading, setActionLoading] = useState(false);

//   const load = async () => {
//     try {
//       setLoading(true);
//       const res = await FieldAPI.getTodayAttendance();
//       setToday(res.data);
//     } catch (e: any) {
//       setToday(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const onPunchIn = async () => {
//     try {
//       setActionLoading(true);
//       await FieldAPI.punchIn({});
//       await load();
//       Alert.alert("Done", "Punch in successful");
//     } catch (e: any) {
//       Alert.alert("Failed", e?.response?.data?.message || "Punch in failed");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const onPunchOut = async () => {
//     try {
//       setActionLoading(true);
//       await FieldAPI.punchOut({});
//       await load();
//       Alert.alert("Done", "Punch out successful");
//     } catch (e: any) {
//       Alert.alert("Failed", e?.response?.data?.message || "Punch out failed");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   const punchedIn = !!today?.punchInTime;
//   const punchedOut = !!today?.punchOutTime;

//   return (
//     <View style={{ flex: 1, padding: 16, gap: 12 }}>
//       <View
//         style={{
//           padding: 14,
//           borderRadius: 16,
//           backgroundColor: "#0f172a",
//           borderWidth: 1,
//           borderColor: "rgba(255,255,255,0.08)",
//         }}
//       >
//         <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
//           Today Attendance
//         </Text>

//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
//           Punch In: {today?.punchInTime || "-"}
//         </Text>
//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
//           Punch Out: {today?.punchOutTime || "-"}
//         </Text>
//       </View>

//       <Pressable
//         disabled={actionLoading || punchedIn}
//         onPress={onPunchIn}
//         style={{
//           paddingVertical: 14,
//           borderRadius: 14,
//           alignItems: "center",
//           backgroundColor: actionLoading || punchedIn ? "rgba(34,197,94,0.35)" : "#22c55e",
//         }}
//       >
//         <Text style={{ color: "#fff", fontWeight: "800" }}>
//           {punchedIn ? "Already Punched In" : "Punch In"}
//         </Text>
//       </Pressable>

//       <Pressable
//         disabled={actionLoading || !punchedIn || punchedOut}
//         onPress={onPunchOut}
//         style={{
//           paddingVertical: 14,
//           borderRadius: 14,
//           alignItems: "center",
//           backgroundColor:
//             actionLoading || !punchedIn || punchedOut ? "rgba(239,68,68,0.35)" : "#ef4444",
//         }}
//       >
//         <Text style={{ color: "#fff", fontWeight: "800" }}>
//           {punchedOut ? "Already Punched Out" : "Punch Out"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }











// import React, { useContext, useEffect, useRef, useState } from "react";
// import { Alert, Pressable, Text, View, ActivityIndicator } from "react-native";
// import * as Location from "expo-location";
// import { FieldAPI } from "../../src/api/field";
// import FaceCaptureModal from "../../components/FaceCaptureModal";
// // import AttendanceMap from "../../components/AttendanceMap.web";
// import AttendanceMap from "@/components/AttendanceMap.web";
// import { AuthContext } from "../../src/auth/AuthContext";

// const colors = {
//   bg: "#f3f4f6",
//   card: "#0f172a",
//   border: "rgba(255,255,255,0.08)",
//   green: "#22c55e",
//   red: "#ef4444",
//   blue: "#2563eb",
// };

// export default function AttendanceScreen() {
//   const { booting, token } = useContext(AuthContext);

//   const [loading, setLoading] = useState(true);
//   const [today, setToday] = useState<any>(null);
//   const [actionLoading, setActionLoading] = useState(false);

//   const [locAllowed, setLocAllowed] = useState(false);
//   const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

//   const [cameraOpen, setCameraOpen] = useState(false);
//   const [pendingAction, setPendingAction] = useState<"IN" | "OUT" | null>(null);

//   const watchRef = useRef<Location.LocationSubscription | null>(null);

//   const load = async () => {
//     try {
//       setLoading(true);
//       const res = await FieldAPI.getTodayAttendance();
//       setToday(res.data?.data ?? res.data);
//     } catch (e: any) {
//       // If token missing/expired, avoid spamming alerts here.
//       setToday(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const startLocation = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         setLocAllowed(false);
//         Alert.alert("Permission required", "Location permission is required for attendance.");
//         return;
//       }
//       setLocAllowed(true);

//       const current = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });
//       setCoords({ lat: current.coords.latitude, lng: current.coords.longitude });

//       watchRef.current?.remove();
//       watchRef.current = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.High,
//           timeInterval: 3000,
//           distanceInterval: 3,
//         },
//         (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude })
//       );
//     } catch {
//       setLocAllowed(false);
//     }
//   };

//   // ✅ IMPORTANT: wait until auth restore finished + token exists
//   useEffect(() => {
//     if (booting) return;
//     if (!token) {
//       // user logged out / not restored yet
//       setLoading(false);
//       setToday(null);
//       return;
//     }

//     load();
//     startLocation();

//     return () => {
//       watchRef.current?.remove();
//       watchRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [booting, token]);

//   const punchedIn = !!today?.punchIn;
//   const punchedOut = !!today?.punchOut;

//   const openCameraFor = (mode: "IN" | "OUT") => {
//     if (!locAllowed || !coords) {
//       Alert.alert("Location not ready", "Please wait until location is available.");
//       return;
//     }
//     setPendingAction(mode);
//     setCameraOpen(true);
//   };

//   const onCaptured = async (photoUri: string) => {
//     if (!pendingAction || !coords) return;

//     try {
//       setActionLoading(true);

//       if (pendingAction === "IN") {
//         await FieldAPI.punchIn({ lat: coords.lat, lng: coords.lng, photoUri });
//         Alert.alert("Done", "Punch in successful");
//       } else {
//         await FieldAPI.punchOut({ lat: coords.lat, lng: coords.lng, photoUri });
//         Alert.alert("Done", "Punch out successful");
//       }

//       await load();
//     } catch (e: any) {
//       Alert.alert("Failed", e?.response?.data?.message || "Attendance action failed");
//     } finally {
//       setActionLoading(false);
//       setPendingAction(null);
//       setCameraOpen(false);
//     }
//   };

//   if (booting) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   if (!token) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
//         <Text style={{ fontWeight: "900", fontSize: 16 }}>Please login again</Text>
//         <Text style={{ opacity: 0.7, marginTop: 6, textAlign: "center" }}>
//           Session not found. Go back to login.
//         </Text>
//       </View>
//     );
//   }

//   if (loading) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 }}>
//       <FaceCaptureModal
//         visible={cameraOpen}
//         onClose={() => {
//           setCameraOpen(false);
//           setPendingAction(null);
//         }}
//         onCaptured={onCaptured}
//       />

//       {/* Header actions */}
//       <View style={{ flexDirection: "row", gap: 10 }}>
//         <Pressable
//           onPress={load}
//           style={({ pressed }) => ({
//             flex: 1,
//             height: 46,
//             borderRadius: 14,
//             alignItems: "center",
//             justifyContent: "center",
//             backgroundColor: pressed ? "rgba(37,99,235,0.85)" : colors.blue,
//           })}
//         >
//           <Text style={{ color: "#fff", fontWeight: "900" }}>Refresh</Text>
//         </Pressable>

//         <Pressable
//           onPress={startLocation}
//           style={({ pressed }) => ({
//             height: 46,
//             paddingHorizontal: 14,
//             borderRadius: 14,
//             alignItems: "center",
//             justifyContent: "center",
//             backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)",
//             borderWidth: 1,
//             borderColor: "rgba(0,0,0,0.08)",
//           })}
//         >
//           <Text style={{ fontWeight: "900" }}>GPS</Text>
//         </Pressable>
//       </View>

//       {/* Summary card */}
//       <View
//         style={{
//           padding: 14,
//           borderRadius: 16,
//           backgroundColor: colors.card,
//           borderWidth: 1,
//           borderColor: colors.border,
//         }}
//       >
//         <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Today Attendance</Text>

//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
//           Punch In: {today?.punchIn || "-"}
//         </Text>
//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
//           Punch Out: {today?.punchOut || "-"}
//         </Text>

//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 10 }}>
//           Location:{" "}
//           {coords
//             ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
//             : locAllowed
//             ? "Getting location..."
//             : "Location permission not granted"}
//         </Text>
//       </View>

//       {/* Map */}
//       {coords ? (
//         <AttendanceMap lat={coords.lat} lng={coords.lng} />
//       ) : (
//         <View
//           style={{
//             height: 220,
//             borderRadius: 16,
//             borderWidth: 1,
//             borderColor: "rgba(0,0,0,0.08)",
//             backgroundColor: "#fff",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <Text style={{ fontWeight: "900" }}>Getting location...</Text>
//         </View>
//       )}

//       {/* Punch In */}
//       <Pressable
//         disabled={actionLoading || punchedIn}
//         onPress={() => openCameraFor("IN")}
//         style={({ pressed }) => ({
//           paddingVertical: 14,
//           borderRadius: 14,
//           alignItems: "center",
//           backgroundColor:
//             actionLoading || punchedIn
//               ? "rgba(34,197,94,0.35)"
//               : pressed
//               ? "rgba(34,197,94,0.85)"
//               : colors.green,
//         })}
//       >
//         <Text style={{ color: "#fff", fontWeight: "900" }}>
//           {punchedIn
//             ? "Already Punched In"
//             : actionLoading && pendingAction === "IN"
//             ? "Processing..."
//             : "Punch In (Face + Location)"}
//         </Text>
//       </Pressable>

//       {/* Punch Out */}
//       <Pressable
//         disabled={actionLoading || !punchedIn || punchedOut}
//         onPress={() => openCameraFor("OUT")}
//         style={({ pressed }) => ({
//           paddingVertical: 14,
//           borderRadius: 14,
//           alignItems: "center",
//           backgroundColor:
//             actionLoading || !punchedIn || punchedOut
//               ? "rgba(239,68,68,0.35)"
//               : pressed
//               ? "rgba(239,68,68,0.85)"
//               : colors.red,
//         })}
//       >
//         <Text style={{ color: "#fff", fontWeight: "900" }}>
//           {punchedOut
//             ? "Already Punched Out"
//             : actionLoading && pendingAction === "OUT"
//             ? "Processing..."
//             : "Punch Out (Face + Location)"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }


















// import React, { useContext, useEffect, useRef, useState } from "react";
// import { Alert, Pressable, Text, View, ActivityIndicator } from "react-native";
// import * as Location from "expo-location";
// import { useRouter } from "expo-router";

// import { FieldAPI } from "../../src/api/field";
// import AttendanceMap from "../../components/AttendanceMap";
// import FaceScanModal from "../../components/FaceScanModal";
// import { AuthContext } from "../../src/auth/AuthContext";

// const colors = {
//   bg: "#f3f4f6",
//   card: "#0f172a",
//   border: "rgba(255,255,255,0.08)",
//   green: "#22c55e",
//   red: "#ef4444",
// };

// export default function AttendanceScreen() {
//   const router = useRouter();
//   const { user } = useContext(AuthContext);

//   const [loading, setLoading] = useState(true);
//   const [today, setToday] = useState<any>(null);
//   const [actionLoading, setActionLoading] = useState(false);

//   const [locAllowed, setLocAllowed] = useState(false);
//   const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

//   const [cameraOpen, setCameraOpen] = useState(false);
//   const [pendingAction, setPendingAction] = useState<"IN" | "OUT" | null>(null);

//   const watchRef = useRef<Location.LocationSubscription | null>(null);

//   const load = async () => {
//     const res = await FieldAPI.getTodayAttendance();
//     setToday(res.data?.data ?? res.data);
//   };

//   const startLocation = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       setLocAllowed(false);
//       Alert.alert("Permission required", "Location permission is required for attendance.");
//       return;
//     }

//     setLocAllowed(true);

//     const current = await Location.getCurrentPositionAsync({
//       accuracy: Location.Accuracy.High,
//     });

//     setCoords({ lat: current.coords.latitude, lng: current.coords.longitude });

//     watchRef.current?.remove();
//     watchRef.current = await Location.watchPositionAsync(
//       {
//         accuracy: Location.Accuracy.High,
//         timeInterval: 3000,
//         distanceInterval: 3,
//       },
//       (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude })
//     );
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);

//         // ✅ Force face enroll gate
//         if (user && user.faceEnrolled === false) {
//           router.replace("/face-enroll");
//           return;
//         }

//         await Promise.all([load(), startLocation()]);
//       } catch {
//         // ignore
//       } finally {
//         setLoading(false);
//       }
//     })();

//     return () => {
//       watchRef.current?.remove();
//       watchRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user?.faceEnrolled]);

//   const punchedIn = !!today?.punchIn;
//   const punchedOut = !!today?.punchOut;

//   const openScan = (mode: "IN" | "OUT") => {
//     if (!locAllowed || !coords) {
//       Alert.alert("Location not ready", "Please wait until location is available.");
//       return;
//     }
//     setPendingAction(mode);
//     setCameraOpen(true);
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 }}>
//       <FaceScanModal
//         visible={cameraOpen}
//         title={pendingAction === "IN" ? "Punch In Face Scan" : "Punch Out Face Scan"}
//         subtitle="Keep face centered, good light, hold still"
//         onClose={() => {
//           setCameraOpen(false);
//           setPendingAction(null);
//         }}
//         onVerify={async (photoUri) => {
//           try {
//             if (!pendingAction || !coords) {
//               return { ok: true, match: false, message: "Location not ready" };
//             }

//             setActionLoading(true);

//             if (pendingAction === "IN") {
//               await FieldAPI.punchIn({ lat: coords.lat, lng: coords.lng, photoUri });
//               await load();
//               setCameraOpen(false);
//               setPendingAction(null);
//               return { ok: true, match: true, message: "Punch in successful" };
//             } else {
//               await FieldAPI.punchOut({ lat: coords.lat, lng: coords.lng, photoUri });
//               await load();
//               setCameraOpen(false);
//               setPendingAction(null);
//               return { ok: true, match: true, message: "Punch out successful" };
//             }
//           } catch (e: any) {
//             const msg = e?.response?.data?.message || "Couldn’t detect/match. Try again.";
//             return { ok: true, match: false, message: msg };
//           } finally {
//             setActionLoading(false);
//           }
//         }}
//       />

//       {/* Summary card */}
//       <View
//         style={{
//           padding: 14,
//           borderRadius: 16,
//           backgroundColor: colors.card,
//           borderWidth: 1,
//           borderColor: colors.border,
//         }}
//       >
//         <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Today Attendance</Text>

//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
//           Punch In: {today?.punchIn || "-"}
//         </Text>
//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
//           Punch Out: {today?.punchOut || "-"}
//         </Text>

//         <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 10 }}>
//           Location:{" "}
//           {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Getting location..."}
//         </Text>
//       </View>

//       {/* Map */}
//       {coords ? (
//         <AttendanceMap lat={coords.lat} lng={coords.lng} />
//       ) : (
//         <View
//           style={{
//             height: 220,
//             borderRadius: 16,
//             borderWidth: 1,
//             borderColor: "rgba(0,0,0,0.08)",
//             backgroundColor: "#fff",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <Text style={{ fontWeight: "900" }}>Getting location...</Text>
//         </View>
//       )}

//       {/* Punch In */}
//       <Pressable
//         disabled={actionLoading || punchedIn}
//         onPress={() => openScan("IN")}
//         style={({ pressed }) => ({
//           paddingVertical: 14,
//           borderRadius: 14,
//           alignItems: "center",
//           backgroundColor:
//             actionLoading || punchedIn
//               ? "rgba(34,197,94,0.35)"
//               : pressed
//               ? "rgba(34,197,94,0.85)"
//               : colors.green,
//         })}
//       >
//         <Text style={{ color: "#fff", fontWeight: "900" }}>
//           {punchedIn ? "Already Punched In" : "Punch In (Face Scan)"}
//         </Text>
//       </Pressable>

//       {/* Punch Out */}
//       <Pressable
//         disabled={actionLoading || !punchedIn || punchedOut}
//         onPress={() => openScan("OUT")}
//         style={({ pressed }) => ({
//           paddingVertical: 14,
//           borderRadius: 14,
//           alignItems: "center",
//           backgroundColor:
//             actionLoading || !punchedIn || punchedOut
//               ? "rgba(239,68,68,0.35)"
//               : pressed
//               ? "rgba(239,68,68,0.85)"
//               : colors.red,
//         })}
//       >
//         <Text style={{ color: "#fff", fontWeight: "900" }}>
//           {punchedOut ? "Already Punched Out" : "Punch Out (Face Scan)"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }










import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import { FieldAPI } from "../../src/api/field";
import AttendanceMap from "../../components/AttendanceMap";
import FaceScanModal from "../../components/FaceScanModal";
import { AuthContext } from "../../src/auth/AuthContext";

const colors = {
  bg: "#f3f4f6",
  card: "#0f172a",
  border: "rgba(255,255,255,0.08)",
  green: "#22c55e",
  red: "#ef4444",
};

export default function AttendanceScreen() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [locAllowed, setLocAllowed] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"IN" | "OUT" | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const load = async (aliveRef: { alive: boolean }) => {
    const res = await FieldAPI.getTodayAttendance();
    if (!aliveRef.alive) return;
    setToday(res.data?.data ?? res.data);
  };

  const startLocation = async (aliveRef: { alive: boolean }) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (!aliveRef.alive) return;

    if (status !== "granted") {
      setLocAllowed(false);
      Alert.alert("Permission required", "Location permission is required for attendance.");
      return;
    }

    setLocAllowed(true);

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    if (!aliveRef.alive) return;
    setCoords({ lat: current.coords.latitude, lng: current.coords.longitude });

    try {
      watchRef.current?.remove();
    } catch {}
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 3,
      },
      (p) => {
        // ✅ don’t set state if screen unmounted
        if (!aliveRef.alive) return;
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      }
    );
  };

  useEffect(() => {
    const aliveRef = { alive: true };

    (async () => {
      try {
        setLoading(true);

        // ✅ if logged out / token missing, stop (Auth guard will redirect)
        if (!token || !user) return;

        // ✅ Face enroll gate
        if (user.faceEnrolled === false) {
          router.replace("/face-enroll");
          return;
        }

        await Promise.all([load(aliveRef), startLocation(aliveRef)]);
      } catch {
        // ignore
      } finally {
        if (aliveRef.alive) setLoading(false);
      }
    })();

    return () => {
      aliveRef.alive = false;
      try {
        watchRef.current?.remove();
      } catch {}
      watchRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.faceEnrolled]);

  const punchedIn = !!today?.punchIn;
  const punchedOut = !!today?.punchOut;

  const openScan = (mode: "IN" | "OUT") => {
    if (!locAllowed || !coords) {
      Alert.alert("Location not ready", "Please wait until location is available.");
      return;
    }
    setPendingAction(mode);
    setCameraOpen(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 }}>
      <FaceScanModal
        visible={cameraOpen}
        title={pendingAction === "IN" ? "Punch In Face Scan" : "Punch Out Face Scan"}
        subtitle="Keep face centered, good light, hold still"
        onClose={() => {
          setCameraOpen(false);
          setPendingAction(null);
        }}
        onVerify={async (photoUri) => {
          try {
            if (!pendingAction || !coords) {
              return { ok: true, match: false, message: "Location not ready" };
            }

            setActionLoading(true);

            if (pendingAction === "IN") {
              await FieldAPI.punchIn({ lat: coords.lat, lng: coords.lng, photoUri });
              await FieldAPI.getTodayAttendance().then((res) => setToday(res.data?.data ?? res.data));
              setCameraOpen(false);
              setPendingAction(null);
              return { ok: true, match: true, message: "Punch in successful" };
            } else {
              await FieldAPI.punchOut({ lat: coords.lat, lng: coords.lng, photoUri });
              await FieldAPI.getTodayAttendance().then((res) => setToday(res.data?.data ?? res.data));
              setCameraOpen(false);
              setPendingAction(null);
              return { ok: true, match: true, message: "Punch out successful" };
            }
          } catch (e: any) {
            const msg = e?.response?.data?.message || "Couldn’t detect/match. Try again.";
            return { ok: true, match: false, message: msg };
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Today Attendance</Text>

        <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
          Punch In: {today?.punchIn || "-"}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
          Punch Out: {today?.punchOut || "-"}
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 10 }}>
          Location: {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Getting location..."}
        </Text>
      </View>

      {coords ? (
        <AttendanceMap lat={coords.lat} lng={coords.lng} />
      ) : (
        <View
          style={{
            height: 220,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "900" }}>Getting location...</Text>
        </View>
      )}

      <Pressable
        disabled={actionLoading || punchedIn}
        onPress={() => openScan("IN")}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: "center",
          backgroundColor:
            actionLoading || punchedIn
              ? "rgba(34,197,94,0.35)"
              : pressed
              ? "rgba(34,197,94,0.85)"
              : colors.green,
        })}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          {punchedIn ? "Already Punched In" : "Punch In (Face Scan)"}
        </Text>
      </Pressable>

      <Pressable
        disabled={actionLoading || !punchedIn || punchedOut}
        onPress={() => openScan("OUT")}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: "center",
          backgroundColor:
            actionLoading || !punchedIn || punchedOut
              ? "rgba(239,68,68,0.35)"
              : pressed
              ? "rgba(239,68,68,0.85)"
              : colors.red,
        })}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          {punchedOut ? "Already Punched Out" : "Punch Out (Face Scan)"}
        </Text>
      </Pressable>
    </View>
  );
}
