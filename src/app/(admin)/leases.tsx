import { RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function AdminLeases() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.adminLeases());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No leases" subtitle="Active and past leases across the platform appear here." />
      ) : (
        items.map((l) => (
          <Card key={l.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Body style={{ fontWeight: "800", flex: 1 }}>{l.property}</Body>
              <Badge label={l.status} />
            </View>
            <Muted>{l.tenant} · landlord {l.landlord}</Muted>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
              <Body style={{ fontWeight: "700", color: colors.primary }}>{money(l.monthlyRent)}/mo</Body>
              <Muted>{shortDate(l.startDate)} → {shortDate(l.endDate)}</Muted>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
