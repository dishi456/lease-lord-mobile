import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H1, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { condLabel } from "@/lib/marketplace";
import { colors, radius } from "@/lib/theme";

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => api.marketplaceDetail(id), [id]);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Listing not found."}</ErrorText></Screen>;
  const l = data;
  const seller = l.seller;
  const savatar = authedImageUri(seller.avatarUrl);

  async function toggleFav() {
    try { await api.marketplaceFavorite(id, !l.favorited); reload(); } catch { /* ignore */ }
  }
  async function setStatus(status: "SOLD" | "AVAILABLE") {
    setBusy(true);
    try { await api.marketplaceUpdate(id, { status }); reload(); } catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Try again."); } finally { setBusy(false); }
  }
  function confirmDelete() {
    Alert.alert("Delete listing?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await api.marketplaceDelete(id); router.back(); } catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Try again."); } } },
    ]);
  }

  return (
    <Screen>
      {l.images.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.lg }}>
          {l.images.map((im) => <Image key={im} source={{ uri: authedImageUri(im) }} style={{ width: 320, height: 240, borderRadius: radius.lg, marginRight: 8 }} contentFit="cover" />)}
        </ScrollView>
      ) : (
        <View style={{ height: 200, backgroundColor: "#E2E8F0", borderRadius: radius.lg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="pricetag" size={44} color={colors.subtle} />
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H1>{money(l.price)}</H1>
        <Pressable onPress={toggleFav} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name={l.favorited ? "heart" : "heart-outline"} size={26} color={l.favorited ? "#EF4444" : colors.text} />
          <Muted>{l.favorites}</Muted>
        </Pressable>
      </View>
      <H2>{l.title}</H2>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Badge label={l.category} />
        <Badge label={condLabel(l.condition)} />
        <Badge label={l.status} />
      </View>

      <Card>
        {l.location ? <Row label="Location" value={l.location} /> : null}
        <Row label="Posted" value={shortDate(l.createdAt)} />
        <Row label="Condition" value={condLabel(l.condition)} />
      </Card>

      {l.description ? <Card><H2>Description</H2><Body>{l.description}</Body></Card> : null}

      <Card>
        <H2>Seller</H2>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {savatar ? <Image source={{ uri: savatar }} style={{ width: 48, height: 48 }} contentFit="cover" /> : <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>{seller.name.charAt(0).toUpperCase()}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Body style={{ fontWeight: "700" }}>{seller.name}</Body>
              {seller.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.success} /> : null}
            </View>
            <Muted>{seller.listings} listing{seller.listings === 1 ? "" : "s"}{seller.city ? ` · ${seller.city}` : ""}</Muted>
          </View>
        </View>
      </Card>

      {l.mine ? (
        <Card style={{ gap: 12 }}>
          <H2>Manage</H2>
          <Button title="Edit listing" onPress={() => router.push(`/(tenant)/marketplace/new?id=${id}`)} />
          {l.status === "AVAILABLE"
            ? <Button title="Mark as sold" variant="secondary" onPress={() => setStatus("SOLD")} loading={busy} />
            : <Button title="Mark as available" variant="secondary" onPress={() => setStatus("AVAILABLE")} loading={busy} />}
          <Button title="Delete listing" variant="danger" onPress={confirmDelete} />
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <H2>Interested?</H2>
          {seller.phone ? <Button title="Call seller" onPress={() => Linking.openURL(`tel:${seller.phone}`)} /> : null}
          <Button title="Email seller" variant="secondary" onPress={() => Linking.openURL(`mailto:${seller.email}?subject=${encodeURIComponent("About your listing: " + l.title)}`)} />
        </Card>
      )}
    </Screen>
  );
}
