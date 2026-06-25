import { Alert, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Body, Muted } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; href: string };
const ITEMS: Item[] = [
  { icon: "person", label: "Profile", href: "/(landlord)/profile" },
  { icon: "chatbubbles", label: "Messages", href: "/(landlord)/chat" },
  { icon: "person-add", label: "Tenant requests", href: "/(landlord)/applications" },
  { icon: "calendar", label: "Visit requests", href: "/(landlord)/visits" },
  { icon: "document-text", label: "Leases", href: "/(landlord)/leases" },
  { icon: "construct", label: "Maintenance", href: "/(landlord)/maintenance" },
  { icon: "chatbubbles", label: "Complaints", href: "/(landlord)/complaints" },
  { icon: "mail", label: "Enquiries", href: "/(landlord)/inquiries" },
  { icon: "star", label: "Reviews", href: "/(landlord)/reviews" },
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
          <Pressable key={it.href} onPress={() => router.push(it.href as never)}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border }}>
            <Ionicons name={it.icon} size={20} color={colors.primary} />
            <Body style={{ flex: 1 }}>{it.label}</Body>
            <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
          </Pressable>
        ))}
      </Card>

      <Pressable onPress={() => Alert.alert("Sign out?", "", [{ text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: signOut }])}
        style={{ padding: 16, alignItems: "center" }}>
        <Body style={{ color: colors.danger, fontWeight: "700" }}>Sign out</Body>
      </Pressable>
      <View style={{ alignItems: "center" }}><Muted>Lease Lord · Landlord</Muted></View>
    </Screen>
  );
}
