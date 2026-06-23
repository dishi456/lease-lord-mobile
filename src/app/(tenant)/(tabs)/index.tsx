import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GradientHeader, HeaderIcon } from "@/components/header";
import { AccountMenu } from "@/components/AccountMenu";
import { Loading, ErrorText, money, shortDate } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";
import { api, type Dashboard, type Notification } from "@/lib/api";
import { colors } from "@/lib/theme";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const QUICK = [
  { icon: "card", label: "Pay rent", href: "/(tenant)/payments", color: "#2563EB" },
  { icon: "construct", label: "New request", href: "/(tenant)/maintenance/new", color: "#0EA5E9" },
  { icon: "chatbubbles", label: "Complaints", href: "/(tenant)/complaints", color: "#8B5CF6" },
  { icon: "document-text", label: "My lease", href: "/(tenant)/lease", color: "#059669" },
] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, loading, refreshing, error, refresh } = useAsync(async () => {
    const [dash, notifs] = await Promise.all([api.dashboard(), api.notifications()]);
    return { dash, notifs: notifs.items.slice(0, 3) } as { dash: Dashboard; notifs: Notification[] };
  });

  if (loading) return <Loading />;
  const dash = data?.dash;
  const initial = (user?.fullName ?? "T").charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader>
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greet}>{greeting()},</Text>
            <Text style={s.name} numberOfLines={1}>{user?.fullName ?? "Tenant"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <HeaderIcon name="notifications" badge={dash?.unreadNotifications} onPress={() => router.push("/(tenant)/notifications")} />
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={6}>
              <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
            </Pressable>
          </View>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
      >
        <ErrorText>{error}</ErrorText>

        {/* Rent / status card */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {dash?.nextInvoice ? (
            <LinearGradient colors={["#FFFFFF", "#F8FAFF"]} style={s.rentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={s.rentLabel}>Next rent due</Text>
                <View style={[s.pill, { backgroundColor: dash.nextInvoice.status === "OVERDUE" ? "#FEF2F2" : "#FFFBEB" }]}>
                  <Text style={[s.pillText, { color: dash.nextInvoice.status === "OVERDUE" ? "#DC2626" : "#D97706" }]}>{dash.nextInvoice.status}</Text>
                </View>
              </View>
              <Text style={s.rentAmount}>{money(dash.nextInvoice.amount)}</Text>
              <Text style={s.rentDue}>Due {shortDate(dash.nextInvoice.dueDate)}</Text>
              <Pressable onPress={() => router.push("/(tenant)/payments")}>
                <LinearGradient colors={["#2563EB", "#06B6D4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payBtn}>
                  <Text style={s.payText}>Pay rent</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          ) : (
            <View style={s.rentCard}>
              <Text style={s.rentLabel}>Rent</Text>
              <Text style={[s.rentAmount, { fontSize: 20, color: colors.success }]}>You're all caught up</Text>
              <Text style={s.rentDue}>No pending dues right now.</Text>
            </View>
          )}
        </View>

        {/* Quick actions */}
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

        {/* Lease snapshot */}
        <Section title="Your lease" actionLabel="View" onAction={() => router.push("/(tenant)/lease")} />
        <View style={{ paddingHorizontal: 16 }}>
          {dash?.lease ? (
            <Pressable style={s.card} onPress={() => router.push("/(tenant)/lease")}>
              <View style={s.leaseTop}>
                <View style={s.leaseIcon}><Ionicons name="home" size={20} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.leaseName} numberOfLines={1}>{dash.lease.property.name}</Text>
                  <Text style={s.leaseAddr} numberOfLines={1}>{dash.lease.property.address}</Text>
                </View>
                <View style={[s.pill, { backgroundColor: "#ECFDF5" }]}><Text style={[s.pillText, { color: "#059669" }]}>{dash.lease.status}</Text></View>
              </View>
              <View style={s.leaseMeta}>
                <Meta label="Monthly rent" value={money(dash.lease.monthlyRent)} />
                <Meta label="Ends" value={shortDate(dash.lease.endDate)} />
              </View>
            </Pressable>
          ) : (
            <View style={s.card}><Text style={s.muted}>No active lease yet. Your landlord will set this up.</Text></View>
          )}
        </View>

        {/* Recent activity */}
        <Section title="Recent activity" actionLabel="All" onAction={() => router.push("/(tenant)/notifications")} />
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {(data?.notifs.length ?? 0) === 0 ? (
            <View style={s.card}><Text style={s.muted}>Nothing new right now.</Text></View>
          ) : (
            data!.notifs.map((n) => (
              <View key={n.id} style={s.activity}>
                <View style={[s.activityDot, { backgroundColor: n.read ? colors.border : colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.activityTitle} numberOfLines={1}>{n.title}</Text>
                  {n.body ? <Text style={s.muted} numberOfLines={1}>{n.body}</Text> : null}
                </View>
                <Text style={s.activityTime}>{shortDate(n.createdAt)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AccountMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { icon: "person-outline", label: "Profile", onPress: () => router.push("/(tenant)/profile") },
          { icon: "notifications-outline", label: "Notifications", onPress: () => router.push("/(tenant)/notifications") },
          { icon: "star-outline", label: "Reviews", onPress: () => router.push("/(tenant)/reviews") },
        ]}
      />
    </View>
  );
}

function Section({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}><Text style={s.sectionAction}>{actionLabel}</Text></Pressable>
      ) : null}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  greet: { color: "#DBEAFE", fontSize: 14 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  rentCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, shadowColor: "#1E3A8A", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  rentLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  rentAmount: { fontSize: 32, fontWeight: "800", color: colors.text, marginTop: 6 },
  rentDue: { fontSize: 13, color: colors.muted, marginTop: 2 },
  payBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginTop: 14 },
  payText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "800" },

  quickRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 18, gap: 10 },
  quick: { flex: 1, alignItems: "center", gap: 8 },
  quickIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: "600", textAlign: "center" },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  sectionAction: { fontSize: 13, fontWeight: "700", color: colors.primary },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  muted: { fontSize: 13, color: colors.muted },
  leaseTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  leaseIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" },
  leaseName: { fontSize: 15, fontWeight: "700", color: colors.text },
  leaseAddr: { fontSize: 12, color: colors.muted, marginTop: 1 },
  leaseMeta: { flexDirection: "row", marginTop: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12 },
  metaLabel: { fontSize: 11, color: colors.muted },
  metaValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },

  activity: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  activityTime: { fontSize: 11, color: colors.subtle },
});
