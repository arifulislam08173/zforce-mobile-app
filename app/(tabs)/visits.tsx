import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  FlatList,
  Text,
  TextInput,
  View,
  Linking,
  Modal,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";

import DateTimePickerModal from "../../components/DateTimePickerModal";
import CustomerPickerModal from "../../components/CustomerPickerModal";
import PlanVisitModal from "../../components/PlanVisitModal";

import { fetchCustomersDropdown } from "../../src/api/routePlan";
import { checkInVisit, checkOutVisit, fetchMyVisits, VisitRow } from "../../src/api/visits";

const UI = {
  bg: "#f6f7fb",
  card: "#ffffff",
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
  danger: "#ef4444",
  soft: "rgba(37,99,235,0.08)",
};

function formatYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDayBounds(fromYmd: string, toYmd: string) {
  const fromDate = fromYmd ? `${fromYmd}T00:00:00.000Z` : "";
  const toDate = toYmd ? `${toYmd}T23:59:59.999Z` : "";
  return { fromDate, toDate };
}

function fmtDT(v?: string | null) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function reverseGeocodeOSM({ lat, lng }: { lat: number; lng: number }) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();

  const a = json?.address || {};
  const parts = [a.road, a.neighbourhood, a.suburb, a.city || a.town || a.village, a.state].filter(Boolean);

  const short = parts.slice(0, 3).join(", ");
  const full = json?.display_name || short || "";
  return { short, full };
}

function getOsmOpenUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = String(status || "").toUpperCase();
  const style =
    s === "COMPLETED"
      ? { bg: "rgba(16,185,129,0.12)", bd: "rgba(16,185,129,0.25)", tx: "#065f46" }
      : s === "IN_PROGRESS"
      ? { bg: "rgba(37,99,235,0.12)", bd: "rgba(37,99,235,0.25)", tx: "#1d4ed8" }
      : s === "PLANNED"
      ? { bg: "rgba(15,23,42,0.06)", bd: "rgba(15,23,42,0.12)", tx: UI.text }
      : { bg: "rgba(107,114,128,0.12)", bd: "rgba(107,114,128,0.25)", tx: "#374151" };

  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: style.bd,
        backgroundColor: style.bg,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontWeight: "900", color: style.tx, fontSize: 12 }}>{s || "-"}</Text>
    </View>
  );
}

function Pill({
  label,
  value,
  onPress,
  onClear,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: UI.border,
        backgroundColor: pressed ? "rgba(15,23,42,0.03)" : "#fff",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: UI.sub }}>{label.toUpperCase()}</Text>
        <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "800", color: UI.text }} numberOfLines={1}>
          {value || "All"}
        </Text>
      </View>

      {value && onClear ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 10,
            backgroundColor: "rgba(15,23,42,0.06)",
          }}
        >
          <Text style={{ fontWeight: "900", color: UI.text }}>×</Text>
        </Pressable>
      ) : (
        <Text style={{ fontWeight: "900", color: UI.sub }}>›</Text>
      )}
    </Pressable>
  );
}

