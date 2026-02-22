import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, ActivityIndicator, Image, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptured: (photoUri: string) => void;
};

export default function FaceCaptureModal({ visible, onClose, onCaptured }: Props) {
  const camRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [capturing, setCapturing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setPhotoUri(null);
  }, [visible]);

  const ensurePerm = async () => {
    if (permission?.granted) return true;
    const res = await requestPermission();
    return !!res.granted;
  };

  const take = async () => {
    const ok = await ensurePerm();
    if (!ok) {
      Alert.alert("Permission required", "Camera permission is required.");
      return;
    }

    try {
      setCapturing(true);
      const pic = await camRef.current?.takePictureAsync({
        quality: 0.9,
        exif: false,
        skipProcessing: false,
      });
      if (!pic?.uri) throw new Error("No photo uri");
      setPhotoUri(pic.uri);
    } catch (e) {
      Alert.alert("Failed", "Could not capture photo");
    } finally {
      setCapturing(false);
    }
  };

  const confirm = () => {
    if (!photoUri) return;
    onCaptured(photoUri);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0b1220" }}>
        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>Face Verification</Text>
          <Text style={{ color: "rgba(255,255,255,0.70)", marginTop: 4 }}>
            Use front camera and capture your face.
          </Text>
        </View>

        {!photoUri ? (
          <View style={{ flex: 1 }}>
            <CameraView
              ref={camRef}
              style={{ flex: 1 }}
              facing="front"
            />

            <View style={{ padding: 14, gap: 10 }}>
              <Pressable
                disabled={capturing}
                onPress={take}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? "rgba(37,99,235,0.85)" : "#2563eb",
                  opacity: capturing ? 0.6 : 1,
                })}
              >
                {capturing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Capture</Text>
                )}
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
            <View style={{ padding: 14, gap: 10 }}>
              <Pressable
                onPress={confirm}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? "rgba(34,197,94,0.85)" : "#22c55e",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>OK, Use This</Text>
              </Pressable>

              <Pressable
                onPress={() => setPhotoUri(null)}
                style={({ pressed }) => ({
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Retake</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
