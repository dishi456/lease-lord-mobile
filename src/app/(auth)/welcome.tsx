import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Logo } from "@/components/Logo";

// Flagship-style welcome: full-bleed rotating property hero with floating live
// activity cards, and a white sheet that lifts over the image carrying the
// headline + actions. Brand colors, depth and motion throughout.

const BLUE = "#2563EB";
const CYAN = "#06B6D4";

// Real property photos for the hero carousel (curated, royalty-free).
const HOUSE_IMAGES = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=70",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=70",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=70",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=70",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=70",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=70",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=70",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=70",
];

export default function Welcome() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // A different random order of real property photos each open.
  const [heroImages] = useState(() => [...HOUSE_IMAGES].sort(() => Math.random() - 0.5));

  const heroH = Math.round(Math.min(470, Math.max(300, height * 0.48)));

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <Hero photos={heroImages} height={heroH} />

      {/* White sheet lifts over the hero */}
      <Animated.View entering={FadeInUp.duration(650).springify().damping(18)} style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={s.grabber} />

        <Animated.View entering={FadeInDown.delay(180).duration(600)} style={s.badge}>
          <PulseDot />
          <Text style={s.badgeText}>All-in-one rental platform</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(600)} style={{ marginTop: 14 }}>
          <Text style={s.h1}>Renting, </Text>
          <MaskedView maskElement={<Text style={[s.h1, s.h1grad]}>beautifully simplified</Text>}>
            <LinearGradient colors={[BLUE, CYAN, "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[s.h1, s.h1grad, { opacity: 0 }]}>beautifully simplified</Text>
            </LinearGradient>
          </MaskedView>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(340).duration(600)} style={s.sub}>
          Leases, online rent, maintenance and reviews — all in one beautiful app.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(420).duration(600)} style={s.trust}>
          <Text style={{ color: "#F59E0B", fontSize: 13, letterSpacing: 1 }}>★★★★★</Text>
          <Text style={s.trustText}>Trusted by landlords & tenants alike</Text>
        </Animated.View>

        <View style={{ flex: 1, minHeight: 12 }} />

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ gap: 11 }}>
          <BounceButton onPress={() => router.push("/(auth)/register")}>
            <LinearGradient colors={[BLUE, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaPrimary}>
              <Text style={s.ctaPrimaryText}>Get started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </BounceButton>
          <View style={s.altRow}>
            <Pressable onPress={() => router.push("/(auth)/login")} hitSlop={8}>
              <Text style={s.signinText}>Sign in</Text>
            </Pressable>
            <View style={s.altDot} />
            <Pressable onPress={() => router.push("/(auth)/marketplace")} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="storefront-outline" size={15} color={BLUE} />
              <Text style={[s.signinText, { color: BLUE }]}>Browse marketplace</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// --- Full-bleed rotating hero with Ken-Burns + floating activity cards ------
function Hero({ photos, height }: { photos: string[]; height: number }) {
  const ids = photos.slice(0, 6);
  const [idx, setIdx] = useState(0);
  const fade = useSharedValue(1);
  const zoom = useSharedValue(1);
  const f1 = useSharedValue(0);
  const f2 = useSharedValue(0);

  useEffect(() => {
    f1.value = withRepeat(withSequence(withTiming(-7, { duration: 1800 }), withTiming(0, { duration: 1800 })), -1, true);
    f2.value = withDelay(900, withRepeat(withSequence(withTiming(-7, { duration: 2000 }), withTiming(0, { duration: 2000 })), -1, true));
  }, [f1, f2]);

  useEffect(() => {
    zoom.value = 1;
    zoom.value = withTiming(1.16, { duration: 5200, easing: Easing.out(Easing.ease) });
    if (ids.length < 2) return;
    const t = setInterval(() => {
      fade.value = withTiming(0, { duration: 500 });
      setTimeout(() => {
        setIdx((i) => (i + 1) % ids.length);
        fade.value = withTiming(1, { duration: 500 });
      }, 500);
    }, 3800);
    return () => clearInterval(t);
  }, [ids.length, idx, fade, zoom]);

  const imgStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: zoom.value }] }));
  const f1Style = useAnimatedStyle(() => ({ transform: [{ translateY: f1.value }] }));
  const f2Style = useAnimatedStyle(() => ({ transform: [{ translateY: f2.value }] }));

  return (
    <View style={[s.hero, { height }]}>
      {ids.length > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, imgStyle]}>
          <Image source={{ uri: ids[idx] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        </Animated.View>
      ) : (
        <LinearGradient colors={[BLUE, "#1D4ED8", "#0E7490"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      {/* scrims: darken top for status bar + blend bottom into the white sheet */}
      <LinearGradient colors={["rgba(2,6,23,0.55)", "rgba(2,6,23,0.05)", "rgba(2,6,23,0.10)", "#F8FAFC"]} locations={[0, 0.32, 0.7, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <SafeAreaView edges={["top"]}>
        <Animated.View entering={FadeIn.duration(600)} style={s.heroTop}>
          <Logo size={36} radius={11} />
          <Text style={s.heroBrand}>Lease Lord</Text>
          <View style={{ flex: 1 }} />
          <View style={s.livePill}>
            <PulseDot color="#34D399" />
            <Text style={s.liveText}>Live</Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* floating activity cards */}
      <Animated.View style={[s.floatCard, { top: height * 0.36, left: 18 }, f1Style]} entering={FadeIn.delay(500).duration(700)}>
        <View style={[s.floatIcon, { backgroundColor: "#ECFDF5" }]}><Ionicons name="checkmark-circle" size={15} color="#059669" /></View>
        <View><Text style={s.floatTop}>Rent paid</Text><Text style={[s.floatBot, { color: "#059669" }]}>₹2,500</Text></View>
      </Animated.View>
      <Animated.View style={[s.floatCard, { top: height * 0.5, right: 18 }, f2Style]} entering={FadeIn.delay(750).duration(700)}>
        <View style={[s.floatIcon, { backgroundColor: "#FFFBEB" }]}><Ionicons name="star" size={15} color="#F59E0B" /></View>
        <View><Text style={s.floatTop}>New review</Text><Text style={[s.floatBot, { color: "#F59E0B" }]}>★★★★★</Text></View>
      </Animated.View>
    </View>
  );
}

function PulseDot({ color = "#34D399" }: { color?: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [p]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: 1 + p.value * 2.4 }], opacity: 1 - p.value }));
  return (
    <View style={{ width: 7, height: 7, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: 7, height: 7, borderRadius: 4, backgroundColor: color }, ring]} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function BounceButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withTiming(0.96, { duration: 90 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  hero: { width: "100%", backgroundColor: "#0B1220", overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  heroBrand: { fontSize: 19, fontWeight: "800", color: "#fff" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.16)", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  liveText: { fontSize: 11, fontWeight: "800", color: "#fff" },

  floatCard: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, paddingVertical: 9, paddingHorizontal: 11, shadowColor: "#0B1220", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  floatIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  floatTop: { fontSize: 9, color: "#94A3B8" },
  floatBot: { fontSize: 13, fontWeight: "800" },

  sheet: { flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -34, paddingHorizontal: 24, paddingTop: 12 },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#E2E8F0", marginBottom: 16 },

  badge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },

  h1: { fontSize: 31, lineHeight: 37, fontWeight: "800", color: "#0F172A", letterSpacing: -0.6 },
  h1grad: { color: "#000" },
  sub: { fontSize: 15, lineHeight: 22, color: "#475569", marginTop: 12 },

  trust: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  trustText: { fontSize: 12, color: "#64748B", fontWeight: "500" },

  ctaPrimary: { flexDirection: "row", gap: 8, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  ctaPrimaryText: { color: "#fff", fontSize: 16.5, fontWeight: "800" },
  altRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 14, marginTop: 2 },
  altDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1" },
  signinText: { color: "#334155", fontSize: 15, fontWeight: "700" },
});
