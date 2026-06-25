import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GradientHeader, HeaderIcon } from "@/components/header";
import { AccountMenu } from "@/components/AccountMenu";
import { StatGrid } from "@/components/stats";
import { Loading, ErrorText, money } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const QUICK = [
  { icon: "cash", label: "Rent", href: "/(landlord)/(tabs)/rent", color: "#2563EB" },
  { icon: "construct", label: "Maintenance", href: "/(landlord)/maintenance", color: "#0EA5E9" },
  { icon: "chatbubbles", label: "Complaints", href: "/(landlord)/complaints", color: "#8B5CF6" },
  { icon: "mail", label: "Enquiries", href: "/(landlord)/inquiries", color: "#059669" },
] as const;

export default function LandlordHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordDashboard());

  if (loading) return <Loading />;
  const initial = (user?.fullName ?? "L").charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader>
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greet}>{greeting()},</Text>
            <Text style={s.name} numberOfLines={1}>{user?.fullName ?? "Landlord"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <HeaderIcon name="mail" badge={data?.unreadInquiries} onPress={() => router.push("/(landlord)/inquiries")} />
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={6}>
              <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
            </Pressable>
          </View>
        </View>
      </GradientHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <ErrorText>{error}</ErrorText>

        <View style={s.collectCard}>
          <Text style={s.collectLabel}>Collected this month</Text>
          <Text style={s.collectValue}>{money(data?.monthlyCollection ?? 0)}</Text>
          <Text style={s.collectSub}>{money(data?.pendingDue ?? 0)} pending across tenants</Text>
        </View>

        <View style={{ height: 16 }} />
        <StatGrid stats={[
          { label: "Properties", value: data?.properties ?? 0, icon: "business", color: "#2563EB" },
          { label: "Occupied", value: `${data?.occupied ?? 0}/${data?.properties ?? 0}`, icon: "home", color: "#059669" },
          { label: "Tenants", value: data?.tenants ?? 0, icon: "people", color: "#0EA5E9" },
          { label: "Expiring soon", value: data?.expiringSoon ?? 0, icon: "time", color: "#D97706" },
          { label: "Open maintenance", value: data?.openMaintenance ?? 0, icon: "construct", color: "#8B5CF6" },
          { label: "Tenant requests", value: data?.pendingApplications ?? 0, icon: "person-add", color: "#DC2626" },
        ]} />

        <Text style={s.section}>Quick actions</Text>
        <View style={s.quickRow}>
          {QUICK.map((q) => (
            <Pressable key={q.label} style={s.quick} onPress={() => router.push(q.href as never)}>
              <View style={[s.quickIcon, { backgroundColor: q.color + "1A" }]}>
                <Ionicons name={q.icon as keyof typeof Ionicons.glyphMap} size={22} color={q.color} />
              </View>
              <Text style={s.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <AccountMenu visible={menuOpen} onClose={() => setMenuOpen(false)} items={[
        { icon: "person-add-outline", label: "Tenant requests", onPress: () => router.push("/(landlord)/applications") },
        { icon: "calendar-outline", label: "Visit requests", onPress: () => router.push("/(landlord)/visits") },
        { icon: "document-text-outline", label: "Leases", onPress: () => router.push("/(landlord)/leases") },
        { icon: "star-outline", label: "Reviews", onPress: () => router.push("/(landlord)/reviews") },
        { icon: "notifications-outline", label: "Notifications", onPress: () => router.push("/(tenant)/notifications") },
      ]} />
    </View>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  greet: { color: "#DBEAFE", fontSize: 14 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  collectCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border },
  collectLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  collectValue: { fontSize: 30, fontWeight: "800", color: colors.text, marginTop: 4 },
  collectSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  section: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 24, marginBottom: 12 },
  quickRow: { flexDirection: "row", gap: 10 },
  quick: { flex: 1, alignItems: "center", gap: 8 },
  quickIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: "600", textAlign: "center" },
});
