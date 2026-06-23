import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Field, Button, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type TenantCriteria } from "@/lib/api";
import { colors } from "@/lib/theme";

const CRITERIA: { key: keyof TenantCriteria; label: string }[] = [
  { key: "rentDiscipline", label: "Rent discipline" },
  { key: "propertyMaintenance", label: "Property care" },
  { key: "communication", label: "Communication" },
  { key: "ruleCompliance", label: "Rule compliance" },
  { key: "conduct", label: "Conduct" },
];

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={24} color={n <= value ? "#F59E0B" : colors.subtle} />
        </Pressable>
      ))}
    </View>
  );
}

export default function Reviews() {
  const { data, loading, error, reload } = useAsync(() => api.landlordPendingReviews());
  const [open, setOpen] = useState<string | null>(null);
  const [c, setC] = useState<TenantCriteria>({ rentDiscipline: 5, propertyMaintenance: 5, communication: 5, ruleCompliance: 5, conduct: 5 });
  const [feedback, setFeedback] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  async function submit(leaseId: string) {
    setBusy(true);
    try {
      await api.landlordRateTenant({ leaseId, stars: c.conduct, criteria: c, feedback: feedback.trim() || undefined, recommend });
      Alert.alert("Submitted", "Your review of the tenant was saved.");
      setOpen(null); setFeedback(""); reload();
    } catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Muted>Rate tenants once their lease has ended.</Muted>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="Nothing to review" subtitle="Ended leases you can rate appear here." />
      ) : (
        items.map((l) => (
          <Card key={l.leaseId}>
            <Body style={{ fontWeight: "700" }}>{l.tenant}</Body>
            <Muted>{l.property} · ended {shortDate(l.endDate)}</Muted>
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
              <Button title="Rate now" variant="secondary" onPress={() => setOpen(l.leaseId)} />
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
