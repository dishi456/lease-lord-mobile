import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type TenantCriteria, type ReviewView } from "@/lib/api";
import { colors } from "@/lib/theme";

const CRITERIA: { key: keyof TenantCriteria; label: string }[] = [
  { key: "rentDiscipline", label: "Rent discipline" },
  { key: "propertyMaintenance", label: "Property care" },
  { key: "communication", label: "Communication" },
  { key: "ruleCompliance", label: "Rule compliance" },
  { key: "conduct", label: "Conduct" },
];

function Stars({ value, onChange, size = 24 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} disabled={!onChange} hitSlop={6}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={size} color={n <= value ? "#F59E0B" : colors.subtle} />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewRow({ r, who }: { r: ReviewView; who: string }) {
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Body style={{ fontWeight: "700" }}>{r.counterparty || who}</Body>
        <Stars value={r.stars} size={16} />
      </View>
      {r.property ? <Muted>{r.property}</Muted> : null}
      {r.feedback ? <Body style={{ marginTop: 4 }}>{r.feedback}</Body> : null}
      {r.createdAt ? <Muted style={{ marginTop: 4 }}>{shortDate(r.createdAt)}</Muted> : null}
    </Card>
  );
}

export default function Reviews() {
  const { data, loading, error, reload } = useAsync(() => Promise.all([api.landlordPendingReviews(), api.landlordReviews(), api.landlordBlacklist()]));
  const [open, setOpen] = useState<string | null>(null);
  const [c, setC] = useState<TenantCriteria>({ rentDiscipline: 5, propertyMaintenance: 5, communication: 5, ruleCompliance: 5, conduct: 5 });
  const [feedback, setFeedback] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  const pending = data?.[0]?.items ?? [];
  const received = data?.[1]?.received ?? [];
  const given = data?.[1]?.given ?? [];
  const blacklisted = data?.[2]?.items ?? [];

  async function removeBl(tenantId: string) {
    setBusy(true);
    try { await api.landlordRemoveBlacklist(tenantId); reload(); } catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); } finally { setBusy(false); }
  }

  async function submit(leaseId: string) {
    setBusy(true);
    try {
      const vals = Object.values(c);
      const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      await api.landlordRateTenant({ leaseId, stars: overall, criteria: c, feedback: feedback.trim() || undefined, recommend });
      Alert.alert("Submitted", "Your review of the tenant was saved.");
      setOpen(null); setFeedback(""); reload();
    } catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <H2>Rate tenants</H2>
      <Muted>Review the tenant on any of your current or past leases.</Muted>
      <ErrorText>{error}</ErrorText>
      {pending.length === 0 ? (
        <Empty title="Nothing to review" subtitle="Your active and past leases appear here." />
      ) : (
        pending.map((l) => {
          const ended = ["COMPLETED", "EXPIRED", "TERMINATED"].includes(l.status);
          return (
          <Card key={l.leaseId}>
            <Body style={{ fontWeight: "700" }}>{l.tenant}</Body>
            <Muted>{l.property}{l.endDate ? ` · ${ended ? "ended" : "ends"} ${shortDate(l.endDate)}` : ""}</Muted>
            {open === l.leaseId ? (
              <View style={{ gap: 12, marginTop: 8 }}>
                {CRITERIA.map((cr) => (
                  <View key={cr.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Body>{cr.label}</Body>
                    <Stars value={c[cr.key]} onChange={(n) => setC((p) => ({ ...p, [cr.key]: n }))} />
                  </View>
                ))}
                <Field label="Feedback (optional)" value={feedback} onChangeText={setFeedback} placeholder="Notes about this tenant…" multiline />
                <Pressable onPress={() => setRecommend((r) => !r)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name={recommend ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
                  <Body>I recommend this tenant</Body>
                </Pressable>
                <Button title="Submit review" onPress={() => submit(l.leaseId)} loading={busy} />
                <Button title="Cancel" variant="secondary" onPress={() => setOpen(null)} />
              </View>
            ) : (
              <Button title={l.existingRating ? "Edit review" : "Rate now"} variant="secondary" onPress={() => setOpen(l.leaseId)} />
            )}
          </Card>
          );
        })
      )}

      {received.length > 0 ? (
        <>
          <H2>Reviews about you</H2>
          <Muted>What tenants have publicly shared about you.</Muted>
          {received.map((r) => <ReviewRow key={r.id} r={r} who="A tenant" />)}
        </>
      ) : null}

      {given.length > 0 ? (
        <>
          <H2>Reviews you gave</H2>
          {given.map((r) => <ReviewRow key={r.id} r={r} who="Tenant" />)}
        </>
      ) : null}

      <H2>Blacklisted tenants</H2>
      <Muted>Blacklist a tenant with a reason from their profile (Tenants → tap a tenant).</Muted>
      {blacklisted.length === 0 ? (
        <Empty title="No blacklisted tenants" />
      ) : (
        blacklisted.map((b) => (
          <Card key={b.tenantId} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="ban" size={16} color={colors.danger} />
              <Body style={{ fontWeight: "700", flex: 1 }}>{b.tenant.fullName}</Body>
              <Muted style={{ fontSize: 11 }}>{shortDate(b.createdAt)}</Muted>
            </View>
            <Muted>{b.reason}</Muted>
            <Button title="Remove from blacklist" variant="secondary" onPress={() => removeBl(b.tenantId)} loading={busy} />
          </Card>
        ))
      )}
    </Screen>
  );
}
