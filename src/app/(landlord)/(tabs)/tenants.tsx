import { Linking, RefreshControl, View } from "react-native";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Tenants() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordTenants());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No tenants" subtitle="Add tenants from the web portal." />
      ) : (
        items.map((t) => (
          <Card key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
              <Body style={{ color: colors.primary, fontWeight: "800" }}>{t.fullName.charAt(0)}</Body>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Body style={{ fontWeight: "700" }}>{t.fullName}</Body>
                {t.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.success} /> : null}
              </View>
              <Muted numberOfLines={1}>{t.property ?? t.email}</Muted>
            </View>
            <Badge label={t.status} />
            {t.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${t.phone}`)} hitSlop={8}>
                <Ionicons name="call" size={20} color={colors.primary} />
              </Pressable>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
