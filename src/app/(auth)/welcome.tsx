import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo } from "@/components/Logo";
import { api, type Listing } from "@/lib/api";
import { fileUrl } from "@/lib/config";

// Mirrors the website landing page (src/app/page.tsx) — brand gradient hero,
// pill badge, rotating property showcase, feature cards, stats band, reviews.

const CAPABILITIES = [
  "Property Management", "Lease Agreements", "Online Rent", "Auto Invoicing",
  "Maintenance", "Complaints", "Two-way Reviews", "Notifications", "Document Vault",
];

const FEATURES = [
  { icon: "🔐", title: "Secure Auth & RBAC", desc: "Role-based access keeps every portal scoped to the right data." },
  { icon: "🏘️", title: "Property Management", desc: "Track properties, units, amenities and availability in real time." },
  { icon: "📄", title: "Lease Lifecycle", desc: "Draft, activate, renew and terminate leases with signed contracts." },
  { icon: "💳", title: "Online Rent", desc: "Collect rent via UPI, cards and net banking with instant receipts." },
  { icon: "🔧", title: "Maintenance", desc: "Photo-rich requests flow from Pending to Resolved to Closed." },
  { icon: "⭐", title: "Two-way Reviews", desc: "Landlords and tenants rate each other — public and moderated." },
];

const TESTIMONIALS = [
  { q: "Rent collection used to eat my weekends. Now invoices go out automatically and I see every payment and request in one dashboard.", n: "Michael Anderson", r: "Landlord · 12 units", c: ["#3B82F6", "#06B6D4"] as const },
  { q: "Paying rent and raising a maintenance request takes seconds. No more chasing my landlord — and I have every receipt.", n: "Emily Davis", r: "Tenant", c: ["#10B981", "#14B8A6"] as const },
];

const BLUE = "#2563EB";
const CYAN = "#06B6D4";

