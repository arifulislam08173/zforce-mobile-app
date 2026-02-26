import React from "react";
import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontWeight: "900" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Orders" }} />
      <Stack.Screen name="new" options={{ title: "Create Order" }} />
      <Stack.Screen name="[id]" options={{ title: "Order Details" }} />
    </Stack>
  );
}