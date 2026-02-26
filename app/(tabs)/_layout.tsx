import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Base bar size + safe-area
  const baseHeight = Platform.OS === "ios" ? 62 : 58;
  const extraBottom = Platform.OS === "web" ? 10 : 6; // web preview needs a bit more
  const barHeight = baseHeight + insets.bottom + extraBottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",

        // FIX clipping (safe-area aware)
        tabBarStyle: {
          height: barHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom + extraBottom,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.08)",
        },

        // pull label UP a bit
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          marginBottom: 2,
          lineHeight: 14,
        },

        tabBarIconStyle: {
          marginTop: 2,
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },

        headerTitleStyle: { fontWeight: "900" },

        // optional (nice)
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" color={color} size={size} />
          ),
        }}
      />

      {/* hide extras */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="visits" options={{ href: null }} />
      <Tabs.Screen name="route-plan" options={{ href: null }} />
      <Tabs.Screen name="expense" options={{ href: null }} />
      <Tabs.Screen name="collection" options={{ href: null }} />
      <Tabs.Screen name="modal" options={{ href: null }} />
    </Tabs>
  );
}
