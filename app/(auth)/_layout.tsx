// import React from "react";
// import { Stack } from "expo-router";
// import { AuthProvider } from "../../src/auth/AuthContext";

// export default function RootLayout() {
//   return (
//     <AuthProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         {/* groups */}
//         <Stack.Screen name="(auth)" />
//         <Stack.Screen name="(tabs)" />

//         {/* standalone screens */}
//         <Stack.Screen name="face-enroll" />
//         <Stack.Screen name="route-plan" />
//       </Stack>
//     </AuthProvider>
//   );
// }





import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
