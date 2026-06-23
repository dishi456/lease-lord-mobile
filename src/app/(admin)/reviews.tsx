import { useState } from "react";
import { Alert, Pressable, RefreshControl, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type AdminReview } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Reviews() {
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.adminReviews());
  const [busy, setBusy] = useState<string | null>(null);
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  function moderate(r: AdminReview) {
    const opts: { label: string; status: string }[] = [];
    if (r.status !== "VISIBLE") opts.push({ label: "Restore (visible)", status: "VISIBLE" });
    if (r.status !== "FLAGGED") opts.push({ label: "Flag", status: "FLAGGED" });
    if (r.status !== "REMOVED") opts.push({ label: "Remove", status: "REMOVED" });
    Alert.alert("Moderate review", `${r.from} → ${r.to}`, [
      ...opts.map((o) => ({
        text: o.label,
        style: (o.status === "REMOVED" ? "destructive" : "default") as "destructive" | "default",
        onPress: async () => {
          setBusy(r.id);
          try { await api.adminModerateReview(r.id, o.status); reload(); }
          catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
          finally { setBusy(null); }
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No reviews" />
      ) : (
        items.map((r) => (
          <Pressable key={r.id} onPress={() => moderate(r)} disabled={busy === r.id} style={{ opacity: busy === r.id ? 0.6 : 1 }}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Body style={{ color: "#F59E0B", fontSize: 13 }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</Body>
                <Badge label={r.status} />
              </View>
              {r.feedback ? <Muted style={{ marginTop: 4 }}>“{r.feedback}”</Muted> : null}
              <Muted style={{ fontSize: 11, marginTop: 4 }}>{r.from} ({r.fromRole}) → {r.to} · {shortDate(r.createdAt)}</Muted>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
