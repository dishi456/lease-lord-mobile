import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Muted, Body, Badge, Empty, ErrorText, money } from "@/components/ui";
import { api, ApiError, type Listing } from "@/lib/api";
import { fileUrl } from "@/lib/config";
import { colors, spacing } from "@/lib/theme";

const PAGE_SIZE = 10;
const BLUE = "#2563EB";
const CYAN = "#06B6D4";

// Public marketplace — browse listings without an account.
export default function Marketplace() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (nextPage: number, term: string, replace: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listings({ q: term, page: nextPage, pageSize: PAGE_SIZE, sort: "newest" });
      setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
      setPage(res.page);
      setPages(res.pages ?? res.totalPages ?? 1);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, query, true); }, [query, load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[BLUE, "#1D4ED8", CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <SafeAreaView edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={24} color="#fff" /></Pressable>
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Marketplace</Text>
                <Text style={{ color: "#DBEAFE", fontSize: 12 }}>{total > 0 ? `${total} ${total === 1 ? "property" : "properties"} available` : "Browse verified rentals"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, marginTop: 14 }}>
              <Ionicons name="search" size={18} color={colors.subtle} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search city, area, project…" placeholderTextColor={colors.subtle}
                style={{ flex: 1, paddingVertical: 11, color: colors.text, fontSize: 15 }} returnKeyType="search" onSubmitEditing={() => setQuery(q.trim())} />
              {q ? <Pressable onPress={() => { setQ(""); setQuery(""); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.subtle} /></Pressable> : null}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ErrorText>{error}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 32 }}
        renderItem={({ item }) => <ListingCard item={item} onPress={() => router.push(`/(auth)/listing/${item.id}`)} />}
        ListEmptyComponent={!loading ? <Empty title="No properties found" subtitle={query ? "Try a different search." : "No public listings yet."} /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (!loading && page < pages) load(page + 1, query, false); }}
        ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function ListingCard({ item, onPress }: { item: Listing; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {item.photo ? (
          <Image source={{ uri: fileUrl(item.photo) }} style={{ width: "100%", height: 170 }} contentFit="cover" />
        ) : (
          <View style={{ height: 170, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image" size={40} color={colors.subtle} />
          </View>
        )}
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
