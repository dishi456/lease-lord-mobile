import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export type Stat = { label: string; value: string | number; icon?: keyof typeof Ionicons.glyphMap; color?: string };

// Responsive 2-column grid of metric cards for dashboards.
export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <View style={s.grid}>
      {stats.map((st) => (
        <View key={st.label} style={s.card}>
          {st.icon ? <Ionicons name={st.icon} size={18} color={st.color ?? colors.primary} /> : null}
          <Text style={s.value}>{st.value}</Text>
          <Text style={s.label}>{st.label}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "47.8%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 2 },
  value: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 },
  label: { fontSize: 12, color: colors.muted },
});
