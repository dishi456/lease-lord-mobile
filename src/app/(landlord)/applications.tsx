import { useState } from "react";
import { Linking, Pressable, RefreshControl, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, Button, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type LApplication } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Applications() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordApplications());
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  async function decide(app: LApplication, decision: "APPROVED" | "REJECTED") {
    setBusy(app.id);
    try {
      await api.landlordDecideApplication(app.id, decision);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No requests yet" subtitle="When someone applies to rent one of your properties, their request shows up here for you to approve." />
      ) : (
        items.map((a) => {
          const pending = a.status === "PENDING";
          return (
            <Card key={a.id} style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
                  <Body style={{ color: colors.primary, fontWeight: "800" }}>{a.fullName.charAt(0) || "?"}</Body>
                </View>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "700" }}>{a.fullName || a.email}</Body>
                  {a.property ? <Muted numberOfLines={1}>Wants: {a.property}</Muted> : null}
                </View>
                <Badge label={a.status} />
              </View>

              {a.message ? <Body style={{ color: colors.muted }}>“{a.message}”</Body> : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {a.phone ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${a.phone}`)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }} hitSlop={6}>
                    <Ionicons name="call" size={15} color={colors.primary} />
                    <Muted style={{ color: colors.primary }}>{a.phone}</Muted>
                  </Pressable>
                ) : null}
                {a.createdAt ? <Muted>{shortDate(a.createdAt)}</Muted> : null}
              </View>

              {pending ? (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Approve" onPress={() => decide(a, "APPROVED")} loading={busy === a.id} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Reject" variant="danger" onPress={() => decide(a, "REJECTED")} loading={busy === a.id} />
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
