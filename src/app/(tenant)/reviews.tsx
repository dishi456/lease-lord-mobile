import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type ReviewCriteria } from "@/lib/api";
import { colors } from "@/lib/theme";

const CRITERIA: { key: keyof ReviewCriteria; label: string }[] = [
  { key: "propertyQuality", label: "Property quality" },
  { key: "maintenanceSupport", label: "Maintenance support" },
  { key: "communication", label: "Communication" },
  { key: "transparency", label: "Transparency" },
  { key: "overall", label: "Overall" },
];

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={26} color={n <= value ? "#F59E0B" : colors.subtle} />
        </Pressable>
      ))}
    </View>
  );
}

export default function Reviews() {
  const { data, loading, error, reload } = useAsync(() => api.pendingReviews());
  const [openLease, setOpenLease] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<ReviewCriteria>({ propertyQuality: 5, maintenanceSupport: 5, communication: 5, transparency: 5, overall: 5 });
  const [feedback, setFeedback] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  const items = data?.items ?? [];

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

      {items.length === 0 ? (
        <Empty title="Nothing to review" subtitle="Ended leases you can rate will appear here." />
      ) : (
        items.map((l) => (
          <Card key={l.leaseId}>
            <Body style={{ fontWeight: "700" }}>{l.property.name}</Body>
            <Muted>
              {l.landlordName} · ended {shortDate(l.endDate)}
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
              <Button title="Rate now" variant="secondary" onPress={() => setOpenLease(l.leaseId)} />
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
