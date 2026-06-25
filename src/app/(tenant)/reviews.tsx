import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type ReviewCriteria, type ReviewView } from "@/lib/api";
import { colors } from "@/lib/theme";

const CRITERIA: { key: keyof ReviewCriteria; label: string }[] = [
  { key: "propertyQuality", label: "Property quality" },
  { key: "maintenanceSupport", label: "Maintenance support" },
  { key: "communication", label: "Communication" },
  { key: "transparency", label: "Transparency" },
  { key: "overall", label: "Overall" },
];

function Stars({ value, onChange, size = 26 }: { value: number; onChange?: (n: number) => void; size?: number }) {
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
  const { data, loading, error, reload } = useAsync(() => Promise.all([api.pendingReviews(), api.tenantReviews()]));
  const [openLease, setOpenLease] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<ReviewCriteria>({ propertyQuality: 5, maintenanceSupport: 5, communication: 5, transparency: 5, overall: 5 });
  const [feedback, setFeedback] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  const pending = data?.[0]?.items ?? [];
  const received = data?.[1]?.received ?? [];
  const given = data?.[1]?.given ?? [];

  async function submit(leaseId: string) {
    setSubmitting(true);
    try {
      await api.submitReview({ leaseId, stars: criteria.overall, criteria, feedback: feedback.trim() || undefined, recommend });
      Alert.alert("Thank you", "Your review has been submitted.");
      setOpenLease(null);
      setFeedback("");
      reload();
    } catch (e) {
      Alert.alert("Could not submit", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <H2>Rate your landlords</H2>
      <Muted>You can review a landlord once your lease has ended.</Muted>
      <ErrorText>{error}</ErrorText>

      {pending.length === 0 ? (
        <Empty title="Nothing to review" subtitle="Ended leases you can rate will appear here." />
      ) : (
        pending.map((l) => (
          <Card key={l.leaseId}>
            <Body style={{ fontWeight: "700" }}>{l.property.name}</Body>
            <Muted>
              {l.landlordName}
              {l.endDate ? ` · ended ${shortDate(l.endDate)}` : ""}
            </Muted>

            {openLease === l.leaseId ? (
              <View style={{ gap: 12, marginTop: 8 }}>
                {CRITERIA.map((c) => (
                  <View key={c.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Body>{c.label}</Body>
                    <Stars value={criteria[c.key]} onChange={(n) => setCriteria((p) => ({ ...p, [c.key]: n }))} />
                  </View>
                ))}
                <Field label="Feedback (optional)" value={feedback} onChangeText={setFeedback} placeholder="Share your experience…" multiline />
                <Pressable onPress={() => setRecommend((r) => !r)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name={recommend ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
                  <Body>I recommend this landlord</Body>
                </Pressable>
                <Button title="Submit review" onPress={() => submit(l.leaseId)} loading={submitting} />
                <Button title="Cancel" variant="secondary" onPress={() => setOpenLease(null)} />
              </View>
            ) : (
              <Button title={l.existingRating ? "Edit review" : "Rate now"} variant="secondary" onPress={() => setOpenLease(l.leaseId)} />
            )}
          </Card>
        ))
      )}

      {received.length > 0 ? (
        <>
          <H2>Reviews about you</H2>
          <Muted>What landlords have publicly shared about you.</Muted>
          {received.map((r) => <ReviewRow key={r.id} r={r} who="A landlord" />)}
        </>
      ) : null}

      {given.length > 0 ? (
        <>
          <H2>Reviews you gave</H2>
          {given.map((r) => <ReviewRow key={r.id} r={r} who="Landlord" />)}
        </>
      ) : null}
    </Screen>
  );
}
