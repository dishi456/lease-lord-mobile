import { useState } from "react";
import { Alert, Linking, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type LTenantReview, type TenantDoc } from "@/lib/api";
import { authedImageUri, openProtectedFile } from "@/lib/openFile";
import { colors, radius } from "@/lib/theme";

function Stars({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => <Ionicons key={n} name={n <= value ? "star" : "star-outline"} size={13} color={n <= value ? "#F59E0B" : colors.subtle} />)}
    </View>
  );
}

function ReviewCard({ r }: { r: LTenantReview }) {
  return (
    <Card style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Body style={{ fontWeight: "700" }}>{r.by}</Body>
        <Stars value={r.stars} />
      </View>
      {r.property ? <Muted>{r.property}</Muted> : null}
      {r.feedback ? <Body style={{ fontSize: 14 }}>{r.feedback}</Body> : null}
    </Card>
  );
}

export default function TenantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync(() => api.landlordTenant(id), [id]);
  const [blOpen, setBlOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  async function verifyDoc(docId: string, verified: boolean) {
    setVerifyingId(docId);
    try { await api.landlordVerifyDocument(docId, verified); reload(); }
    catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Try again."); }
    finally { setVerifyingId(null); }
  }

  if (loading) return <Loading />;
  if (error || !data?.tenant) return <Screen><ErrorText>{error || "Tenant not found."}</ErrorText></Screen>;
  const t = data.tenant;
  const avatar = authedImageUri(t.avatarUrl);
  const bl = data.blacklist;

  async function blacklist() {
    if (reason.trim().length < 3) return Alert.alert("Reason needed", "Add a short reason for blacklisting.");
    setBusy(true);
    try { await api.landlordSetBlacklist(id, reason.trim()); setBlOpen(false); setReason(""); reload(); }
    catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Try again."); } finally { setBusy(false); }
  }
  function removeBlacklist() {
    Alert.alert("Remove from blacklist?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", onPress: async () => { setBusy(true); try { await api.landlordRemoveBlacklist(id); reload(); } catch { /* */ } finally { setBusy(false); } } },
    ]);
  }

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: 8 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {avatar ? <Image source={{ uri: avatar }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Body style={{ color: colors.primary, fontWeight: "800", fontSize: 24 }}>{t.fullName.charAt(0)}</Body>}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <H2>{t.fullName}</H2>
          {t.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
        </View>
        {t.username ? <Muted>@{t.username}</Muted> : null}
        <Muted>{t.email}</Muted>
        {data.rating != null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Body style={{ fontWeight: "700" }}>{data.rating}</Body>
            <Muted>({data.ratingCount} review{data.ratingCount === 1 ? "" : "s"})</Muted>
          </View>
        ) : null}
        {bl ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.danger + "1A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Ionicons name="ban" size={14} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 11 }}>BLACKLISTED</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Row label="Phone" value={t.phone ?? "—"} />
        {t.governmentId ? <Row label="Government ID" value={t.governmentId} /> : null}
        {t.emergencyContact ? <Row label="Emergency contact" value={t.emergencyContact} /> : null}
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {t.phone ? <View style={{ flex: 1 }}><Button title="Call" onPress={() => Linking.openURL(`tel:${t.phone}`)} /></View> : null}
        <View style={{ flex: 1 }}><Button title="Email" variant="secondary" onPress={() => Linking.openURL(`mailto:${t.email}`)} /></View>
      </View>

      {/* Identity documents the tenant uploaded — view + verify */}
      <H2>Documents</H2>
      <Muted>Identity documents the tenant uploaded. Open to review, then verify.</Muted>
      {data.documents.length === 0 ? (
        <Empty title="No documents" subtitle="This tenant hasn't uploaded any documents yet." />
      ) : (
        data.documents.map((d: TenantDoc) => (
          <Card key={d.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "700" }}>{d.type}</Body>
                {d.numberMasked ? <Muted>{d.numberMasked}</Muted> : null}
                <Muted style={{ fontSize: 12 }}>Uploaded {shortDate(d.createdAt)}{d.expiryDate ? ` · expires ${shortDate(d.expiryDate)}` : ""}</Muted>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: (d.verified ? colors.success : "#D97706") + "1A", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
                <Ionicons name={d.verified ? "checkmark-circle" : "time"} size={13} color={d.verified ? colors.success : "#D97706"} />
                <Text style={{ color: d.verified ? colors.success : "#D97706", fontWeight: "700", fontSize: 10 }}>{d.verificationStatus}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Button title="View document" variant="secondary" onPress={() => openProtectedFile(d.url)} /></View>
              {d.verified ? (
                <View style={{ flex: 1 }}><Button title="Un-verify" variant="secondary" onPress={() => verifyDoc(d.id, false)} loading={verifyingId === d.id} /></View>
              ) : (
                <View style={{ flex: 1 }}><Button title="Verify" onPress={() => verifyDoc(d.id, true)} loading={verifyingId === d.id} /></View>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Blacklist management */}
      <Card style={{ gap: 10 }}>
        <H2>Blacklist</H2>
        {bl ? (
          <>
            <View style={{ backgroundColor: colors.danger + "12", borderRadius: radius.md, padding: 12 }}>
              <Muted style={{ color: colors.danger, fontWeight: "700" }}>Reason</Muted>
              <Body>{bl.reason}</Body>
              <Muted style={{ marginTop: 4 }}>Blacklisted {shortDate(bl.createdAt)}</Muted>
            </View>
            <Button title="Remove from blacklist" variant="secondary" onPress={removeBlacklist} loading={busy} />
          </>
        ) : blOpen ? (
          <>
            <Muted>Add a specific reason. The tenant stays on your blacklist until you remove it.</Muted>
            <TextInput value={reason} onChangeText={setReason} placeholder="e.g. Repeated late rent, property damage…" placeholderTextColor={colors.subtle} multiline
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, minHeight: 70, color: colors.text }} />
            <Button title="Confirm blacklist" variant="danger" onPress={blacklist} loading={busy} />
            <Button title="Cancel" variant="secondary" onPress={() => setBlOpen(false)} />
          </>
        ) : (
          <Button title="Blacklist this tenant" variant="danger" onPress={() => setBlOpen(true)} />
        )}
      </Card>

      {/* Rental history */}
      <H2>Rental history</H2>
      <Muted>Everywhere this tenant has lived.</Muted>
      {data.leases.length === 0 ? (
        <Empty title="No rental history" subtitle="No leases on record yet." />
      ) : (
        data.leases.map((l) => (
          <Card key={l.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Body style={{ fontWeight: "700", flex: 1 }}>{l.property?.name ?? "Property"}</Body>
              <Badge label={l.status} />
            </View>
            {l.property?.address || l.property?.city ? <Muted>{[l.property?.address, l.property?.city].filter(Boolean).join(", ")}</Muted> : null}
            <Muted>{l.mine ? "Your property" : `Landlord · ${l.landlord?.fullName ?? "—"}`}</Muted>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Muted style={{ fontSize: 12 }}>{shortDate(l.startDate)} → {shortDate(l.endDate)}</Muted>
              <Muted style={{ fontSize: 12 }}>{money(l.monthlyRent)}/mo</Muted>
            </View>
          </Card>
        ))
      )}

      {/* Reviews about the tenant */}
      {data.reviews.length > 0 ? (
        <>
          <H2>Reviews from landlords</H2>
          {data.reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
        </>
      ) : null}
    </Screen>
  );
}
