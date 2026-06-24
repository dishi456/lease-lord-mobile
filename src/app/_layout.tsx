import { useEffect } from "react";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth, type AuthState } from "@/lib/auth";

// Each role gets its own route group / home.
const HOME: Record<string, string> = {
  USER: "/(user)",
  TENANT: "/(tenant)",
  LANDLORD: "/(landlord)",
  MASTER_ADMIN: "/(admin)",
};

// Where a signed-in user belongs, mirroring the website's portal gates:
//  - SUSPENDED → blocked (sign out; the backend also rejects login).
//  - LANDLORD / TENANT that aren't ACTIVE yet (status PENDING) → the approval
//    waiting screen, NOT their portal. A new landlord waits for Master Admin
//    approval; a new tenant waits for their landlord. USER and MASTER_ADMIN are
//    never gated.
function destinationFor(user: NonNullable<AuthState["user"]>): string {
  const gated = user.role === "LANDLORD" || user.role === "TENANT";
  if (gated && user.status !== "ACTIVE") return "/pending";
  return HOME[user.role] ?? "/(tenant)";
}

// Gate the app by auth state + role + account status. The navigator is always
// mounted so navigation is ready when we redirect; index shows a spinner until.
function RootNavigator() {
  const { user, loading, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (loading) return;
    if (!navState?.key) return;
    const group = segments[0]; // "(auth)" | "(tenant)" | "(user)" | "(landlord)" | "(admin)" | "pending" | undefined

    if (!user) {
      if (group !== "(auth)") router.replace("/(auth)/welcome");
      return;
    }
    // Suspended accounts get no portal — drop them back to sign-in.
    if (user.status === "SUSPENDED") {
      signOut();
      return;
    }
    // Keep the user in the section their role + status allow. The destination
    // is "/pending" (waiting screen) or "/(role)"; its first segment is what we
    // compare against where they currently are.
    const target = destinationFor(user);
    const targetSeg = target === "/pending" ? "pending" : target.slice(1); // "(landlord)", "(user)", …
    if (group !== targetSeg) router.replace(target);
  }, [user, loading, segments, navState?.key, router, signOut]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="pending" />
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
