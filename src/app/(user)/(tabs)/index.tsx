import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GradientHeader } from "@/components/header";
import { Card, Muted, Body, Badge, Empty, ErrorText, money } from "@/components/ui";
import { api, ApiError, type Listing } from "@/lib/api";
import { PropertyImage } from "@/components/PropertyImage";
import { getCoords, type Coords } from "@/lib/location";
import { colors, spacing } from "@/lib/theme";

const PAGE_SIZE = 10;

export default function Browse() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"near" | "all">("all");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On open, ask for location. If granted, default to "Near me".
  useEffect(() => {
    (async () => {
      const { coords: c } = await getCoords();
      if (c) { setCoords(c); setMode("near"); }
      setLocating(false);
    })();
  }, []);

  const load = useCallback(async (nextPage: number, term: string, replace: boolean, m: "near" | "all", c: Coords | null) => {
    setLoading(true);
    setError("");
    try {
      if (m === "near" && c) {
        const res = await api.listingsNearby(c.lat, c.lng, { q: term, radius: 50 });
        setItems(res.items);
        setPage(1); setPages(1); setTotal(res.total);
      } else {
        const res = await api.listings({ q: term, page: nextPage, pageSize: PAGE_SIZE, sort: "newest" });
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
        setPage(res.page); setPages(res.pages ?? res.totalPages ?? 1); setTotal(res.total);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (locating) return;
    load(1, query, true, mode, coords);
  }, [query, mode, coords, locating, load]);

  async function enableNearMe() {
    if (coords) { setMode("near"); return; }
    setLocating(true);
    const { coords: c, denied } = await getCoords();
    setLocating(false);
    if (c) { setCoords(c); setMode("near"); }
    else setError(denied ? "Location permission denied. Enable it in Settings to see nearby properties." : "Couldn't get your location.");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>Find your home</Text>
        <Text style={{ color: "#DBEAFE", fontSize: 13, marginTop: 2 }}>
          {mode === "near" ? `${total} ${total === 1 ? "property" : "properties"} near you` : total > 0 ? `${total} verified ${total === 1 ? "property" : "properties"}` : "Browse verified rentals"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 12, marginTop: 14 }}>
          <Ionicons name="search" size={18} color={colors.subtle} />
          <TextInput
            value={q} onChangeText={setQ} placeholder="Search city, area, project…" placeholderTextColor={colors.subtle}
            style={{ flex: 1, paddingVertical: 12, color: colors.text, fontSize: 15 }} returnKeyType="search"
            onSubmitEditing={() => setQuery(q.trim())}
          />
          {q ? <Pressable onPress={() => { setQ(""); setQuery(""); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.subtle} /></Pressable> : null}
        </View>
        {/* Near me / All toggle */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <TogglePill icon="location" label="Near me" active={mode === "near"} onPress={enableNearMe} />
          <TogglePill icon="grid" label="All" active={mode === "all"} onPress={() => setMode("all")} />
        </View>
      </GradientHeader>

      <ErrorText>{error}</ErrorText>

      {locating ? (
        <View style={{ alignItems: "center", paddingVertical: 30 }}>
          <ActivityIndicator color={colors.primary} />
          <Muted style={{ marginTop: 8 }}>Finding properties near you…</Muted>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 32 }}
        renderItem={({ item }) => <ListingCard item={item} onPress={() => router.push(`/(user)/listing/${item.id}`)} />}
        ListEmptyComponent={!loading && !locating ? <Empty title={mode === "near" ? "No properties near you" : "No properties found"} subtitle={mode === "near" ? "Try widening to All." : "Try a different search."} /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (mode === "all" && !loading && page < pages) load(page + 1, query, false, mode, coords); }}
        ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function TogglePill({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? "#fff" : "rgba(255,255,255,0.18)" }}>
      <Ionicons name={icon} size={14} color={active ? colors.primary : "#fff"} />
      <Text style={{ fontWeight: "700", fontSize: 13, color: active ? colors.primary : "#fff" }}>{label}</Text>
    </Pressable>
  );
}

function ListingCard({ item, onPress }: { item: Listing; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <PropertyImage path={item.photo} seed={item.id} height={170} />
        {item.distanceKm != null ? (
          <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
            <Ionicons name="location" size={12} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>{item.distanceKm} km</Text>
          </View>
        ) : null}
        <View style={{ padding: spacing.lg, gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Body style={{ fontWeight: "800", fontSize: 17, flex: 1 }}>{money(item.rent)}/mo</Body>
            {item.verified ? <Badge label="VERIFIED" /> : null}
          </View>
          <Body style={{ fontWeight: "600" }}>{item.name}</Body>
          <Muted>{item.city}</Muted>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            {item.rooms != null ? <Muted>{item.rooms} BHK</Muted> : null}
            {item.bathrooms != null ? <Muted>{item.bathrooms} bath</Muted> : null}
            {item.areaSqft != null ? <Muted>{item.areaSqft} sqft</Muted> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
