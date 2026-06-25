import { RefreshControl, Text, View } from "react-native";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Loading, ErrorText, Empty } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type ChatConversation } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { colors } from "@/lib/theme";

function timeShort(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function preview(c: ChatConversation) {
  if (!c.lastMessage) return "No messages yet — say hello 👋";
  const m = c.lastMessage;
  const txt = m.body || (m.attachmentType === "image" ? "📷 Photo" : "📎 Attachment");
  return `${m.mine ? "You: " : ""}${txt}`;
}

export function ChatList({ basePath }: { basePath: string }) {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.chatConversations());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No conversations yet" subtitle="Every active lease has its own chat. They appear here once a lease is active." />
      ) : (
        items.map((c) => {
          const avatar = authedImageUri(c.other.avatarUrl) ?? authedImageUri(c.property.photo);
          return (
            <Pressable key={c.leaseId} onPress={() => router.push(`${basePath}/${c.leaseId}` as never)}>
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {avatar ? <Image source={{ uri: avatar }} style={{ width: 50, height: 50 }} contentFit="cover" /> : <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>{c.other.name.charAt(0).toUpperCase()}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Body style={{ fontWeight: "700", flex: 1 }} numberOfLines={1}>{c.other.name}</Body>
                    <Muted style={{ fontSize: 11 }}>{timeShort(c.lastMessage?.createdAt)}</Muted>
                  </View>
                  <Muted numberOfLines={1} style={{ fontSize: 12 }}>{c.property.name} · {c.leaseNumber}</Muted>
                  <Muted numberOfLines={1} style={{ color: c.unread ? colors.text : colors.muted, fontWeight: c.unread ? "600" : "400" }}>{preview(c)}</Muted>
                </View>
                {c.unread > 0 ? (
                  <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{c.unread}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
                )}
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
