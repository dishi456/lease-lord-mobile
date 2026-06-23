import { Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, Button, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function ComplaintsList() {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.complaints());

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Button title="+ New complaint" onPress={() => router.push("/(tenant)/complaints/new")} />
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No complaints" subtitle="Raise a concern with your landlord here." />
      ) : (
        items.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/(tenant)/complaints/${c.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Body style={{ fontWeight: "700" }}>{c.subject}</Body>
                  <Muted>{shortDate(c.createdAt)}</Muted>
                </View>
                <Badge label={c.status} />
                <Ionicons name="chevron-forward" size={18} color={colors.subtle} style={{ marginLeft: 4 }} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
