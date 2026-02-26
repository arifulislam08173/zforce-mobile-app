import React, { useContext, useEffect, useState } from "react";
import { Alert, Pressable, Text, View, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import FaceCaptureModal from "../components/FaceCaptureModal";
import api from "../src/api/api";
import { AuthContext } from "../src/auth/AuthContext";
import { setItem, USER_KEY } from "../src/storage/token";

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}

export default function FaceEnrollScreen() {
  const router = useRouter();
  const { user, setUser, ready } = useContext(AuthContext);

  useEffect(() => {
    if (!ready) return;
    if (user?.faceEnrolled) {
      router.replace("/(tabs)");
    }
  }, [ready, user?.faceEnrolled]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCaptured = async (photoUri: string) => {
    try {
      setLoading(true);

      const fd = new FormData();

      if (Platform.OS === "web") {
        const blob = await uriToBlob(photoUri);
        fd.append("photo", blob, `enroll_${Date.now()}.jpg`);
      } else {
        fd.append("photo", {
          uri: photoUri,
          name: `enroll_${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
      }

      const config =
        Platform.OS === "web"
          ? {}
          : { headers: { "Content-Type": "multipart/form-data" } };

      await api.post("/face/enroll", fd, config as any);

      const updated = { ...(user ?? {}), faceEnrolled: true };
      setUser(updated);
      await setItem(USER_KEY, JSON.stringify(updated));

      Alert.alert("Done", "Face enrolled successfully.");
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Face enroll failed");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", padding: 16, gap: 12 }}>
      <FaceCaptureModal visible={open} onClose={() => setOpen(false)} onCaptured={onCaptured} />

      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Face Enrollment</Text>
      <Text style={{ color: "rgba(255,255,255,0.7)" }}>
        You must enroll your face once before using attendance.
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        disabled={loading}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? "rgba(37,99,235,0.85)" : "#2563eb",
          opacity: loading ? 0.7 : 1,
          marginTop: 10,
        })}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "900" }}>Capture & Enroll</Text>
        )}
      </Pressable>

      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 10 }}>
        Tips: good light, front face, remove mask, hold still.
      </Text>
    </View>
  );
}
