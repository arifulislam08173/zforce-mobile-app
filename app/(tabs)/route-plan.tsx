import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, Alert, ScrollView } from "react-native";
import { FieldAPI } from "../../src/api/field";
import { useRouter } from "expo-router";

const colors = {
  bg: "#f3f4f6",
  card: "#0b1220",
  border: "rgba(255,255,255,0.10)",
};

export default function RoutePlanScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await FieldAPI.getTodayRoute();
      const r = res.data;
      setRoute(r);

      if (r?.id) {
        const cus = await FieldAPI.getRouteCustomers(Number(r.id));
        setCustomers(Array.isArray(cus.data) ? cus.data : []);
      } else {
        setCustomers([]);
      }
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Could not load route plan");
      setRoute(null);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>Today Route Plan</Text>

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          Route: {route?.name || "-"}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
          Date: {route?.date || "-"}
        </Text>
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
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          Customers ({customers.length})
        </Text>

        {customers.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>No customers found.</Text>
        ) : (
          customers.map((c: any, idx: number) => (
            <View
              key={String(c?.id || idx)}
              style={{
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.03)",
                gap: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {c?.name || c?.customerName || `Customer ${idx + 1}`}
              </Text>
              {!!(c?.address) && (
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>{c.address}</Text>
              )}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/visits",
                    params: { customerId: String(c?.id) },
                  })
                }
                style={({ pressed }) => ({
                  marginTop: 6,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: pressed ? "rgba(37,99,235,0.85)" : "#2563eb",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Start Visit</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          onPress={load}
          style={({ pressed }) => ({
            marginTop: 4,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Refresh</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
