import { Linking, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function TenantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useAsync(() => api.landlordTenant(id), [id]);

  if (loading) return <Loading />;
  if (error || !data?.tenant) return <Screen><ErrorText>{error || "Tenant not found."}</ErrorText></Screen>;
  const t = data.tenant;
  const leases = data.leases ?? [];

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: 8 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
          <Body style={{ color: colors.primary, fontWeight: "800", fontSize: 24 }}>{t.fullName.charAt(0)}</Body>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <H2>{t.fullName}</H2>
          {t.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
        </View>
        <Muted>{t.email}</Muted>
      </Card>

      <Card>
        <Row label="Phone" value={t.phone ?? "—"} />
        <Row label="Verified" value={t.verified ? "Yes" : "No"} />
        {t.governmentId ? <Row label="Government ID" value={t.governmentId} /> : null}
        {t.emergencyContact ? <Row label="Emergency contact" value={t.emergencyContact} /> : null}
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {t.phone ? <View style={{ flex: 1 }}><Button title="Call" onPress={() => Linking.openURL(`tel:${t.phone}`)} /></View> : null}
        <View style={{ flex: 1 }}><Button title="Email" variant="secondary" onPress={() => Linking.openURL(`mailto:${t.email}`)} /></View>
      </View>

      <H2>Leases</H2>
      {leases.length === 0 ? (
        <Empty title="No leases" subtitle="This tenant has no lease history with you." />
      ) : (
        leases.map((l) => (
          <Card key={l.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Body style={{ fontWeight: "700", flex: 1 }}>{l.property?.name ?? "Property"}</Body>
              <Badge label={l.status} />
            </View>
            <Row label="Rent" value={`${money(l.monthlyRent)}/mo`} />
            {l.startDate ? <Row label="Start" value={shortDate(l.startDate)} /> : null}
            {l.endDate ? <Row label="End" value={shortDate(l.endDate)} /> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
