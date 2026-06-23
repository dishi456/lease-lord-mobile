import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type LComplaint } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function Complaints() {
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.landlordComplaints());
  const [active, setActive] = useState<LComplaint | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  async function send() {
    if (!active || !reply.trim()) return;
    setBusy(true);
    try { await api.landlordRespondComplaint(active.id, { body: reply.trim() }); setActive(null); setReply(""); reload(); }
    catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function resolve(c: LComplaint) {
    setBusy(true);
    try { await api.landlordRespondComplaint(c.id, { status: "RESOLVED" }); reload(); }
    catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <ErrorText>{error}</ErrorText>
        {items.length === 0 ? (
          <Empty title="No complaints" />
        ) : (
          items.map((c) => (
            <Card key={c.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Body style={{ fontWeight: "700" }}>{c.subject}</Body>
                  <Muted>{c.tenant}{c.property ? ` · ${c.property}` : ""}</Muted>
                  <Muted style={{ fontSize: 11 }}>{shortDate(c.createdAt)}</Muted>
                </View>
                <Badge label={c.status} />
              </View>
              {active?.id === c.id ? (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <TextInput value={reply} onChangeText={setReply} placeholder="Write a response…" placeholderTextColor={colors.subtle} multiline
                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, minHeight: 70, color: colors.text }} />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable disabled={busy} onPress={send} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center", opacity: busy ? 0.6 : 1 }}>
                      <Body style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Send response</Body>
                    </Pressable>
                    <Pressable onPress={() => setActive(null)} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: "center" }}>
                      <Body style={{ fontWeight: "700", fontSize: 13 }}>Cancel</Body>
                    </Pressable>
                  </View>
                </View>
              ) : c.status !== "RESOLVED" && c.status !== "CLOSED" ? (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <Pressable onPress={() => { setActive(c); setReply(""); }} style={{ flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 9, alignItems: "center" }}>
                    <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                    <Body style={{ fontWeight: "700", fontSize: 13 }}>Respond</Body>
                  </Pressable>
                  <Pressable disabled={busy} onPress={() => resolve(c)} style={{ flex: 1, backgroundColor: colors.success, borderRadius: 10, paddingVertical: 9, alignItems: "center", opacity: busy ? 0.6 : 1 }}>
                    <Body style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Resolve</Body>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
