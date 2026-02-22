import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FieldAPI } from "../../src/api/field";
import { useLocalSearchParams } from "expo-router";

const colors = {
  bg: "#f3f4f6",
  card: "#0b1220",
  border: "rgba(255,255,255,0.10)",
};

export default function VisitsScreen() {
  const params = useLocalSearchParams<{ customerId?: string }>();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  // customerId from route-plan (optional)
  const [customerId, setCustomerId] = useState(params.customerId || "");
  const [note, setNote] = useState("");

  const openVisit = useMemo(() => list.find((v) => v?.status === "OPEN" || !v?.endTime), [list]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await FieldAPI.listTodayVisits();
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onStart = async () => {
    if (!customerId) {
      Alert.alert("Required", "Customer ID is required (open from Route Plan or enter ID).");
      return;
    }
    try {
      setActionLoading(true);
      await FieldAPI.startVisit({ customerId: Number(customerId), notes: note || undefined });
      setNote("");
      await load();
      Alert.alert("Done", "Visit started");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Could not start visit");
    } finally {
      setActionLoading(false);
    }
  };

  const onEnd = async () => {
    if (!openVisit?.id) return;
    try {
      setActionLoading(true);
      await FieldAPI.endVisit({ visitId: Number(openVisit.id), notes: note || undefined });
      setNote("");
      await load();
      Alert.alert("Done", "Visit ended");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Could not end visit");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>Visits</Text>

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Visit Action</Text>

        {!openVisit && (
          <>
            <Text style={{ color: "rgba(255,255,255,0.75)" }}>Customer ID</Text>
            <TextInput
              value={customerId}
              onChangeText={setCustomerId}
              placeholder="e.g. 123"
              placeholderTextColor="rgba(255,255,255,0.35)"
              keyboardType="number-pad"
              style={{
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            />
          </>
        )}

        <Text style={{ color: "rgba(255,255,255,0.75)" }}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Write note..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          style={{
            minHeight: 90,
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.03)",
            textAlignVertical: "top",
          }}
        />

        {!openVisit ? (
          <Pressable
            disabled={actionLoading}
            onPress={onStart}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: actionLoading ? "rgba(37,99,235,0.35)" : pressed ? "rgba(37,99,235,0.85)" : "#2563eb",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {actionLoading ? "Starting..." : "Start Visit"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={actionLoading}
            onPress={onEnd}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: actionLoading ? "rgba(239,68,68,0.35)" : pressed ? "rgba(239,68,68,0.85)" : "#ef4444",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {actionLoading ? "Ending..." : "End Visit"}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={load}
          style={({ pressed }) => ({
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: "center",
            backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Refresh</Text>
        </Pressable>
      </View>

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Today Visits ({list.length})</Text>

        {list.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>No visits yet.</Text>
        ) : (
          list.map((v, idx) => (
            <View
              key={String(v?.id || idx)}
              style={{
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.03)",
                gap: 4,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}>
                {v?.status || (v?.endTime ? "CLOSED" : "OPEN")}
              </Text>
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {v?.customerName || v?.customer?.name || "Customer"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                Start: {v?.startTime || "-"} • End: {v?.endTime || "-"}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
