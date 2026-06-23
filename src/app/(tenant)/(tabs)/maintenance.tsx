import { Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, Button, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function MaintenanceList() {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.maintenance());

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Button title="+ New maintenance request" onPress={() => router.push("/(tenant)/maintenance/new")} />
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No requests" subtitle="Report an issue and your landlord is notified." />
      ) : (
        items.map((m) => (
          <Pressable key={m.id} onPress={() => router.push(`/(tenant)/maintenance/${m.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Body style={{ fontWeight: "700" }}>{m.title}</Body>
                  <Muted>
                    {m.priority} priority · {shortDate(m.createdAt)}
                  </Muted>
                </View>
                <Badge label={m.status} />
                <Ionicons name="chevron-forward" size={18} color={colors.subtle} style={{ marginLeft: 4 }} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
