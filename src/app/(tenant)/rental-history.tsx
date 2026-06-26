import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Badge, Row, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type RentalRecord } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { houseImage } from "@/lib/house-images";
import { authedImageUri } from "@/lib/openFile";
import { colors, radius } from "@/lib/theme";

function duration(start: string, end: string) {
  const s = new Date(start), e = new Date(end);
  let m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (m < 0) m = 0;
  const y = Math.floor(m / 12);
  const mm = m % 12;
  return [y ? `${y} yr` : null, mm ? `${mm} mo` : null].filter(Boolean).join(" ") || "< 1 mo";
}

function Stars({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => <Ionicons key={n} name={n <= value ? "star" : "star-outline"} size={13} color={n <= value ? "#F59E0B" : colors.subtle} />)}
    </View>
  );
}

function ReviewBlock({ title, r }: { title: string; r: RentalRecord["reviewFromLandlord"] }) {
  if (!r) return null;
  return (
    <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Muted style={{ fontWeight: "700" }}>{title}</Muted>
        <Stars value={r.stars} />
      </View>
      {r.feedback ? <Body style={{ fontSize: 14 }}>{r.feedback}</Body> : null}
    </View>
  );
}

export default function RentalHistory() {
  const { data, loading, error } = useAsync(() => api.tenantRentals());
  if (loading) return <Loading />;
  if (error) return <Screen><ErrorText>{error}</ErrorText></Screen>;
  const items = data?.items ?? [];

  return (
    <Screen>
      <H2>Rental history</H2>
      <Muted>Your complete rental timeline — saved permanently.</Muted>

      {items.length === 0 ? (
        <Empty title="No rental records yet" subtitle="Your past and current leases will appear here." />
      ) : (
        items.map((r) => {
          const photo = authedImageUri(r.property.photo) ?? (r.property.photo ? fileUrl(r.property.photo) : undefined) ?? houseImage(r.id);
          const lavatar = authedImageUri(r.landlord.avatarUrl);
          return (
            <Card key={r.id} style={{ padding: 0, overflow: "hidden" }}>
              <Image source={{ uri: photo }} style={{ width: "100%", height: 140 }} contentFit="cover" transition={200} />
              <View style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Body style={{ fontWeight: "800", flex: 1 }}>{r.property.name}</Body>
                  <Badge label={r.status} />
                </View>
                <Muted>{r.property.address}</Muted>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {lavatar ? <Image source={{ uri: lavatar }} style={{ width: 28, height: 28 }} contentFit="cover" /> : <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>{r.landlord.name.charAt(0)}</Text>}
                  </View>
                  <Muted>Landlord · {r.landlord.name}</Muted>
                </View>

                <View style={{ marginTop: 4 }}>
                  <Row label="Stay" value={`${shortDate(r.startDate)} → ${shortDate(r.endDate)}`} />
                  <Row label="Duration" value={duration(r.startDate, r.endDate)} />
                  <Row label="Monthly rent" value={money(r.monthlyRent)} />
                  <Row label="Security deposit" value={money(r.securityDeposit)} />
                </View>

                <ReviewBlock title="Landlord's review of you" r={r.reviewFromLandlord} />
                <ReviewBlock title="Your review of the landlord" r={r.reviewFromTenant} />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
