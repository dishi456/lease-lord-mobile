import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// Auth screens use their own branded headers; the public listing detail gets a
// native back header.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot" />
      <Stack.Screen name="marketplace" />
      <Stack.Screen
        name="listing/[id]"
        options={{ headerShown: true, title: "Property", headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false }}
      />
    </Stack>
  );
}
