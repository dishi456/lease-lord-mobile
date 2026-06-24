import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="leases" options={{ title: "Leases" }} />
      <Stack.Screen name="maintenance" options={{ title: "Maintenance" }} />
      <Stack.Screen name="payments" options={{ title: "Payments" }} />
      <Stack.Screen name="reviews" options={{ title: "Review moderation" }} />
      <Stack.Screen name="activity" options={{ title: "Activity log" }} />
    </Stack>
  );
}
