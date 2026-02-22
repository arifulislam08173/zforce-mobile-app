import React, { useContext } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../src/auth/AuthContext";

const colors = {
  bg: "#f3f4f6",
  card: "#0b1220",
  border: "rgba(255,255,255,0.10)",
};

function MenuItem({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      })}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "900" }}>{title}</Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 }}>
      {/* User Card */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
          {user?.name || "Field"}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          {user?.email || ""}
        </Text>
      </View>

      <MenuItem
        title="Route Plan (Today)"
        icon="map-outline"
        onPress={() => router.push("/route-plan")}
      />
      <MenuItem
        title="Visits"
        icon="location-outline"
        onPress={() => router.push("/visits")}
      />
      <MenuItem
        title="Expense"
        icon="cash-outline"
        onPress={() => router.push("/expense")}
      />
      <MenuItem
        title="Collection"
        icon="card-outline"
        onPress={() => router.push("/collection")}
      />

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => ({
          marginTop: 10,
          padding: 14,
          borderRadius: 14,
          alignItems: "center",
          backgroundColor: "#ef4444",
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Logout</Text>
      </Pressable>
    </View>
  );
}
