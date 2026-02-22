import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import api from "../../src/api/api";

type Stats = {
  totalCustomers?: number;
  totalVisits?: number;
  totalOrders?: number;
  totalCollections?: number;
  totalExpenses?: number;
};

const Card = ({ title, value }: { title: string; value: any }) => (
  <View
    style={{
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: "rgba(17,24,39,0.08)",
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 18,
      elevation: 2,
      marginBottom: 12,
    }}
  >
    <Text style={{ color: "#6b7280", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
      {title}
    </Text>
    <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "900", marginTop: 8 }}>
      {value ?? 0}
    </Text>
  </View>
);

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    (async () => {
      try {
        // Use your backend endpoint (adjust if different)
        const res = await api.get("/dashboard/stats");
        setStats(res.data || {});
      } catch (e) {
        setStats({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f6f7fb" }}
      contentContainerStyle={{ padding: 14, paddingBottom: 28 }}
    >
      <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a", marginBottom: 10 }}>
        Field Dashboard
      </Text>

      <Card title="Customers" value={stats.totalCustomers} />
      <Card title="Visits" value={stats.totalVisits} />
      <Card title="Orders" value={stats.totalOrders} />
      <Card title="Collections" value={stats.totalCollections} />
      <Card title="Expenses" value={stats.totalExpenses} />
    </ScrollView>
  );
}
