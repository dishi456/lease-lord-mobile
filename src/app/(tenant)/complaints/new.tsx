import { useState } from "react";
import { useRouter } from "expo-router";
import { Screen, Field, Button, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function NewComplaint() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (subject.trim().length < 3) return setError("Enter a subject.");
    if (description.trim().length < 5) return setError("Describe your complaint.");
    setLoading(true);
    try {
      await api.createComplaint({ subject: subject.trim(), description: description.trim() });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Noisy neighbours" />
      <Field
        label="Details"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the issue…"
        multiline
        style={{ minHeight: 120, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.card, fontSize: 16, color: colors.text }}
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Submit complaint" onPress={submit} loading={loading} />
    </Screen>
  );
}
