import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Badge, Loading, ErrorText, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function ComplaintDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync(() => api.complaintDetail(id), [id]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>;

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.replyComplaint(id, body);
      setText("");
      reload();
    } catch (e) {
      Alert.alert("Could not send", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Screen>
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <H2>{data.subject}</H2>
            <Badge label={data.status} />
          </View>
          {data.property ? <Muted>{data.property.name}</Muted> : null}
          <Body style={{ marginTop: 6 }}>{data.description}</Body>
        </Card>

        {data.messages.map((m) => (
          <View
            key={m.id}
            style={{
              alignSelf: m.mine ? "flex-end" : "flex-start",
              backgroundColor: m.mine ? colors.primary : colors.card,
              borderWidth: m.mine ? 0 : 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: 12,
              maxWidth: "85%",
            }}
          >
            <Body style={{ color: m.mine ? "#fff" : colors.text }}>{m.body}</Body>
            <Muted style={{ color: m.mine ? "#dbeafe" : colors.subtle, fontSize: 11, marginTop: 4 }}>{shortDate(m.createdAt)}</Muted>
          </View>
        ))}
      </Screen>

      <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a reply…"
          placeholderTextColor={colors.subtle}
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, color: colors.text }}
          multiline
        />
        <Pressable onPress={send} disabled={sending} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1 }}>
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
