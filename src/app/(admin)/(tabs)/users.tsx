import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GradientHeader } from "@/components/header";
import { Card, Muted, Body, Badge, ErrorText, Empty } from "@/components/ui";
import { api, ApiError, type AdminUser } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

const ROLES = ["ALL", "LANDLORD", "TENANT", "USER"];

export default function Users() {
  const [role, setRole] = useState("ALL");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api.adminUsers({ q: query, role: role === "ALL" ? undefined : role, pageSize: 50 });
      setItems(res.items);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not load users."); }
  }, [query, role]);

  useEffect(() => { load(); }, [load]);

  function toggle(u: AdminUser) {
    const next = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    Alert.alert(`${next === "SUSPENDED" ? "Suspend" : "Activate"} ${u.fullName}?`, "", [
      { text: "Cancel", style: "cancel" },
      { text: next === "SUSPENDED" ? "Suspend" : "Activate", style: next === "SUSPENDED" ? "destructive" : "default",
        onPress: async () => {
          setBusy(u.id);
          try { await api.adminSetUser(u.id, { status: next }); await load(); }
          catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
          finally { setBusy(null); }
        } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader>
        <Body style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Users</Body>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, marginTop: 12 }}>
          <Ionicons name="search" size={18} color={colors.subtle} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search name or email" placeholderTextColor={colors.subtle}
            style={{ flex: 1, paddingVertical: 11, color: colors.text }} returnKeyType="search" onSubmitEditing={() => setQuery(q.trim())} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {ROLES.map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: role === r ? "#fff" : "rgba(255,255,255,0.18)" }}>
              <Body style={{ fontSize: 12, fontWeight: "700", color: role === r ? colors.primary : "#fff" }}>{r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}</Body>
            </Pressable>
          ))}
        </View>
      </GradientHeader>

      <ErrorText>{error}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 32 }}
        ListEmptyComponent={<Empty title="No users" />}
        renderItem={({ item: u }) => (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
              <Body style={{ color: colors.primary, fontWeight: "800" }}>{u.fullName.charAt(0)}</Body>
            </View>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "700" }} numberOfLines={1}>{u.fullName}</Body>
              <Muted numberOfLines={1}>{u.role} · {u.email}</Muted>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Badge label={u.status} />
              {u.role !== "MASTER_ADMIN" ? (
                <Pressable disabled={busy === u.id} onPress={() => toggle(u)} hitSlop={6}>
                  <Body style={{ fontSize: 12, fontWeight: "700", color: u.status === "SUSPENDED" ? colors.success : colors.danger }}>
                    {u.status === "SUSPENDED" ? "Activate" : "Suspend"}
                  </Body>
                </Pressable>
              ) : null}
            </View>
          </Card>
        )}
      />
    </View>
  );
}
