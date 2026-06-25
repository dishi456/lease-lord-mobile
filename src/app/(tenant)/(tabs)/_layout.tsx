import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type IoniconName = keyof typeof Ionicons.glyphMap;
const tab = (base: string) => ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
  <Ionicons name={(focused ? base : `${base}-outline`) as IoniconName} size={size} color={color} />
);

export default function TenantTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#94A3B8",
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: "800", color: colors.text, fontSize: 18 },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false, tabBarIcon: tab("home") }} />
      <Tabs.Screen name="lease" options={{ title: "Lease", tabBarIcon: tab("document-text") }} />
      <Tabs.Screen name="payments" options={{ title: "Rent", tabBarIcon: tab("card") }} />
      <Tabs.Screen name="maintenance" options={{ title: "Requests", tabBarIcon: tab("construct") }} />
      <Tabs.Screen name="marketplace" options={{ title: "Market", headerShown: false, tabBarIcon: tab("storefront") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tab("ellipsis-horizontal-circle") }} />
    </Tabs>
  );
}
