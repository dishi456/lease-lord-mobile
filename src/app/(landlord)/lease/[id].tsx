import { useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, uploadLeaseContract } from "@/lib/api";
import { openProtectedFile } from "@/lib/openFile";

export default function LandlordLeaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refresh } = useAsync(() => api.landlordLeaseDetail(id), [id]);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>;
  const l = data;

  async function uploadAgreement() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (res.canceled) return;
    setBusy(true);
    try {
      await uploadLeaseContract(id, { uri: res.assets[0].uri, fileName: res.assets[0].fileName, mimeType: res.assets[0].mimeType });
      await refresh();
      Alert.alert("Agreement uploaded", "The signed agreement is now attached to this lease and visible to the tenant.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H2>{l.property?.name ?? "Lease"}</H2>
        <Badge label={l.status} />
      </View>
      {l.property?.address ? <Muted>{l.property.address}</Muted> : null}

      <Card>
        <H2>Tenant</H2>
        <Row label="Name" value={l.tenant?.fullName ?? "—"} />
        <Row label="Email" value={l.tenant?.email ?? "—"} />
        <Row label="Phone" value={l.tenant?.phone ?? "—"} />
      </Card>

      <Card>
        <H2>Terms</H2>
        <Row label="Monthly rent" value={money(l.monthlyRent)} />
        <Row label="Security deposit" value={money(l.securityDeposit)} />
        {l.maintenanceFee != null ? <Row label="Maintenance fee" value={money(l.maintenanceFee)} /> : null}
        <Row label="Start" value={shortDate(l.startDate)} />
        <Row label="End" value={shortDate(l.endDate)} />
        <Row label="Notice period" value={`${l.noticePeriodDays} days`} />
      </Card>

      {l.terms ? <Card><H2>Notes</H2><Body>{l.terms}</Body></Card> : null}

      <Card style={{ gap: 12 }}>
        <H2>Signed agreement</H2>
        {l.signedContractUrl ? (
          <>
            <Muted>An agreement is attached and visible to the tenant.</Muted>
            <Button title="View agreement" variant="secondary" onPress={() => openProtectedFile(l.signedContractUrl)} />
            <Button title="Replace agreement" onPress={uploadAgreement} loading={busy} />
          </>
        ) : (
          <>
            <Muted>Upload a photo/scan of the signed agreement. The tenant will be able to view it.</Muted>
            <Button title="Upload agreement" onPress={uploadAgreement} loading={busy} />
          </>
        )}
      </Card>

      {l.invoices.length > 0 ? (
        <Card>
          <H2>Invoices</H2>
          {l.invoices.map((i) => (
            <Row key={i.id} label={shortDate(i.periodMonth)} value={`${money(i.amount)} · ${i.status}`} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
