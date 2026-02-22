// import React, { useContext } from "react";
// import { Redirect } from "expo-router";
// import { View, ActivityIndicator } from "react-native";
// import { AuthContext } from "../src/auth/AuthContext";

// export default function Index() {
//   const { booting, user } = useContext(AuthContext);

//   if (booting) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   if (!user) return <Redirect href="/(auth)/login" />;
//   return <Redirect href="/(tabs)" />;
// }



import React, { useContext } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { AuthContext } from "../src/auth/AuthContext";

export default function Index() {
  const { booting, user } = useContext(AuthContext);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (!user.faceEnrolled) return <Redirect href="/face-enroll" />;

  return <Redirect href="/(tabs)" />;
}

