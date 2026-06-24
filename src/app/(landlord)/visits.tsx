import { useState } from "react";
import { Linking, Pressable, RefreshControl, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, Button, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type LVisit } from "@/lib/api";
import { colors } from "@/lib/theme";

function whenStr(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function Visits() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordVisits());
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  async function decide(v: LVisit, action: "confirm" | "decline") {
    setBusy(v.id);
    try {
      await api.landlordDecideVisit(v.id, action);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No visit requests" subtitle="Tour requests for your properties will appear here to confirm or decline." />
      ) : (
        items.map((v) => {
          const pending = v.status === "PENDING";
          const at = whenStr(v.preferredAt);
          return (
            <Card key={v.id} style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "700" }}>{v.fullName || v.email}</Body>
                  {v.property ? <Muted numberOfLines={1}>{v.property}</Muted> : null}
                </View>
                <Badge label={v.status} />
              </View>

              {at ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="time" size={15} color={colors.muted} />
                  <Muted>Preferred: {at}</Muted>
                </View>
              ) : null}
              {v.message ? <Body style={{ color: colors.muted }}>“{v.message}”</Body> : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {v.phone ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${v.phone}`)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }} hitSlop={6}>
                    <Ionicons name="call" size={15} color={colors.primary} />
                    <Muted style={{ color: colors.primary }}>{v.phone}</Muted>
                  </Pressable>
                ) : null}
                {v.createdAt ? <Muted>Asked {shortDate(v.createdAt)}</Muted> : null}
              </View>

              {pending ? (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Confirm" onPress={() => decide(v, "confirm")} loading={busy === v.id} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Decline" variant="danger" onPress={() => decide(v, "decline")} loading={busy === v.id} />
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
