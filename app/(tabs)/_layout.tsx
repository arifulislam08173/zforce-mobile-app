// import React, { useContext, useMemo } from "react";
// import { Tabs, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { Pressable, Text, View, Modal } from "react-native";
// import { AuthContext } from "../../src/auth/AuthContext";

// const colors = {
//   bg: "#f3f4f6",
//   card: "#0b1220",
//   border: "rgba(0,0,0,0.08)",
//   tabActive: "#2563eb",
//   tabInactive: "#6b7280",
//   white: "#fff",
// };

// function AvatarMenu() {
//   const router = useRouter();
//   const { user, logout } = useContext(AuthContext);
//   const [open, setOpen] = React.useState(false);

//   const initials = useMemo(() => {
//     const name = user?.name || user?.email || "U";
//     const parts = String(name).trim().split(" ");
//     const a = parts?.[0]?.[0] || "U";
//     const b = parts?.[1]?.[0] || "";
//     return (a + b).toUpperCase();
//   }, [user]);

//   const onLogout = async () => {
//     setOpen(false);
//     await logout();
//     router.replace("/(auth)/login");
//   };

//   return (
//     <>
//       <Pressable
//         onPress={() => setOpen(true)}
//         style={({ pressed }) => ({
//           marginRight: 14,
//           opacity: pressed ? 0.7 : 1,
//         })}
//       >
//         <View
//           style={{
//             width: 34,
//             height: 34,
//             borderRadius: 999,
//             backgroundColor: colors.card,
//             alignItems: "center",
//             justifyContent: "center",
//             borderWidth: 1,
//             borderColor: "rgba(255,255,255,0.18)",
//           }}
//         >
//           <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
//             {initials}
//           </Text>
//         </View>
//       </Pressable>

//       <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
//         <Pressable
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
//           onPress={() => setOpen(false)}
//         >
//           <View
//             style={{
//               position: "absolute",
//               top: 64,
//               right: 14,
//               width: 200,
//               borderRadius: 14,
//               backgroundColor: "#111827",
//               borderWidth: 1,
//               borderColor: "rgba(255,255,255,0.12)",
//               padding: 10,
//             }}
//           >
//             <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
//               {user?.email || "Field user"}
//             </Text>

//             <Pressable
//               onPress={() => {
//                 setOpen(false);
//                 router.push("/(tabs)/profile");
//               }}
//               style={({ pressed }) => ({
//                 marginTop: 10,
//                 paddingVertical: 10,
//                 paddingHorizontal: 10,
//                 borderRadius: 12,
//                 backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "transparent",
//                 flexDirection: "row",
//                 alignItems: "center",
//                 gap: 8,
//               })}
//             >
//               <Ionicons name="person-outline" size={18} color="#fff" />
//               <Text style={{ color: "#fff", fontWeight: "800" }}>Profile</Text>
//             </Pressable>

//             <Pressable
//               onPress={onLogout}
//               style={({ pressed }) => ({
//                 marginTop: 6,
//                 paddingVertical: 10,
//                 paddingHorizontal: 10,
//                 borderRadius: 12,
//                 backgroundColor: pressed ? "rgba(239,68,68,0.18)" : "transparent",
//                 flexDirection: "row",
//                 alignItems: "center",
//                 gap: 8,
//               })}
//             >
//               <Ionicons name="log-out-outline" size={18} color="#fb7185" />
//               <Text style={{ color: "#fb7185", fontWeight: "900" }}>Logout</Text>
//             </Pressable>
//           </View>
//         </Pressable>
//       </Modal>
//     </>
//   );
// }

// export default function TabsLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerStyle: { backgroundColor: colors.bg },
//         headerTitleStyle: { fontWeight: "900" },
//         headerRight: () => <AvatarMenu />,
//         tabBarActiveTintColor: colors.tabActive,
//         tabBarInactiveTintColor: colors.tabInactive,
//         tabBarStyle: {
//           borderTopWidth: 1,
//           borderTopColor: colors.border,
//           backgroundColor: "#fff",
//           height: 60,
//           paddingBottom: 8,
//           paddingTop: 6,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="orders"
//         options={{
//           title: "Orders",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="cart-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="attendance"
//         options={{
//           title: "Attendance",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="time-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="more"
//         options={{
//           title: "More",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="menu-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }








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
