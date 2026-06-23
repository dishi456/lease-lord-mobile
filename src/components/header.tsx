import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const BLUE = "#2563EB";
const CYAN = "#06B6D4";

// Brand gradient header for primary in-app screens. `overlap` adds bottom
// padding so a following card can be pulled up to sit over the header.
export function GradientHeader({
  children,
  overlap = false,
}: {
  children: React.ReactNode;
  overlap?: boolean;
}) {
  return (
    <LinearGradient colors={[BLUE, "#1D4ED8", CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.wrap}>
      <SafeAreaView edges={["top"]}>
        <View style={[s.inner, overlap && { paddingBottom: 56 }]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Round icon button used in headers (bell, avatar fallback, etc.).
export function HeaderIcon({ name, onPress, badge }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; badge?: number }) {
  return (
    <Pressable onPress={onPress} style={s.iconBtn} hitSlop={8}>
      <Ionicons name={name} size={20} color="#fff" />
      {badge && badge > 0 ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  inner: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
