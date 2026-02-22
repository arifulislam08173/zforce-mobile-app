import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FieldAPI } from "../../src/api/field";

const colors = {
  bg: "#f3f4f6",
  card: "#0b1220",
  border: "rgba(255,255,255,0.10)",
};

export default function Expense() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await FieldAPI.listExpenses();
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    if (!amount) {
      Alert.alert("Required", "Amount is required.");
      return;
    }
    try {
      setActionLoading(true);
      await FieldAPI.createExpense({
        amount: Number(amount),
        category: category || undefined,
        note: note || undefined,
      });
      setAmount("");
      setCategory("");
      setNote("");
      await load();
      Alert.alert("Done", "Expense saved");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Could not save expense");
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
      <Text style={{ fontSize: 18, fontWeight: "900" }}>Expense</Text>

      <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>New Expense</Text>

        <TextInput placeholder="Amount" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="decimal-pad"
          value={amount} onChangeText={setAmount} style={inputStyle} />

        <TextInput placeholder="Category (optional)" placeholderTextColor="rgba(255,255,255,0.35)"
          value={category} onChangeText={setCategory} style={inputStyle} />

        <TextInput placeholder="Note (optional)" placeholderTextColor="rgba(255,255,255,0.35)" multiline
          value={note} onChangeText={setNote} style={[inputStyle, { minHeight: 90, textAlignVertical: "top" as any }]} />

        <Pressable disabled={actionLoading} onPress={onSave}
          style={({ pressed }) => ({
            paddingVertical: 14, borderRadius: 14, alignItems: "center",
            backgroundColor: actionLoading ? "rgba(239,68,68,0.35)" : pressed ? "rgba(239,68,68,0.85)" : "#ef4444",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>{actionLoading ? "Saving..." : "Save"}</Text>
        </Pressable>

        <Pressable onPress={load}
          style={({ pressed }) => ({
            paddingVertical: 12, borderRadius: 14, alignItems: "center",
            backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Refresh</Text>
        </Pressable>
      </View>

      <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>Recent ({list.length})</Text>

        {list.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>No expenses found.</Text>
        ) : (
          list.slice(0, 20).map((x, idx) => (
            <View key={String(x?.id || idx)} style={rowStyle}>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}>
                {x?.createdAt || "-"} • {x?.category || "Expense"}
              </Text>
              <Text style={{ color: "#fff", fontWeight: "900", marginTop: 4 }}>
                Amount: {Number(x?.amount || 0).toFixed(2)}
              </Text>
              {!!x?.note && <Text style={{ color: "rgba(255,255,255,0.7)" }}>{x.note}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const inputStyle = {
  padding: 12,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.12)",
  color: "#fff",
  backgroundColor: "rgba(255,255,255,0.03)",
};

const rowStyle = {
  padding: 12,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.10)",
  backgroundColor: "rgba(255,255,255,0.03)",
  gap: 4,
};
