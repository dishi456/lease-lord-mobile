import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GradientHeader, HeaderIcon } from "@/components/header";
import { AccountMenu } from "@/components/AccountMenu";
import { StatGrid } from "@/components/stats";
import { Loading, ErrorText, money } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function AdminHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.adminDashboard());

  if (loading) return <Loading />;
  const initial = (user?.fullName ?? "A").charAt(0).toUpperCase();
  const pending = (data?.pendingLandlords ?? 0) + (data?.pendingProperties ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader>
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greet}>Master Admin</Text>
            <Text style={s.name} numberOfLines={1}>{user?.fullName ?? "Admin"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <HeaderIcon name="checkmark-circle" badge={pending} onPress={() => router.push("/(admin)/(tabs)/approvals")} />
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={6}>
              <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
            </Pressable>
          </View>
        </View>
      </GradientHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <ErrorText>{error}</ErrorText>

        <View style={s.revCard}>
          <Text style={s.revLabel}>Revenue this month</Text>
          <Text style={s.revValue}>{money(data?.monthlyRevenue ?? 0)}</Text>
          <Text style={s.revSub}>{money(data?.pendingRent ?? 0)} outstanding</Text>
        </View>

        {pending > 0 ? (
          <Pressable onPress={() => router.push("/(admin)/(tabs)/approvals")} style={s.alert}>
            <Text style={s.alertText}>{pending} item{pending > 1 ? "s" : ""} awaiting approval →</Text>
          </Pressable>
        ) : null}

        <View style={{ height: 16 }} />
        <StatGrid stats={[
          { label: "Landlords", value: data?.landlords ?? 0, icon: "person", color: "#2563EB" },
          { label: "Tenants", value: data?.tenants ?? 0, icon: "people", color: "#0EA5E9" },
          { label: "Seekers", value: data?.users ?? 0, icon: "search", color: "#8B5CF6" },
          { label: "Properties", value: data?.properties ?? 0, icon: "business", color: "#059669" },
          { label: "Active leases", value: data?.activeLeases ?? 0, icon: "document-text", color: "#2563EB" },
          { label: "Occupied", value: `${data?.occupied ?? 0}/${data?.properties ?? 0}`, icon: "home", color: "#059669" },
          { label: "Open maintenance", value: data?.openMaintenance ?? 0, icon: "construct", color: "#D97706" },
          { label: "Flagged reviews", value: data?.flaggedReviews ?? 0, icon: "flag", color: "#DC2626" },
        ]} />
      </ScrollView>

      <AccountMenu visible={menuOpen} onClose={() => setMenuOpen(false)} items={[
        { icon: "cash-outline", label: "Payments", onPress: () => router.push("/(admin)/payments") },
        { icon: "star-outline", label: "Review moderation", onPress: () => router.push("/(admin)/reviews") },
        { icon: "list-outline", label: "Activity log", onPress: () => router.push("/(admin)/activity") },
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
  revCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border },
  revLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  revValue: { fontSize: 30, fontWeight: "800", color: colors.text, marginTop: 4 },
  revSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  alert: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 14, padding: 14, marginTop: 12 },
  alertText: { color: "#B45309", fontWeight: "700" },
});
