import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export type GuideStep = { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; body: string };

// A full-screen, MANDATORY, non-skippable feature walkthrough. Drives any list
// of steps; used by both the landlord and tenant onboarding guides.
export function FeatureGuide({ visible, steps, onDone }: { visible: boolean; steps: GuideStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = steps[i] ?? steps[0];
  const last = i === steps.length - 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { /* mandatory — back is disabled */ }}>
      <View style={s.root}>
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          <View style={s.topRow}>
            <Text style={s.counter}>Step {i + 1} of {steps.length}</Text>
          </View>

          <View style={s.heroWrap}>
            <LinearGradient colors={[step.color, step.color + "CC"]} style={s.hero}>
              <Ionicons name={step.icon} size={62} color="#fff" />
            </LinearGradient>
          </View>

          <View style={s.copy}>
            <Text style={s.title}>{step.title}</Text>
            <Text style={s.body}>{step.body}</Text>
          </View>

          <View style={s.dots}>
            {steps.map((_, n) => (
              <View key={n} style={[s.dot, n === i ? { backgroundColor: step.color, width: 20 } : null]} />
            ))}
          </View>

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
  heroWrap: { alignItems: "center", marginTop: 24 },
  hero: { width: 124, height: 124, borderRadius: 34, alignItems: "center", justifyContent: "center", shadowColor: "#1E3A8A", shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  copy: { paddingHorizontal: 28, marginTop: 30, flex: 1 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", letterSpacing: -0.4 },
  body: { fontSize: 15.5, lineHeight: 24, color: colors.muted, textAlign: "center", marginTop: 14 },
  dots: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 6, marginBottom: 18, paddingHorizontal: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#CBD5E1" },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, width: 80 },
  backText: { fontSize: 15, fontWeight: "700", color: colors.muted },
  next: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, height: 52, borderRadius: 26, justifyContent: "center", shadowColor: "#2563EB", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
