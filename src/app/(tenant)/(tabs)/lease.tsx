import { useState } from "react";
import { Alert, Linking, RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Screen, Card, H2, Muted, Body, Badge, Row, Loading, ErrorText, Button, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, getToken } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { colors, radius } from "@/lib/theme";

// Protected files (e.g. the lease contract) need the auth token. Opening the raw
// URL in a browser has no session, so attach the token as a query param and open
// inside the in-app browser.
async function openProtectedFile(path: string | null | undefined) {
  const base = fileUrl(path);
  if (!base) return;
  const tok = getToken();
  const url = tok ? `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(tok)}` : base;
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => Alert.alert("Could not open", "The document could not be opened."));
  }
}

export default function LeaseScreen() {
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.lease());
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  const lease = data?.lease ?? null;

  async function giveNotice() {
    Alert.alert("Give notice to vacate?", "This notifies your landlord and starts your notice period.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Give notice",
        style: "destructive",
        onPress: async () => {
          setSubmitting(true);
          try {
            const r = await api.giveNotice();
            Alert.alert("Notice given", `Effective ${shortDate(r.noticeEffectiveDate)}.`);
            reload();
          } catch (e) {
            Alert.alert("Could not give notice", e instanceof ApiError ? e.message : "Try again.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {!lease ? (
        <Card>
          <H2>No lease yet</H2>
          <Muted>When your landlord creates your lease, the details show here.</Muted>
        </Card>
      ) : (
        <>
          {lease.property.photos[0] ? (
            <Image source={{ uri: fileUrl(lease.property.photos[0]) }} style={{ width: "100%", height: 180, borderRadius: radius.lg }} contentFit="cover" />
          ) : null}
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <H2>{lease.property.name}</H2>
              <Badge label={lease.status} />
            </View>
            <Muted>{lease.property.address}</Muted>
          </Card>

          <Card>
            <H2>Terms</H2>
            <Row label="Monthly rent" value={money(lease.monthlyRent)} />
            <Row label="Security deposit" value={money(lease.securityDeposit)} />
            {lease.maintenanceFee != null ? <Row label="Maintenance fee" value={money(lease.maintenanceFee)} /> : null}
            <Row label="Start" value={shortDate(lease.startDate)} />
            <Row label="End" value={shortDate(lease.endDate)} />
            <Row label="Notice period" value={`${lease.noticePeriodDays} days`} />
          </Card>

          <Card>
            <H2>Landlord</H2>
            <Row label="Name" value={lease.landlord.name} />
            <Row label="Phone" value={lease.landlord.phone ?? "—"} />
            {lease.landlord.phone ? (
              <Button title="Call landlord" variant="secondary" onPress={() => Linking.openURL(`tel:${lease.landlord.phone}`)} />
            ) : null}
          </Card>

          {lease.signedContractUrl ? (
            <Button title="View signed contract" variant="secondary" onPress={() => openProtectedFile(lease.signedContractUrl)} />
          ) : null}

          {lease.noticeGivenAt ? (
            <Card style={{ borderColor: colors.warning }}>
              <Body style={{ color: colors.warning, fontWeight: "700" }}>Notice given</Body>
              <Muted>Effective {lease.noticeEffectiveDate ? shortDate(lease.noticeEffectiveDate) : "—"}</Muted>
            </Card>
          ) : lease.status === "ACTIVE" || lease.status === "RENEWED" ? (
            <Button title="Give notice to vacate" variant="danger" onPress={giveNotice} loading={submitting} />
          ) : null}
        </>
      )}
    </Screen>
  );
}
