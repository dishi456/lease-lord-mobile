import { RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { colors } from "@/lib/theme";

export default function Properties() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordProperties());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No properties" subtitle="Add properties from the web portal." />
      ) : (
        items.map((p) => (
          <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
            {p.photo ? (
              <Image source={{ uri: fileUrl(p.photo) }} style={{ width: "100%", height: 150 }} contentFit="cover" />
            ) : (
              <View style={{ height: 150, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="business" size={38} color={colors.subtle} />
              </View>
            )}
            <View style={{ padding: 14, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Body style={{ fontWeight: "800", flex: 1 }}>{p.name}</Body>
                <Badge label={p.availability} />
              </View>
              <Muted>{p.address}</Muted>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                <Body style={{ fontWeight: "700" }}>{money(p.rent)}/mo</Body>
                {!p.approved ? <Badge label="PENDING APPROVAL" /> : null}
                {p.tenants.length > 0 ? <Muted>· {p.tenants.join(", ")}</Muted> : null}
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
