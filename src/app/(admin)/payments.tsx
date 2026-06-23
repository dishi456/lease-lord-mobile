import { RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { StatGrid } from "@/components/stats";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";

export default function Payments() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.adminPayments());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      <StatGrid stats={[
        { label: "Total collected", value: money(data?.kpis.totalCollected ?? 0), icon: "cash", color: "#059669" },
        { label: "This month", value: money(data?.kpis.thisMonth ?? 0), icon: "calendar", color: "#2563EB" },
        { label: "Outstanding", value: money(data?.kpis.outstanding ?? 0), icon: "time", color: "#D97706" },
        { label: "Refunded", value: money(data?.kpis.refunded ?? 0), icon: "arrow-undo", color: "#DC2626" },
      ]} />
      <View style={{ height: 8 }} />
      {items.length === 0 ? (
        <Empty title="No payments" />
      ) : (
        items.map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "700" }}>{money(p.amount)}</Body>
                <Muted>{p.tenant} · {p.property}</Muted>
                <Muted style={{ fontSize: 11 }}>{p.method.replace(/_/g, " ")} · {p.paidAt ? shortDate(p.paidAt) : shortDate(p.createdAt)}</Muted>
              </View>
              <Badge label={p.status} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
