import { Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Button, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { colors } from "@/lib/theme";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";

export default function Leases() {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordLeases());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      <Button title="＋ New lease" onPress={() => router.push("/(landlord)/lease-new")} />
      {items.length === 0 ? (
        <Empty title="No leases" subtitle="Tap “New lease” to create one." />
      ) : (
        items.map((l) => (
          <Pressable key={l.id} onPress={() => router.push(`/(landlord)/lease/${l.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "700" }}>{l.property}</Body>
                  <Muted>{l.tenant} · {money(l.monthlyRent)}/mo</Muted>
                  <Muted style={{ fontSize: 11 }}>{shortDate(l.startDate)} → {shortDate(l.endDate)}</Muted>
                </View>
                <Badge label={l.status} />
                <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
