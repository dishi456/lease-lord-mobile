import { useState } from "react";
import { Alert, Pressable, RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type LMaintenance } from "@/lib/api";
import { colors } from "@/lib/theme";

const NEXT: Record<string, string[]> = {
  PENDING: ["ASSIGNED", "IN_PROGRESS", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
};

export default function Maintenance() {
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.landlordMaintenance());
  const [busy, setBusy] = useState<string | null>(null);
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  function manage(m: LMaintenance) {
    const options = NEXT[m.status] ?? [];
    if (options.length === 0) return Alert.alert("No actions", `This request is ${m.status}.`);
    Alert.alert(m.title, "Update status to:", [
      ...options.map((status) => ({
        text: status.replace(/_/g, " "),
        onPress: async () => {
          setBusy(m.id);
          try { await api.landlordUpdateMaintenance(m.id, { status }); reload(); }
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
        <Empty title="No maintenance requests" />
      ) : (
        items.map((m) => (
          <Pressable key={m.id} onPress={() => manage(m)} disabled={busy === m.id} style={{ opacity: busy === m.id ? 0.6 : 1 }}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Body style={{ fontWeight: "700" }}>{m.title}</Body>
                  <Muted>{m.tenant} · {m.property}</Muted>
                  <Muted style={{ fontSize: 11 }}>{m.priority} · {shortDate(m.createdAt)}</Muted>
                </View>
                <Badge label={m.status} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
