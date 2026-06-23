import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// Stack wrapping the tenant tab bar + pushed detail screens.
export default function TenantLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="maintenance/new" options={{ title: "New request", presentation: "modal" }} />
      <Stack.Screen name="maintenance/[id]" options={{ title: "Request" }} />
      <Stack.Screen name="complaints/index" options={{ title: "Complaints" }} />
      <Stack.Screen name="complaints/new" options={{ title: "New complaint", presentation: "modal" }} />
      <Stack.Screen name="complaints/[id]" options={{ title: "Complaint" }} />
      <Stack.Screen name="reviews" options={{ title: "Reviews" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
    </Stack>
  );
}
