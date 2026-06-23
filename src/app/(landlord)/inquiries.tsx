import { Linking, RefreshControl, View } from "react-native";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Inquiries() {
  const { data, loading, refreshing, error, refresh } = useAsync(() => api.landlordInquiries());
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <Empty title="No enquiries" subtitle="Property enquiries from seekers appear here." />
      ) : (
        items.map((i) => (
          <Card key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Body style={{ fontWeight: "700" }}>{i.guestName}</Body>
                {i.unread > 0 ? <View style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}>
                  <Body style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{i.unread}</Body>
                </View> : null}
              </View>
              <Muted numberOfLines={1}>{i.lastMessage ? i.lastMessage.body : i.property}</Muted>
              <Muted style={{ fontSize: 11 }}>{i.property} · {shortDate(i.updatedAt)}</Muted>
            </View>
            <Pressable onPress={() => Linking.openURL(`tel:${i.guestPhone}`)} hitSlop={8}>
              <Ionicons name="call" size={20} color={colors.primary} />
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
}
