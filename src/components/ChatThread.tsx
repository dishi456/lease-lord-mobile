import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loading } from "@/components/ui";
import { api, uploadChatAttachment, type ChatHeader, type ChatMessage } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { colors, radius } from "@/lib/theme";

function dayLabel(iso: string) {
  const d = new Date(iso), now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
function presence(lastSeenAt: string | null) {
  if (!lastSeenAt) return "Offline";
  const mins = (Date.now() - new Date(lastSeenAt).getTime()) / 60000;
  if (mins < 2) return "Active now";
  if (mins < 60) return `Active ${Math.round(mins)}m ago`;
  if (mins < 1440) return `Active ${Math.round(mins / 60)}h ago`;
  return "Offline";
}

export function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [conv, setConv] = useState<ChatHeader | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  async function load() {
    try {
      const d = await api.chatThread(id);
      setConv(d.conversation);
      setMessages(d.messages);
    } catch { /* keep current */ } finally { setLoading(false); }
  }

  // Initial load + poll every 4s for near-real-time.
  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => { if (conv) navigation.setOptions({ title: conv.other.name }); }, [conv?.other.name]);
  useEffect(() => { const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60); return () => clearTimeout(t); }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setText("");
    setBusy(true);
    try { await api.chatSend(id, { body }); await load(); } catch { setText(body); } finally { setBusy(false); }
  }
  async function attach() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (res.canceled) return;
    setBusy(true);
    try {
      const up = await uploadChatAttachment({ uri: res.assets[0].uri, fileName: res.assets[0].fileName, mimeType: res.assets[0].mimeType });
      await api.chatSend(id, { attachmentUrl: up.url, attachmentType: "image" });
      await load();
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  if (loading) return <Loading />;

  let lastDay = "";
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["bottom"]}>
      {conv ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="home" size={13} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1 }} numberOfLines={1}>{conv.property.name} · {conv.leaseNumber}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: presence(conv.other.lastSeenAt) === "Active now" ? colors.success : colors.subtle }} />
            <Text style={{ color: colors.muted, fontSize: 11 }}>{presence(conv.other.lastSeenAt)}</Text>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 12, gap: 4 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.subtle} />
              <Text style={{ color: colors.muted, marginTop: 8 }}>No messages yet. Say hello 👋</Text>
            </View>
          ) : null}
          {messages.map((m) => {
            const d = dayLabel(m.createdAt);
            const showDay = d !== lastDay; lastDay = d;
            const img = m.attachmentUrl ? authedImageUri(m.attachmentUrl) : undefined;
            return (
              <View key={m.id}>
                {showDay ? (
                  <View style={{ alignItems: "center", marginVertical: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.muted, backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: "hidden" }}>{d}</Text>
                  </View>
                ) : null}
                <View style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "82%", backgroundColor: m.mine ? colors.primary : colors.card, borderRadius: 16, borderBottomRightRadius: m.mine ? 4 : 16, borderBottomLeftRadius: m.mine ? 16 : 4, padding: img ? 4 : 10, borderWidth: m.mine ? 0 : 1, borderColor: colors.border, marginVertical: 2 }}>
                  {img ? (
                    <Pressable onPress={() => setViewer(img)}>
                      <Image source={{ uri: img }} style={{ width: 200, height: 200, borderRadius: 12 }} contentFit="cover" />
                    </Pressable>
                  ) : null}
                  {m.body ? <Text style={{ color: m.mine ? "#fff" : colors.text, fontSize: 15, paddingHorizontal: img ? 6 : 0, paddingTop: img ? 6 : 0 }}>{m.body}</Text> : null}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, paddingHorizontal: img ? 6 : 0, marginTop: 2 }}>
                    <Text style={{ fontSize: 10, color: m.mine ? "rgba(255,255,255,0.8)" : colors.subtle }}>{clock(m.createdAt)}</Text>
                    {m.mine ? <Ionicons name={m.readAt ? "checkmark-done" : "checkmark"} size={13} color={m.readAt ? "#BFDBFE" : "rgba(255,255,255,0.8)"} /> : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
          <Pressable onPress={attach} disabled={busy} hitSlop={6} style={{ padding: 8 }}>
            <Ionicons name="image" size={24} color={colors.primary} />
          </Pressable>
          <TextInput
            value={text} onChangeText={setText} placeholder="Message…" placeholderTextColor={colors.subtle} multiline
            style={{ flex: 1, maxHeight: 120, backgroundColor: colors.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, color: colors.text }}
          />
          <Pressable onPress={send} disabled={busy || !text.trim()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: busy || !text.trim() ? 0.5 : 1 }}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!viewer} transparent onRequestClose={() => setViewer(null)}>
        <Pressable onPress={() => setViewer(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
          {viewer ? <Image source={{ uri: viewer }} style={{ width: "100%", height: "80%" }} contentFit="contain" /> : null}
          <View style={{ position: "absolute", top: 50, right: 20 }}><Ionicons name="close" size={32} color="#fff" /></View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
