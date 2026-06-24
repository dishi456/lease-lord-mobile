import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H1, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type LPropertyDetail } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { colors, radius } from "@/lib/theme";

const AVAIL_NEXT: Record<string, string> = { AVAILABLE: "OCCUPIED", OCCUPIED: "UNAVAILABLE", UNAVAILABLE: "AVAILABLE" };

// Rebuild the full property write body (PATCH needs name/type/address/rent + the rest).
function writeBody(p: LPropertyDetail, overrides: Record<string, unknown>) {
  const g = (k: string) => (p as Record<string, unknown>)[k];
  return {
    name: p.name, type: p.type, address: p.address, description: p.description ?? undefined,
    rentAmount: p.rentAmount, securityDeposit: p.securityDeposit,
    numberOfUnits: g("numberOfUnits") ?? 1, noticePeriodDays: g("noticePeriodDays") ?? 30,
    rooms: p.rooms ?? undefined, bathrooms: p.bathrooms ?? undefined, balconies: g("balconies") ?? undefined,
    floor: g("floor") ?? undefined, totalFloors: g("totalFloors") ?? undefined, areaSqft: p.areaSqft ?? undefined,
    carpetAreaSqft: g("carpetAreaSqft") ?? undefined, parkingSpots: g("parkingSpots") ?? undefined,
    maintenanceMonthly: g("maintenanceMonthly") ?? undefined, furnishing: p.furnishing,
    hasLobby: g("hasLobby") ?? false, hasParking: g("hasParking") ?? false, hasLift: g("hasLift") ?? false,
    powerBackup: g("powerBackup") ?? false, bachelorsAllowed: g("bachelorsAllowed") ?? true,
    listedPublic: p.listedPublic, facing: g("facing") ?? undefined, listedBy: g("listedBy") ?? "OWNER",
    projectName: g("projectName") ?? undefined, amenities: p.amenities ?? [], availability: p.availability,
    ...overrides,
  };
}

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refresh } = useAsync(() => api.landlordPropertyDetail(id), [id]);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>;
  const p = data;

  async function patch(overrides: Record<string, unknown>) {
    setBusy(true);
    try {
      await api.landlordUpdateProperty(id, writeBody(p, overrides));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      {p.photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.lg }}>
          {p.photos.map((ph) => (
            <Image key={ph} source={{ uri: fileUrl(ph) }} style={{ width: 320, height: 200, borderRadius: radius.lg, marginRight: 8 }} contentFit="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={{ height: 160, backgroundColor: "#E2E8F0", borderRadius: radius.lg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="business" size={44} color={colors.subtle} />
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H1>{money(p.rentAmount)}/mo</H1>
        <Badge label={p.availability} />
      </View>
      <H2>{p.name}</H2>
      <Muted>{p.address}</Muted>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {p.ref ? <Badge label={`REF ${p.ref}`} /> : null}
        <Badge label={p.approved ? "APPROVED" : "PENDING APPROVAL"} />
        <Badge label={p.listedPublic ? "PUBLIC" : "HIDDEN"} />
      </View>

      <Card>
        <Row label="Type" value={p.type} />
        {p.rooms != null ? <Row label="Bedrooms" value={String(p.rooms)} /> : null}
        {p.bathrooms != null ? <Row label="Bathrooms" value={String(p.bathrooms)} /> : null}
        {p.areaSqft != null ? <Row label="Area" value={`${p.areaSqft} sqft`} /> : null}
        <Row label="Furnishing" value={String(p.furnishing).replace(/_/g, " ")} />
        <Row label="Security deposit" value={money(p.securityDeposit)} />
      </Card>

      {p.description ? <Card><H2>About</H2><Body>{p.description}</Body></Card> : null}

      <Card style={{ gap: 12 }}>
        <H2>Manage</H2>
        <Button title={`Mark ${(AVAIL_NEXT[p.availability] ?? "AVAILABLE").toLowerCase()}`} onPress={() => patch({ availability: AVAIL_NEXT[p.availability] ?? "AVAILABLE" })} loading={busy} />
        <Button
          title={p.listedPublic ? "Hide from public listings" : "Show on public listings"}
          variant="secondary"
          onPress={() => patch({ listedPublic: !p.listedPublic })}
          loading={busy}
        />
        <Muted>Editing full details & photos is available on the web portal.</Muted>
      </Card>
    </Screen>
  );
}
