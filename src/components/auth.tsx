import React from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo } from "@/components/Logo";

const BLUE = "#2563EB";
const CYAN = "#06B6D4";

// Shared branded shell for the auth screens — matches the website landing:
// gradient accent bar, brand logo row, big title + subtitle, then the form.
export function AuthScreen({
  title,
  subtitle,
  children,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBack?: boolean;
}) {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {showBack ? (
            <Pressable onPress={() => router.back()} hitSlop={10} style={s.back}>
              <Ionicons name="chevron-back" size={22} color="#334155" />
            </Pressable>
          ) : null}

          <View style={s.brandRow}>
            <Logo size={36} radius={10} />
            <Text style={s.brandName}>Lease Lord</Text>
          </View>

          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

          <View style={{ marginTop: 22, gap: 16 }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Gradient primary button matching the landing page CTAs.
export function GradientButton({ title, onPress, loading, disabled }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} style={({ pressed }) => ({ opacity: off ? 0.6 : pressed ? 0.9 : 1 })}>
      <LinearGradient colors={[BLUE, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  body: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", marginBottom: 4 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  logoBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 19, fontWeight: "800", color: "#0F172A" },
  title: { fontSize: 30, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5, marginTop: 26 },
  subtitle: { fontSize: 15, color: "#64748B", marginTop: 8, lineHeight: 21 },
  btn: { height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
