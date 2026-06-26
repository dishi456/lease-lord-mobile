import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H1, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError } from "@/lib/api";
import { PropertyImage } from "@/components/PropertyImage";
import { colors, radius } from "@/lib/theme";

// A few near-future tour slots so the seeker can book without a date picker.
function slot(daysAhead: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}
const SLOTS = [
  { label: "Tomorrow, 11 AM", at: slot(1, 11) },
  { label: "Tomorrow, 4 PM", at: slot(1, 16) },
  { label: "In 2 days, 11 AM", at: slot(2, 11) },
];

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useAsync(() => api.listingDetail(id), [id]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  async function apply() {
    setApplying(true);
    try {
      await api.applyToProperty(id);
      setApplied(true);
      Alert.alert("Application sent", "The landlord will review your request.");
    } catch (e) {
      Alert.alert("Couldn't apply", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setApplying(false);
    }
  }

  async function book(at: Date) {
    setBooking(true);
    try {
      await api.bookVisit(id, at.toISOString());
      setShowSlots(false);
      Alert.alert("Visit requested", "The landlord will confirm your tour time.");
    } catch (e) {
      Alert.alert("Couldn't book", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>;

  return (
    <Screen>
      {data.photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.lg }}>
          {data.photos.map((p, i) => (
            <PropertyImage key={p} path={p} seed={`${id}-${i}`} style={{ width: 320, height: 210, borderRadius: radius.lg, marginRight: 8 }} />
          ))}
        </ScrollView>
      ) : (
        <PropertyImage seed={id} style={{ width: "100%", height: 210, borderRadius: radius.lg }} />
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
        {data.floor != null ? <Row label="Floor" value={`${data.floor}${data.totalFloors ? ` of ${data.totalFloors}` : ""}`} /> : null}
        {data.facing ? <Row label="Facing" value={data.facing} /> : null}
      </Card>

      {data.description ? (
        <Card>
          <H2>About</H2>
          <Body>{data.description}</Body>
        </Card>
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
        <H2>Listed by</H2>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Body>{data.landlord.name}</Body>
          {data.landlord.rating != null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="star" size={15} color="#F59E0B" />
              <Body style={{ fontWeight: "700" }}>{data.landlord.rating.toFixed(1)}</Body>
              <Muted>({data.landlord.ratingCount})</Muted>
            </View>
          ) : null}
        </View>
      </Card>

      {data.reviews.length > 0 ? (
        <Card>
          <H2>Tenant reviews</H2>
          {data.reviews.map((r) => (
            <View key={r.id} style={{ gap: 2, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Body style={{ fontWeight: "700" }}>{r.by}</Body>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons key={n} name={n <= r.stars ? "star" : "star-outline"} size={13} color={n <= r.stars ? "#F59E0B" : colors.subtle} />
                  ))}
                </View>
              </View>
              {r.feedback ? <Body>{r.feedback}</Body> : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <H2>Interested?</H2>
        <Button title={applied ? "✓ Application sent" : "Apply to rent"} onPress={apply} loading={applying} disabled={applied} />
        <Button title="Book a visit" variant="secondary" onPress={() => setShowSlots((s) => !s)} />
        {showSlots ? (
          <View style={{ gap: 8 }}>
            <Muted>Pick a preferred time:</Muted>
            {SLOTS.map((sl) => (
              <Pressable
                key={sl.label}
                onPress={() => book(sl.at)}
                disabled={booking}
                style={{ padding: 13, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, opacity: booking ? 0.6 : 1 }}
              >
                <Text style={{ fontWeight: "700", color: colors.text }}>{sl.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
