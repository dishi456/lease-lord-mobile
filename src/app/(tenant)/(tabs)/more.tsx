import { Alert, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Body, Muted } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; href: string };
const ITEMS: Item[] = [
  { icon: "person", label: "Profile", href: "/(tenant)/profile" },
  { icon: "time", label: "Rental history", href: "/(tenant)/rental-history" },
  { icon: "document-attach", label: "Documents", href: "/(tenant)/documents" },
  { icon: "chatbubbles", label: "Complaints", href: "/(tenant)/complaints" },
  { icon: "star", label: "Reviews", href: "/(tenant)/reviews" },
  { icon: "options", label: "Preferences", href: "/(tenant)/preferences" },
  { icon: "notifications", label: "Notifications", href: "/(tenant)/notifications" },
];

export default function More() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <Card>
        <Body style={{ fontWeight: "700", fontSize: 17 }}>{user?.fullName}</Body>
        <Muted>{user?.email}</Muted>
      </Card>

      <Card style={{ padding: 0 }}>
        {ITEMS.map((it, idx) => (
          <Pressable
            key={it.href}
            onPress={() => router.push(it.href as never)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <Ionicons name={it.icon} size={20} color={colors.primary} />
            <Body style={{ flex: 1 }}>{it.label}</Body>
            <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
          </Pressable>
        ))}
      </Card>

      <Pressable
        onPress={() =>
          Alert.alert("Sign out?", "", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: signOut },
          ])
        }
        style={{ padding: 16, alignItems: "center" }}
      >
        <Body style={{ color: colors.danger, fontWeight: "700" }}>Sign out</Body>
      </Pressable>

      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Muted>Lease Lord · v1.0.0</Muted>
      </View>
    </Screen>
  );
}