export default function Welcome() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Listing[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listings({ pageSize: 6, sort: "newest" });
        setFeatured(res.items);
      } catch {
        setFeatured([]);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* brand row */}
        <View style={s.brandRow}>
          <Logo size={38} radius={11} />
          <Text style={s.brandName}>Lease Lord</Text>
        </View>

        {/* ===== HERO ===== */}
        <View style={s.hero}>
          <View style={s.badge}>
            <View style={s.dotOuter}>
              <View style={s.dotInner} />
            </View>
            <Text style={s.badgeText}>All-in-one rental platform</Text>
          </View>

          <Text style={[s.h1, { marginTop: 18 }]}>
            Property management,{" "}
          </Text>
          <MaskedView maskElement={<Text style={[s.h1, s.h1grad]}>beautifully simplified</Text>}>
            <LinearGradient colors={[BLUE, CYAN, "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[s.h1, s.h1grad, { opacity: 0 }]}>beautifully simplified</Text>
            </LinearGradient>
          </MaskedView>

          <Text style={s.sub}>
            Lease Lord brings landlords, tenants and administrators onto a single, secure platform — leases, online rent, maintenance, complaints and two-way reviews.
          </Text>

          <View style={{ gap: 12, marginTop: 22 }}>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <LinearGradient colors={[BLUE, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaPrimary}>
                <Text style={s.ctaPrimaryText}>Get started  →</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.push("/(auth)/login")} style={s.ctaOutline}>
              <Text style={s.ctaOutlineText}>Sign in</Text>
            </Pressable>
          </View>

          <View style={s.statsRow}>
            {[{ k: "3", v: "Role-based portals" }, { k: "15+", v: "Built-in modules" }, { k: "100%", v: "Web & installable" }].map((st) => (
              <View key={st.v} style={{ flex: 1 }}>
                <Text style={s.statK}>{st.k}</Text>
                <Text style={s.statV}>{st.v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== SHOWCASE ===== */}
        <Showcase photos={featured.map((f) => f.photo).filter(Boolean) as string[]} />

        {/* ===== CAPABILITY CHIPS ===== */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CAPABILITIES.map((c) => (
            <View key={c} style={s.chip}>
              <Text style={s.chipText}>{c}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ===== RENT CTA CARD ===== */}
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <LinearGradient colors={[BLUE, "#0EA5E9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.rentCta}>
              <View style={s.rentIcon}><Ionicons name="home" size={26} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rentTitle}>Looking for a place to rent?</Text>
                <Text style={s.rentSub}>Browse verified properties matched to your budget and location.</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ===== FEATURES ===== */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Text style={s.eyebrow}>EVERYTHING INCLUDED</Text>
          <Text style={s.h2}>A complete management toolkit</Text>
          <View style={s.featGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={s.featCard}>
                <View style={s.featIcon}><Text style={{ fontSize: 22 }}>{f.icon}</Text></View>
                <Text style={s.featTitle}>{f.title}</Text>
                <Text style={s.featDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== STATS BAND ===== */}
        <LinearGradient colors={[BLUE, "#1D4ED8", CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.band}>
          {[{ k: "3", v: "Dedicated portals" }, { k: "4", v: "Payment methods" }, { k: "5★", v: "Two-way ratings" }, { k: "24/7", v: "Online access" }].map((st) => (
            <View key={st.v} style={s.bandCell}>
              <Text style={s.bandK}>{st.k}</Text>
              <Text style={s.bandV}>{st.v}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* ===== TESTIMONIALS ===== */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Text style={s.eyebrow}>LOVED BY BOTH SIDES</Text>
          <Text style={s.h2}>On the same page, finally</Text>
          {TESTIMONIALS.map((t) => (
            <View key={t.n} style={s.review}>
              <Text style={{ color: "#F59E0B", fontSize: 14 }}>★★★★★</Text>
              <Text style={s.reviewQ}>“{t.q}”</Text>
              <View style={s.reviewFoot}>
                <LinearGradient colors={t.c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>{t.n.charAt(0)}</Text>
                </LinearGradient>
                <View>
                  <Text style={s.reviewName}>{t.n}</Text>
                  <Text style={s.reviewRole}>{t.r}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ===== FOOTER CTA ===== */}
        <View style={{ paddingHorizontal: 20, marginTop: 26, gap: 12 }}>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <LinearGradient colors={[BLUE, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaPrimary}>
              <Text style={s.ctaPrimaryText}>Create your account</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/login")} style={{ alignItems: "center", paddingVertical: 6 }}>
            <Text style={{ color: "#64748B", fontSize: 13 }}>
              Tenant? <Text style={{ color: BLUE, fontWeight: "700" }}>Sign in</Text> with the details your landlord gave you.
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Rotating property showcase card with a verified badge + floating stat chips.
function Showcase({ photos }: { photos: string[] }) {
  const ids = photos.slice(0, 6);
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (ids.length < 2) return;
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => {
        setIdx((i) => (i + 1) % ids.length);
        Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
      });
    }, 3200);
    return () => clearInterval(t);
  }, [ids.length, fade]);

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
      <View style={s.showFrame}>
        <View style={s.showInner}>
          {ids.length > 0 ? (
            <Animated.View style={{ flex: 1, opacity: fade }}>
              <Image source={{ uri: fileUrl(ids[idx]) }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            </Animated.View>
          ) : (
            <LinearGradient colors={["#DBEAFE", "#E0F2FE"]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 56 }}>🏙️</Text>
            </LinearGradient>
          )}

          <LinearGradient colors={["transparent", "rgba(0,0,0,0.45)"]} style={s.showShade} />
          <View style={s.verified}>
            <Ionicons name="shield-checkmark" size={13} color={BLUE} />
            <Text style={s.verifiedText}>Verified rentals</Text>
          </View>
          {ids.length > 1 ? (
            <View style={s.dots}>
              {ids.map((id, i) => (
                <View key={id} style={[s.dot, i === idx && s.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={s.floatRow}>
        <View style={s.floatChip}>
          <Text style={s.floatLabel}>Rent paid</Text>
          <Text style={[s.floatValue, { color: "#059669" }]}>✓ ₹2,500</Text>
        </View>
        <View style={s.floatChip}>
          <Text style={s.floatLabel}>New review</Text>
          <Text style={[s.floatValue, { color: "#F59E0B" }]}>★★★★★</Text>
        </View>
        <View style={s.floatChip}>
          <Text style={s.floatLabel}>Occupancy</Text>
          <Text style={[s.floatValue, { color: BLUE }]}>86%</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  logoBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },

  hero: { paddingHorizontal: 20, paddingTop: 20 },
  badge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  dotOuter: { width: 8, height: 8, alignItems: "center", justifyContent: "center" },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  h1: { fontSize: 32, lineHeight: 38, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  h1grad: { color: "#000" },
  sub: { fontSize: 15, lineHeight: 23, color: "#475569", marginTop: 14 },

  ctaPrimary: { height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  ctaPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  ctaOutline: { height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#fff" },
  ctaOutlineText: { color: "#334155", fontSize: 16, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 26 },
  statK: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  statV: { fontSize: 11, color: "#64748B", marginTop: 2 },

  showFrame: { borderRadius: 26, backgroundColor: "#fff", padding: 8, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: BLUE, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  showInner: { aspectRatio: 4 / 3, borderRadius: 18, overflow: "hidden", backgroundColor: "#DBEAFE" },
  showShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 80 },
  verified: { position: "absolute", left: 12, top: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  verifiedText: { fontSize: 11, fontWeight: "800", color: "#1D4ED8" },
  dots: { position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 5, left: 0, right: 0, justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { width: 18, backgroundColor: "#fff" },

  floatRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  floatChip: { flex: 1, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", paddingVertical: 10, paddingHorizontal: 12 },
  floatLabel: { fontSize: 10, color: "#94A3B8" },
  floatValue: { fontSize: 14, fontWeight: "800", marginTop: 2 },

  chips: { paddingHorizontal: 20, paddingVertical: 18, gap: 8 },
  chip: { borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: "600", color: "#475569" },

  rentCta: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 22 },
  rentIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  rentTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  rentSub: { color: "#DBEAFE", fontSize: 12, marginTop: 3, lineHeight: 17 },

  eyebrow: { fontSize: 12, fontWeight: "800", color: BLUE, letterSpacing: 1 },
  h2: { fontSize: 23, fontWeight: "800", color: "#0F172A", marginTop: 6, letterSpacing: -0.3 },
  featGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  featCard: { width: "47.5%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0", padding: 16 },
  featIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  featTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 12 },
  featDesc: { fontSize: 12, color: "#64748B", marginTop: 5, lineHeight: 17 },

  band: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 20, marginTop: 30, borderRadius: 22, paddingVertical: 24, paddingHorizontal: 8 },
  bandCell: { width: "50%", alignItems: "center", paddingVertical: 12 },
  bandK: { fontSize: 30, fontWeight: "800", color: "#fff" },
  bandV: { fontSize: 12, color: "#DBEAFE", marginTop: 4 },

  review: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0", padding: 18, marginTop: 14 },
  reviewQ: { fontSize: 14, lineHeight: 21, color: "#475569", marginTop: 10 },
  reviewFoot: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  reviewName: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  reviewRole: { fontSize: 12, color: "#94A3B8" },
});
