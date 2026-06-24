import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loading, ErrorText } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function InquiryChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refresh } = useAsync(() => api.landlordInquiryThread(id), [id]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const messages = data?.messages ?? [];
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await api.landlordReplyInquiry(id, body);
      setText("");
      await refresh();
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10 }}>
          <ErrorText>{error}</ErrorText>
          {messages.map((m) => (
            <View
              key={m.id}
              style={{
                alignSelf: m.fromGuest ? "flex-start" : "flex-end",
                maxWidth: "82%",
                backgroundColor: m.fromGuest ? colors.card : colors.primary,
                borderWidth: m.fromGuest ? 1 : 0,
                borderColor: colors.border,
                borderRadius: radius.lg,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: m.fromGuest ? colors.text : "#fff", fontSize: 15, lineHeight: 20 }}>{m.body}</Text>
            </View>
          ))}
          {messages.length === 0 ? <Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>No messages yet.</Text> : null}
        </ScrollView>

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a reply…"
            placeholderTextColor={colors.subtle}
            multiline
            style={{ flex: 1, maxHeight: 110, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text }}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: sending || !text.trim() ? 0.5 : 1 }}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
