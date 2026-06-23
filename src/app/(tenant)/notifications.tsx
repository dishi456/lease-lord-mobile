import { RefreshControl, View } from "react-native";
import { Screen, Card, Muted, Body, Loading, ErrorText, Empty, Button, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Notifications() {
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.notifications());

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  async function markAll() {
    await api.markRead();
    reload();
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      {(data?.unread ?? 0) > 0 ? <Button title={`Mark all read (${data?.unread})`} variant="secondary" onPress={markAll} /> : null}
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No notifications" />
      ) : (
        items.map((n) => (
          <Card key={n.id} style={{ borderColor: n.read ? colors.border : colors.primary }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} /> : null}
              <Body style={{ fontWeight: "700", flex: 1 }}>{n.title}</Body>
            </View>
            {n.body ? <Muted>{n.body}</Muted> : null}
            <Muted style={{ fontSize: 11 }}>{shortDate(n.createdAt)}</Muted>
          </Card>
        ))
      )}
    </Screen>
  );
}
