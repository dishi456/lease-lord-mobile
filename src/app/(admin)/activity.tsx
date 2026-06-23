import { RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

// "user.suspend" → "User suspend"
function label(action: string) {
  return action.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function Activity() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.adminActivity());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No activity" />
      ) : (
        items.map((a) => (
          <Card key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "700", fontSize: 14 }}>{label(a.action)}</Body>
              <Muted>{a.entity} · by {a.actor}</Muted>
            </View>
            <Muted style={{ fontSize: 11 }}>{shortDate(a.createdAt)}</Muted>
          </Card>
        ))
      )}
    </Screen>
  );
}
