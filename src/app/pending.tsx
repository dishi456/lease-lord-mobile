import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Muted } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

// Mirrors the website's portal gate: a freshly-registered LANDLORD is PENDING
// until the Master Admin approves them; a TENANT is PENDING until their landlord
// approves. We block the portal and show this waiting screen until status flips
// to ACTIVE (the root navigator redirects automatically once it does).
export default function Pending() {
  const { user, refresh, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  const isLandlord = user?.role === "LANDLORD";
  const title = isLandlord ? "Account under review" : "Almost there";
  const message = isLandlord
    ? "Your landlord account is awaiting approval from the Lease Lord admin team. You can sign in now — full access to your dashboard, properties and tenants unlocks the moment you're approved."
    : "Your account is awaiting approval from your landlord. You'll get access to your portal as soon as they approve you.";

  async function check() {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  }

  // Gently poll for approval so the user doesn't have to keep tapping.
  useEffect(() => {
    const t = setInterval(() => refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.body}>
        <View style={s.badge}>
          <Text style={s.badgeEmoji}>⏳</Text>
        </View>
        <Text style={s.title}>{title}</Text>
        <Muted style={s.message}>{message}</Muted>

        {user ? (
          <View style={s.card}>
            <Text style={s.cardLabel}>Signed in as</Text>
            <Text style={s.cardName}>{user.fullName}</Text>
            <Text style={s.cardEmail}>{user.email}</Text>
            <View style={s.statusPill}>
              <Text style={s.statusText}>{user.status} · {user.role}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.actions}>
          <Button title="Check approval status" onPress={check} loading={checking} />
          <Button title="Sign out" variant="secondary" onPress={signOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing.lg, alignItems: "center", justifyContent: "center", gap: spacing.md },
  badge: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" },
  badgeEmoji: { fontSize: 44 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center" },
  message: { fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 8 },
  card: { width: "100%", backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 2, marginTop: spacing.sm },
  cardLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  cardName: { fontSize: 17, fontWeight: "700", color: colors.text },
  cardEmail: { fontSize: 13, color: colors.muted },
  statusPill: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.infoBg },
  statusText: { fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.3 },
  actions: { width: "100%", gap: spacing.sm, marginTop: spacing.md },
});
