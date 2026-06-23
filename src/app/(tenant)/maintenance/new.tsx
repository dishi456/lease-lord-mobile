import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Field, Button, ErrorText, Muted } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export default function NewMaintenance() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("MEDIUM");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (title.trim().length < 3) return setError("Enter a short title.");
    if (description.trim().length < 5) return setError("Describe the issue.");
    setLoading(true);
    try {
      await api.createMaintenance({ title: title.trim(), description: description.trim(), priority });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Leaking kitchen tap" />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe what's wrong…"
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.card, fontSize: 16, color: colors.text }}
      />
      <Muted>Priority</Muted>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={{
              flex: 1,
              padding: 12,
              alignItems: "center",
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: priority === p ? colors.primary : colors.border,
              backgroundColor: priority === p ? colors.infoBg : colors.card,
            }}
          >
            <Text style={{ fontWeight: "700", color: priority === p ? colors.primary : colors.text }}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      <Button title="Submit request" onPress={submit} loading={loading} />
    </Screen>
  );
}
