import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Step = { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; body: string };

// One slide per landlord feature. Order roughly follows the natural setup flow.
const STEPS: Step[] = [
  { icon: "home", color: "#2563EB", title: "Welcome to Lease Lord", body: "Your all-in-one landlord portal — list properties, manage tenants, collect rent, and handle requests. This quick guide walks you through everything. It only shows once." },
  { icon: "at", color: "#0EA5E9", title: "1. Set your unique user ID", body: "First, create your unique @username on your Profile. It identifies you to tenants and is required before you can add a property or a tenant." },
  { icon: "business", color: "#2563EB", title: "2. Add your properties", body: "Tap Properties → Add. Pick the type (apartment, house, commercial, land, student housing) and fill the type-specific details, add photos, and set the rent." },
  { icon: "people", color: "#059669", title: "3. Add & vet tenants", body: "Add tenants directly, or accept their requests. Open a tenant to see their rental history, reviews, and uploaded ID documents — which you can view and verify. Blacklist with a reason if needed." },
  { icon: "document-text", color: "#0891B2", title: "4. Create lease agreements", body: "Set up a lease for a property + tenant with rent, deposit, dates and notice period. You can upload the signed contract too." },
  { icon: "cash", color: "#16A34A", title: "5. Collect & track rent", body: "Record payments with method and amount (partial payments supported), mark rent paid/unpaid quickly, and confirm payment-proof screenshots your tenants upload." },
  { icon: "construct", color: "#8B5CF6", title: "6. Handle requests", body: "Maintenance, complaints, enquiries, tenant requests and visit bookings each have their own section so nothing slips through the cracks." },
  { icon: "chatbubbles", color: "#7C3AED", title: "7. Message your tenants", body: "Every active lease has its own WhatsApp-style chat. Send messages and photos, and see read receipts and unread counts." },
  { icon: "star", color: "#F59E0B", title: "8. Reviews", body: "Rate your tenants on what matters to you, and see the reviews tenants leave about you. Builds trust both ways." },
];

export function LandlordGuide({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { /* mandatory — cannot dismiss with back */ }}>
      <View style={s.root}>
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          {/* Top: step counter (no skip — it's mandatory) */}
          <View style={s.topRow}>
            <Text style={s.counter}>Step {i + 1} of {STEPS.length}</Text>
          </View>

          {/* Hero icon */}
          <View style={s.heroWrap}>
            <LinearGradient colors={[step.color, step.color + "CC"]} style={s.hero}>
              <Ionicons name={step.icon} size={64} color="#fff" />
            </LinearGradient>
          </View>

          {/* Copy */}
          <View style={s.copy}>
            <Text style={s.title}>{step.title}</Text>
            <Text style={s.body}>{step.body}</Text>
          </View>

          {/* Progress dots */}
          <View style={s.dots}>
            {STEPS.map((_, n) => (
              <View key={n} style={[s.dot, n === i ? { backgroundColor: step.color, width: 22 } : null]} />
            ))}
          </View>

          {/* Nav */}
          <View style={s.nav}>
            {i > 0 ? (
              <Pressable onPress={() => setI((n) => n - 1)} style={s.back} hitSlop={8}>
                <Ionicons name="arrow-back" size={20} color={colors.muted} />
                <Text style={s.backText}>Back</Text>
              </Pressable>
            ) : <View style={{ width: 80 }} />}

            <Pressable onPress={() => (last ? onDone() : setI((n) => n + 1))}>
              <LinearGradient colors={["#2563EB", "#06B6D4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.next}>
                <Text style={s.nextText}>{last ? "Get started" : "Next"}</Text>
                <Ionicons name={last ? "checkmark" : "arrow-forward"} size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  topRow: { alignItems: "center", paddingTop: 12, paddingHorizontal: 20 },
  counter: { fontSize: 13, fontWeight: "700", color: colors.muted, letterSpacing: 0.3 },
  heroWrap: { alignItems: "center", marginTop: 28 },
  hero: { width: 132, height: 132, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: "#1E3A8A", shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  copy: { paddingHorizontal: 28, marginTop: 34, flex: 1 },
  title: { fontSize: 25, fontWeight: "800", color: colors.text, textAlign: "center", letterSpacing: -0.4 },
  body: { fontSize: 15.5, lineHeight: 24, color: colors.muted, textAlign: "center", marginTop: 14 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#CBD5E1" },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, width: 80 },
  backText: { fontSize: 15, fontWeight: "700", color: colors.muted },
  next: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, height: 52, borderRadius: 26, justifyContent: "center", shadowColor: "#2563EB", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
