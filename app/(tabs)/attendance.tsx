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


function fmtPunchDT(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);

  // Example output: 26-Feb-2026 10:30 AM
  const datePart = d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-"); // "26 Feb 2026" -> "26-Feb-2026"

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} ${timePart}`;
}

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
        // don’t set state if screen unmounted
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

        // if logged out / token missing, stop (Auth guard will redirect)
        if (!token || !user) return;

        // Face enroll gate
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
          {/* Punch In: {today?.punchIn || "-"} */}
          Punch In: {fmtPunchDT(today?.punchIn)}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
          {/* Punch Out: {today?.punchOut || "-"} */}
          Punch Out: {fmtPunchDT(today?.punchOut)}
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
