import { RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";

export default function Leases() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordLeases());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No leases" />
      ) : (
        items.map((l) => (
          <Card key={l.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "700" }}>{l.property}</Body>
                <Muted>{l.tenant} · {money(l.monthlyRent)}/mo</Muted>
                <Muted style={{ fontSize: 11 }}>{shortDate(l.startDate)} → {shortDate(l.endDate)}</Muted>
              </View>
              <Badge label={l.status} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
