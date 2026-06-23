import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H1, H2, Muted, Body, Badge, Row, Loading, ErrorText, Button, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { colors, radius } from "@/lib/theme";

// Public listing detail (no auth) — reached from the marketplace.
export default function PublicListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error } = useAsync(() => api.listingDetail(id), [id]);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>;

  return (
    <Screen>
      {data.photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.lg }}>
          {data.photos.map((p) => (
            <Image key={p} source={{ uri: fileUrl(p) }} style={{ width: 320, height: 210, borderRadius: radius.lg, marginRight: 8 }} contentFit="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={{ height: 180, backgroundColor: "#E2E8F0", borderRadius: radius.lg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="image" size={48} color={colors.subtle} />
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H1>{money(data.rent)}/mo</H1>
        {data.landlord.verified ? <Badge label="VERIFIED" /> : null}
      </View>
      <H2>{data.name}</H2>
      <Muted>{data.address}</Muted>

      <Card>
        <Row label="Type" value={data.type} />
        {data.rooms != null ? <Row label="Bedrooms" value={String(data.rooms)} /> : null}
        {data.bathrooms != null ? <Row label="Bathrooms" value={String(data.bathrooms)} /> : null}
        {data.areaSqft != null ? <Row label="Area" value={`${data.areaSqft} sqft`} /> : null}
        <Row label="Furnishing" value={data.furnishing.replace(/_/g, " ")} />
        <Row label="Security deposit" value={money(data.securityDeposit)} />
        {data.maintenanceMonthly != null ? <Row label="Maintenance" value={`${money(data.maintenanceMonthly)}/mo`} /> : null}
      </Card>

      {data.description ? (
        <Card><H2>About</H2><Body>{data.description}</Body></Card>
      ) : null}

      {data.amenities.length > 0 ? (
        <Card>
          <H2>Amenities</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {data.amenities.map((a) => (
              <View key={a} style={{ backgroundColor: colors.infoBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                <Muted style={{ color: colors.primary, fontWeight: "600" }}>{a}</Muted>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <H2>Interested?</H2>
        <Muted>Create a free account to enquire and chat with the owner.</Muted>
        <Button title="Sign in / Create account" onPress={() => router.push("/(auth)/register")} />
      </Card>
    </Screen>
  );
}
