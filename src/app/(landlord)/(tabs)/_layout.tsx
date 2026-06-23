import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type IoniconName = keyof typeof Ionicons.glyphMap;
const tab = (base: string) => ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
  <Ionicons name={(focused ? base : `${base}-outline`) as IoniconName} size={size} color={color} />
);

export default function LandlordTabs() {
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
      <Tabs.Screen name="properties" options={{ title: "Properties", tabBarIcon: tab("business") }} />
      <Tabs.Screen name="tenants" options={{ title: "Tenants", tabBarIcon: tab("people") }} />
      <Tabs.Screen name="rent" options={{ title: "Rent", tabBarIcon: tab("cash") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tab("ellipsis-horizontal-circle") }} />
    </Tabs>
  );
}
