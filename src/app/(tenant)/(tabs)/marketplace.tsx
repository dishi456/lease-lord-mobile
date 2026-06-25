import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Loading, ErrorText, Empty, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, type MktListing } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { CATEGORIES, condLabel } from "@/lib/marketplace";
import { colors, radius } from "@/lib/theme";

const SCOPES = [{ k: "all", l: "Browse" }, { k: "mine", l: "My listings" }, { k: "favorites", l: "Wishlist" }];

function ListingCard({ l, onFav, onOpen }: { l: MktListing; onFav: () => void; onOpen: () => void }) {
  const img = authedImageUri(l.images[0]);
  return (
    <Pressable onPress={onOpen} style={{ width: "48%" }}>
      <Card style={{ padding: 0, overflow: "hidden", gap: 0 }}>
        <View>
          {img ? (
            <Image source={{ uri: img }} style={{ width: "100%", height: 120 }} contentFit="cover" />
          ) : (
            <View style={{ height: 120, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="pricetag" size={28} color={colors.subtle} />
            </View>
          )}
          <Pressable onPress={onFav} hitSlop={8} style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 14, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={l.favorited ? "heart" : "heart-outline"} size={16} color={l.favorited ? "#EF4444" : colors.text} />
          </Pressable>
          {l.status === "SOLD" ? (
            <View style={{ position: "absolute", bottom: 6, left: 6, backgroundColor: colors.text, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 10 }}>SOLD</Text>
            </View>
          ) : null}
        </View>
        <View style={{ padding: 10, gap: 2 }}>
          <Body style={{ fontWeight: "800" }} numberOfLines={1}>{money(l.price)}</Body>
          <Muted numberOfLines={1}>{l.title}</Muted>
          <Muted style={{ fontSize: 11 }}>{condLabel(l.condition)}{l.location ? ` · ${l.location}` : ""}</Muted>
        </View>
      </Card>
    </Pressable>
  );
}

export default function Marketplace() {
  const router = useRouter();
  const [scope, setScope] = useState("all");
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, loading, refreshing, error, refresh, reload } = useAsync(
    () => api.marketplaceListings({ scope, category: category ?? undefined, q: q || undefined }),
    [scope, category, q],
  );
  const items = data?.items ?? [];

  async function toggleFav(l: MktListing) {
    try { await api.marketplaceFavorite(l.id, !l.favorited); reload(); } catch { /* ignore */ }
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: 12 }}>
        {/* Search + Sell */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 }}>
            <Ionicons name="search" size={18} color={colors.subtle} />
            <TextInput
              value={search} onChangeText={setSearch} onSubmitEditing={() => setQ(search.trim())} returnKeyType="search"
              placeholder="Search items…" placeholderTextColor={colors.subtle}
              style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: colors.text }}
            />
            {search ? <Pressable onPress={() => { setSearch(""); setQ(""); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.subtle} /></Pressable> : null}
          </View>
          <Pressable onPress={() => router.push("/(tenant)/sell")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 14 }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700" }}>Sell</Text>
          </Pressable>
        </View>

        {/* Scope */}
        <View style={{ flexDirection: "row", backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 3 }}>
          {SCOPES.map((s) => {
            const active = scope === s.k;
            return (
              <Pressable key={s.k} onPress={() => setScope(s.k)} style={{ flex: 1, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: active ? colors.primary : "transparent", alignItems: "center" }}>
                <Text style={{ fontWeight: "700", fontSize: 12, color: active ? "#fff" : colors.muted }}>{s.l}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ maxHeight: 40 }}>
          <CategoryChip label="All" active={!category} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => <CategoryChip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
        </ScrollView>

        <ErrorText>{error}</ErrorText>
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty title="Nothing here yet" subtitle={scope === "mine" ? "Tap Sell to list an item." : scope === "favorites" ? "Tap the heart on items to save them." : "Try a different category or search."} />
        ) : (
          <ScrollView
            contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            showsVerticalScrollIndicator={false}
          >
            {items.map((l) => <ListingCard key={l.id} l={l} onFav={() => toggleFav(l)} onOpen={() => router.push(`/(tenant)/item/${l.id}`)} />)}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card, height: 36 }}>
      <Text style={{ fontWeight: "700", fontSize: 12, color: active ? colors.primary : colors.text }}>{label}</Text>
    </Pressable>
  );
}
