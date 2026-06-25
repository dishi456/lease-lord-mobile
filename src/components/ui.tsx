import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, statusColor } from "@/lib/theme";
import { formatMoney } from "@/lib/currency";

export function Screen({ children, scroll = true, refreshControl }: { children: React.ReactNode; scroll?: boolean; refreshControl?: React.ReactElement<any> }) {
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scrollBody} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={s.body}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}
export function Muted({ children, style, numberOfLines }: { children: React.ReactNode; style?: object; numberOfLines?: number }) {
  return <Text style={[s.muted, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Body({ children, style, numberOfLines }: { children: React.ReactNode; style?: object; numberOfLines?: number }) {
  return <Text style={[s.bodyText, style]} numberOfLines={numberOfLines}>{children}</Text>;
}

export function Badge({ label }: { label: string }) {
  const c = statusColor(label);
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeText, { color: c.fg }]}>{label.replace(/_/g, " ")}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.card;
  const fg = variant === "secondary" ? colors.text : "#fff";
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
        variant === "secondary" && { borderWidth: 1, borderColor: colors.border },
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.subtle} style={s.input} {...props} />
    </View>
  );
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <Text style={s.error}>{children}</Text>;
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Muted style={{ textAlign: "center", marginTop: 4 }}>{subtitle}</Muted> : null}
    </View>
  );
}

// Delegates to the app-wide currency setting (tenant preference).
export function money(n: number) {
  return formatMoney(n);
}
export function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scrollBody: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  h1: { fontSize: 26, fontWeight: "800", color: colors.text },
  h2: { fontSize: 18, fontWeight: "700", color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  bodyText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  btn: { height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnText: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, gap: 12 },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, fontWeight: "600", color: colors.text, flexShrink: 1, textAlign: "right" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  error: { color: colors.danger, fontSize: 14, fontWeight: "500" },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
});