function LiveLocationModal({
  open,
  title,
  withNotes,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  withNotes: boolean;
  onClose: () => void;
  onConfirm: (payload: { latitude: number; longitude: number; notes?: string | null }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [place, setPlace] = useState("");
  const [placeFull, setPlaceFull] = useState("");
  const [placeLoading, setPlaceLoading] = useState(false);

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "locating" | "live" | "stopped">("idle");

  const subRef = useRef<any>(null);
  const lastGeoRef = useRef<{ key: string; ts: number }>({ key: "", ts: 0 });

  const stopWatch = async () => {
    try {
      subRef.current?.remove?.();
    } catch {}
    subRef.current = null;
    setStatus("stopped");
  };

  const tryReverse = async (la: number, ln: number) => {
    const key = `${la.toFixed(5)},${ln.toFixed(5)}`;
    const now = Date.now();
    const should = lastGeoRef.current.key !== key || now - lastGeoRef.current.ts > 15_000;
    if (!should) return;

    lastGeoRef.current = { key, ts: now };
    setPlaceLoading(true);
    try {
      const r = await reverseGeocodeOSM({ lat: la, lng: ln });
      setPlace(r.short || "");
      setPlaceFull(r.full || r.short || "");
    } finally {
      setPlaceLoading(false);
    }
  };

  const startLive = async () => {
    setErr("");
    setStatus("locating");
    await stopWatch();

    if (Platform.OS === "web") {
      if (!navigator.geolocation) {
        setErr("Geolocation not supported in this browser.");
        setStatus("stopped");
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const la = pos?.coords?.latitude;
          const ln = pos?.coords?.longitude;
          const acc = pos?.coords?.accuracy;
          if (Number.isFinite(la) && Number.isFinite(ln)) {
            setLat(la);
            setLng(ln);
            setAccuracy(Number.isFinite(acc) ? acc : null);
            setStatus("live");
            tryReverse(la, ln);
          }
        },
        (e) => {
          const msg =
            e?.code === 1
              ? "Location permission denied. Please allow location access."
              : e?.code === 2
              ? "Location unavailable. Try turning on GPS."
              : "Location request timed out. Tap Refresh.";
          setErr(msg);
          setStatus("stopped");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      subRef.current = { remove: () => navigator.geolocation.clearWatch(id) };
      return;
    }

    // ✅ NATIVE (expo-location)
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setErr("Location permission denied. Please allow location access.");
        setStatus("stopped");
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const la = current?.coords?.latitude;
      const ln = current?.coords?.longitude;
      const acc = current?.coords?.accuracy;

      if (Number.isFinite(la) && Number.isFinite(ln)) {
        setLat(la);
        setLng(ln);
        setAccuracy(Number.isFinite(acc) ? acc : null);
        setStatus("live");
        tryReverse(la, ln);
      }

      subRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 2000, distanceInterval: 1 },
        (pos) => {
          const la2 = pos?.coords?.latitude;
          const ln2 = pos?.coords?.longitude;
          const acc2 = pos?.coords?.accuracy;
          if (Number.isFinite(la2) && Number.isFinite(ln2)) {
            setLat(la2);
            setLng(ln2);
            setAccuracy(Number.isFinite(acc2) ? acc2 : null);
            setStatus("live");
            tryReverse(la2, ln2);
          }
        }
      );
    } catch {
      setErr("Location unavailable. Try turning on GPS.");
      setStatus("stopped");
    }
  };

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setErr("");
    setLat(null);
    setLng(null);
    setAccuracy(null);
    setPlace("");
    setPlaceFull("");
    setPlaceLoading(false);
    setNotes("");
    setStatus("idle");
    lastGeoRef.current = { key: "", ts: 0 };

    startLive();
    return () => {
      stopWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setErr("");
    if (lat == null || lng == null) {
      setErr("Location not ready yet. Please wait or tap Refresh.");
      return;
    }

    try {
      setSaving(true);
      await onConfirm({ latitude: lat, longitude: lng, ...(withNotes ? { notes: notes || null } : {}) });
      await stopWatch();
      onClose();
    } catch (e2: any) {
      setErr(e2?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const badge =
    status === "locating" ? "Locating…" : status === "live" ? "Live" : status === "stopped" ? "Stopped" : "Idle";

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
      <Pressable
        onPress={() => {
          stopWatch();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15,23,42,0.45)",
          padding: 16,
          justifyContent: "center",
          zIndex: 999999,
          elevation: 999999,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: UI.border,
            width: "100%",
            maxWidth: 560,
            alignSelf: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>{title}</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 12 }}>
            Auto-capturing live location from device
          </Text>

          {err ? (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(180,35,24,0.18)",
                backgroundColor: "rgba(180,35,24,0.08)",
              }}
            >
              <Text style={{ color: "#7a1b12", fontWeight: "800" }}>{err}</Text>
            </View>
          ) : null}

          <View
            style={{
              marginTop: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: UI.border,
              backgroundColor: "#fff",
              padding: 12,
              gap: 10,
            }}
          >
            <Text style={{ fontWeight: "900", color: UI.text }}>{badge}</Text>
            <Text style={{ color: UI.sub, fontWeight: "700" }}>
              {lat != null && lng != null ? `${lat}, ${lng}` : "Waiting for coordinates..."}
              {accuracy != null ? ` (±${Math.round(accuracy)}m)` : ""}
            </Text>

            <Text style={{ color: UI.sub, fontWeight: "700" }}>
              {placeLoading ? "Detecting place..." : place || placeFull ? placeFull : ""}
            </Text>

            {lat != null && lng != null ? (
              <Pressable
                onPress={() => Linking.openURL(getOsmOpenUrl(lat, lng))}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
                })}
              >
                <Text style={{ fontWeight: "900", color: UI.text }}>Open Map</Text>
              </Pressable>
            ) : null}

            {withNotes ? (
              <View>
                <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>NOTES (OPTIONAL)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Write note..."
                  style={{
                    marginTop: 8,
                    minHeight: 90,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: UI.border,
                    backgroundColor: "#fff",
                    textAlignVertical: "top",
                    fontWeight: "700",
                    color: UI.text,
                  }}
                  multiline
                />
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Pressable
              disabled={saving}
              onPress={() => {
                stopWatch();
                onClose();
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(15,23,42,0.10)" : "rgba(15,23,42,0.06)",
                borderWidth: 1,
                borderColor: UI.border,
                opacity: saving ? 0.6 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: UI.text }}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={startLive}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(15,23,42,0.10)" : "rgba(15,23,42,0.06)",
                borderWidth: 1,
                borderColor: UI.border,
                opacity: saving ? 0.6 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: UI.text }}>Refresh</Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={submit}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
                opacity: saving ? 0.6 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: "#fff" }}>{saving ? "Saving..." : "Confirm"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function VisitsScreen() {
  const params = useLocalSearchParams<{ customerId?: string }>();

  const [customers, setCustomers] = useState<any[]>([]);
  const customerMap = useMemo(() => new Map((customers || []).map((c) => [String(c.id), c])), [customers]);

  const [rows, setRows] = useState<VisitRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const today = useMemo(() => formatYMD(new Date()), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");

  const highlightCustomerId = String(params.customerId || "");

  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [pickCustomer, setPickCustomer] = useState(false);

  const [geoOpen, setGeoOpen] = useState(false);
  const [geoTitle, setGeoTitle] = useState("");
  const [geoWithNotes, setGeoWithNotes] = useState(false);
  const [geoVisitId, setGeoVisitId] = useState<string>("");

  const [planOpen, setPlanOpen] = useState(false);

  const reqSeq = useRef(0);

  const selectedCustomerName = useMemo(() => {
    if (!customerId) return "";
    const c = customers.find((x) => String(x?.id) === String(customerId));
    return c?.name || "";
  }, [customers, customerId]);

  async function loadCustomers() {
    try {
      const data = await fetchCustomersDropdown();
      setCustomers(data || []);
    } catch {
      setCustomers([]);
    }
  }

  const buildParams = (p: number) => {
    const { fromDate, toDate } = toDayBounds(from, to);
    return {
      page: p,
      limit,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      status: status || undefined,
    };
  };

  async function fetchPage(p: number, mode: "initial" | "refresh" | "more") {
    const seq = ++reqSeq.current;

    if (mode === "initial") setLoadingInitial(true);
    if (mode === "refresh") setRefreshing(true);
    if (mode === "more") setLoadingMore(true);

    try {
      const data = await fetchMyVisits(buildParams(p));
      if (seq !== reqSeq.current) return;

      const list = data?.data || [];
      const pag = data?.pagination;

      setTotalPages(pag?.totalPages || 1);

      if (p === 1) setRows(list);
      else {
        setRows((prev) => {
          const map = new Map(prev.map((x) => [String(x.id), x]));
          list.forEach((x) => map.set(String(x.id), x));
          return Array.from(map.values());
        });
      }

      setPage(p);
    } finally {
      if (mode === "initial") setLoadingInitial(false);
      if (mode === "refresh") setRefreshing(false);
      if (mode === "more") setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    fetchPage(1, rows.length ? "refresh" : "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status]);

  const onRefresh = async () => {
    await fetchPage(1, "refresh");
  };

  const onLoadMore = async () => {
    if (loadingInitial || refreshing || loadingMore) return;
    if (page >= totalPages) return;
    await fetchPage(page + 1, "more");
  };

  const resetFilters = () => {
    setFrom(today);
    setTo(today);
    setStatus("");
    setCustomerId("");
  };

  const openCheckIn = (visitId: string) => {
    setGeoVisitId(visitId);
    setGeoTitle("Check In");
    setGeoWithNotes(false);
    setGeoOpen(true);
  };

  const openCheckOut = (visitId: string) => {
    setGeoVisitId(visitId);
    setGeoTitle("Check Out");
    setGeoWithNotes(true);
    setGeoOpen(true);
  };

  const displayRows = useMemo(() => {
    let list = rows;

    // optional customer filter (client-side)
    if (customerId) list = list.filter((v) => String(v.customerId) === String(customerId));

    // highlight from route-plan: sort to top
    if (highlightCustomerId) {
      const top: VisitRow[] = [];
      const rest: VisitRow[] = [];
      list.forEach((v) => (String(v.customerId) === highlightCustomerId ? top.push(v) : rest.push(v)));
      list = [...top, ...rest];
    }

    return list;
  }, [rows, customerId, highlightCustomerId]);

  if (loadingInitial && rows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: UI.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.bg }}>
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: UI.text }}>Visits</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 13 }}>
            Plan visits + check in / check out with live GPS.
          </Text>
        </View>

        <Pressable
          onPress={() => setPlanOpen(true)}
          style={({ pressed }) => ({
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>+ Plan</Text>
        </Pressable>
      </View>

      {/* Filters card */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 12,
          borderRadius: 16,
          backgroundColor: UI.card,
          borderWidth: 1,
          borderColor: UI.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Pill label="From" value={from} onPress={() => setOpenFrom(true)} onClear={() => setFrom(today)} />
          </View>
          <View style={{ flex: 1 }}>
            <Pill label="To" value={to} onPress={() => setOpenTo(true)} onClear={() => setTo(today)} />
          </View>
        </View>

        <Pill
          label="Customer"
          value={selectedCustomerName}
          onPress={() => setPickCustomer(true)}
          onClear={() => setCustomerId("")}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => {
              const s = String(status || "").toUpperCase();
              const next =
                s === "" ? "PLANNED" : s === "PLANNED" ? "IN_PROGRESS" : s === "IN_PROGRESS" ? "COMPLETED" : "";
              setStatus(next);
            }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
              borderWidth: 1,
              borderColor: UI.border,
            })}
          >
            <Text style={{ fontWeight: "900", color: UI.text }}>
              Status: {status ? String(status).toUpperCase() : "ALL"}
            </Text>
          </Pressable>

          <Pressable
            onPress={resetFilters}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? "rgba(37,99,235,0.12)" : UI.soft,
              borderWidth: 1,
              borderColor: "rgba(37,99,235,0.20)",
            })}
          >
            <Text style={{ fontWeight: "900", color: "#2563eb" }}>Reset</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => ({
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
            borderWidth: 1,
            borderColor: UI.border,
          })}
        >
          <Text style={{ fontWeight: "900", color: UI.text }}>Refresh</Text>
        </Pressable>

        <Text style={{ color: UI.sub, fontWeight: "700", fontSize: 12 }}>
          Page {page} / {totalPages}
        </Text>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
        data={displayRows}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          <View style={{ paddingVertical: 16 }}>
            {loadingMore ? <ActivityIndicator /> : null}

            {!loadingMore && page < totalPages ? (
              <Pressable
                onPress={onLoadMore}
                style={({ pressed }) => ({
                  marginTop: 10,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
                  borderWidth: 1,
                  borderColor: UI.border,
                })}
              >
                <Text style={{ fontWeight: "900", color: UI.text }}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: UI.card,
              borderWidth: 1,
              borderColor: UI.border,
            }}
          >
            <Text style={{ fontWeight: "900", color: UI.text }}>No visits found</Text>
            <Text style={{ marginTop: 6, color: UI.sub, fontWeight: "700" }}>
              Try changing date range, customer, or status.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const c = customerMap.get(String(item.customerId));
          const s = String(item.status || "").toUpperCase();

          const canCheckIn = !item.checkInAt && s === "PLANNED";
          const canCheckOut = Boolean(item.checkInAt) && !item.checkOutAt && s === "IN_PROGRESS";

          return (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: UI.card,
                borderWidth: 1,
                borderColor: UI.border,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900" }}>PLANNED</Text>
                  <Text style={{ marginTop: 4, color: UI.text, fontWeight: "900", fontSize: 14 }}>
                    {fmtDT(item.plannedAt)}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <StatusBadge status={item.status} />
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900" }}>CUSTOMER</Text>
                <Text style={{ marginTop: 4, color: UI.text, fontWeight: "900", fontSize: 15 }} numberOfLines={1}>
                  {c?.name || item.customerId || "-"}
                </Text>
                {c?.phone ? (
                  <Text style={{ marginTop: 2, color: UI.sub, fontWeight: "700" }}>Phone: {c.phone}</Text>
                ) : null}
              </View>

              <View style={{ marginTop: 10, gap: 6 }}>
                <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900" }}>CHECK IN</Text>
                <Text style={{ color: UI.text, fontWeight: "800" }}>{fmtDT(item.checkInAt)}</Text>

                <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900", marginTop: 6 }}>CHECK OUT</Text>
                <Text style={{ color: UI.text, fontWeight: "800" }}>{fmtDT(item.checkOutAt)}</Text>
              </View>

              {item.notes ? (
                <Text style={{ marginTop: 10, color: UI.sub, fontWeight: "700" }} numberOfLines={2}>
                  Notes: {item.notes}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable
                  disabled={!canCheckIn}
                  onPress={() => {
                    setGeoVisitId(String(item.id));
                    setGeoTitle("Check In");
                    setGeoWithNotes(false);
                    setGeoOpen(true);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: !canCheckIn
                      ? "rgba(15,23,42,0.05)"
                      : pressed
                      ? "rgba(37,99,235,0.85)"
                      : UI.primary,
                    opacity: canCheckIn ? 1 : 0.6,
                  })}
                >
                  <Text style={{ color: canCheckIn ? "#fff" : UI.sub, fontWeight: "900" }}>Check In</Text>
                </Pressable>

                <Pressable
                  disabled={!canCheckOut}
                  onPress={() => {
                    setGeoVisitId(String(item.id));
                    setGeoTitle("Check Out");
                    setGeoWithNotes(true);
                    setGeoOpen(true);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: !canCheckOut
                      ? "rgba(15,23,42,0.05)"
                      : pressed
                      ? "rgba(239,68,68,0.85)"
                      : UI.danger,
                    opacity: canCheckOut ? 1 : 0.6,
                  })}
                >
                  <Text style={{ color: canCheckOut ? "#fff" : UI.sub, fontWeight: "900" }}>Check Out</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Filters modals */}
      <DateTimePickerModal
        open={openFrom}
        title="Pick From Date"
        mode="date"
        value={from}
        onClose={() => setOpenFrom(false)}
        onApply={(v) => setFrom(v)}
      />
      <DateTimePickerModal
        open={openTo}
        title="Pick To Date"
        mode="date"
        value={to}
        onClose={() => setOpenTo(false)}
        onApply={(v) => setTo(v)}
      />

      <CustomerPickerModal
        open={pickCustomer}
        customers={customers}
        selectedId={customerId}
        onClose={() => setPickCustomer(false)}
        onSelect={(id) => setCustomerId(id)}
        allowAll={true}
      />

      {/* Live GPS modal */}
      <LiveLocationModal
        open={geoOpen}
        title={geoTitle}
        withNotes={geoWithNotes}
        onClose={() => setGeoOpen(false)}
        onConfirm={async (payload) => {
          if (!geoVisitId) return;
          if (geoWithNotes) await checkOutVisit(geoVisitId, payload);
          else await checkInVisit(geoVisitId, payload);
          await fetchPage(1, "refresh");
        }}
      />

      {/* Plan modal (separate file) */}
      <PlanVisitModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        customers={customers}
        presetCustomerId={highlightCustomerId || ""}
        onCreated={async () => {
          // After planning, refresh list
          await fetchPage(1, "refresh");
        }}
      />
    </View>
  );
}