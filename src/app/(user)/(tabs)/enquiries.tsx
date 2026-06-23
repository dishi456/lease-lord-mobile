import { RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { colors, radius } from "@/lib/theme";

export default function Enquiries() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.enquiries());

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No enquiries yet" subtitle="When you contact an owner about a property, it appears here." />
      ) : (
        items.map((e) => (
          <Card key={e.token} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {e.property.photo ? (
              <Image source={{ uri: fileUrl(e.property.photo) }} style={{ width: 56, height: 56, borderRadius: radius.md }} contentFit="cover" />
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="home" size={24} color={colors.subtle} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "700" }}>{e.property.name}</Body>
              {e.lastMessage ? (
                <Muted numberOfLines={1}>
                  {e.lastMessage.fromGuest ? "You: " : ""}
                  {e.lastMessage.body}
                </Muted>
              ) : (
                <Muted>{e.property.address}</Muted>
              )}
              <Muted style={{ fontSize: 11 }}>{shortDate(e.updatedAt)}</Muted>
            </View>
            {e.unread > 0 ? (
              <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                <Body style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{e.unread}</Body>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
