import { Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Button, Loading, ErrorText, Empty, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { PropertyImage } from "@/components/PropertyImage";
import { colors } from "@/lib/theme";

export default function Properties() {
  const router = useRouter();
  // useAsync already refetches on focus, so a newly listed property shows up.
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordProperties());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      <Button title="＋ List a property" onPress={() => router.push("/(landlord)/property-new")} />
      {items.length === 0 ? (
        <Empty title="No properties yet" subtitle="Tap “List a property” to add your first one." />
      ) : (
        items.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/(landlord)/property/${p.id}`)}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <PropertyImage path={p.photo} seed={p.id} height={150} />
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
          </Pressable>
        ))
      )}
    </Screen>
  );
}
