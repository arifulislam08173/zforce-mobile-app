import React, { useContext } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { AuthContext } from "../src/auth/AuthContext";

export default function Index() {
  const { ready, token, user } = useContext(AuthContext);
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!token) return <Redirect href="/(auth)/login" />;

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!user.faceEnrolled) return <Redirect href="/face-enroll" />;

  return <Redirect href="/(tabs)" />;
}