import { useEffect } from "react";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";

// Each role gets its own route group / home.
const HOME: Record<string, string> = {
  USER: "/(user)",
  TENANT: "/(tenant)",
  LANDLORD: "/(landlord)",
  MASTER_ADMIN: "/(admin)",
};

// Gate the app by auth state + role. The navigator is always mounted so
// navigation is ready when we redirect; the index route shows a spinner until.
function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (loading) return;
    if (!navState?.key) return;
    const group = segments[0]; // "(auth)" | "(tenant)" | "(user)" | "(landlord)" | "(admin)" | undefined

    if (!user) {
      if (group !== "(auth)") router.replace("/(auth)/welcome");
      return;
    }
    // Send the signed-in user to their role's home when at the root or auth.
    const home = HOME[user.role] ?? "/(tenant)";
    if (group === undefined || group === "(auth)") router.replace(home);
  }, [user, loading, segments, navState?.key, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tenant)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
