import { RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function AdminMaintenance() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.adminMaintenance());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No maintenance requests" subtitle="Requests across all properties appear here." />
      ) : (
        items.map((m) => (
          <Card key={m.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <Body style={{ fontWeight: "800", flex: 1 }}>{m.title}</Body>
              <Badge label={m.status} />
            </View>
            <Muted>{m.property} · {m.tenant}</Muted>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
              <Muted style={{ color: colors.muted }}>Priority: {m.priority} · landlord {m.landlord}</Muted>
              {m.createdAt ? <Muted>{shortDate(m.createdAt)}</Muted> : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
