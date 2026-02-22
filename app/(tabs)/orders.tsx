import React from "react";
import { Text, View } from "react-native";

export default function OrdersScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Orders</Text>
      <Text style={{ marginTop: 8 }}>Coming soon…</Text>
    </View>
  );
}
