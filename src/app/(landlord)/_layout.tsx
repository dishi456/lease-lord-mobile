import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function LandlordLayout() {
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
      <Stack.Screen name="maintenance" options={{ title: "Maintenance" }} />
      <Stack.Screen name="complaints" options={{ title: "Complaints" }} />
      <Stack.Screen name="leases" options={{ title: "Leases" }} />
      <Stack.Screen name="reviews" options={{ title: "Rate tenants" }} />
      <Stack.Screen name="inquiries" options={{ title: "Enquiries" }} />
    </Stack>
  );
}
