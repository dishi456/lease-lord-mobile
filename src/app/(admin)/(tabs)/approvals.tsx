import { useState } from "react";
import { Alert, Pressable, RefreshControl, View } from "react-native";
import { Screen, Card, H2, Muted, Body, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError } from "@/lib/api";
import { PropertyImage } from "@/components/PropertyImage";
import { colors } from "@/lib/theme";

export default function Approvals() {
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.adminApprovals());
  const [busy, setBusy] = useState<string | null>(null);
  if (loading) return <Loading />;
  const landlords = data?.landlords ?? [];
  const properties = data?.properties ?? [];

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    try { await fn(); reload(); }
    catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>

      <H2>Landlords ({landlords.length})</H2>
      {landlords.length === 0 ? <Muted>No landlords awaiting approval.</Muted> : landlords.map((l) => (
        <Card key={l.id}>
          <Body style={{ fontWeight: "700" }}>{l.fullName}</Body>
          <Muted>{l.email}{l.phone ? ` · ${l.phone}` : ""}</Muted>
          <Muted style={{ fontSize: 11 }}>Registered {shortDate(l.createdAt)}</Muted>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Btn label="Approve" color={colors.success} busy={busy === l.id} onPress={() => act(l.id, () => api.adminSetUser(l.id, { status: "ACTIVE" }))} />
            <Btn label="Suspend" outline busy={busy === l.id} onPress={() => act(l.id, () => api.adminSetUser(l.id, { status: "SUSPENDED" }))} />
          </View>
        </Card>
      ))}

      <View style={{ height: 8 }} />
      <H2>Properties ({properties.length})</H2>
      {properties.length === 0 ? <Muted>No properties awaiting approval.</Muted> : properties.map((p) => (
        <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
          <PropertyImage path={p.photo} seed={p.id} height={130} />
          <View style={{ padding: 14 }}>
            <Body style={{ fontWeight: "700" }}>{p.name}</Body>
            <Muted>{p.address}</Muted>
            <Muted style={{ fontSize: 11 }}>by {p.landlord} · {shortDate(p.createdAt)}</Muted>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <Btn label="Approve" color={colors.success} busy={busy === p.id} onPress={() => act(p.id, () => api.adminApproveProperty(p.id, true))} />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function Btn({ label, color, outline, busy, onPress }: { label: string; color?: string; outline?: boolean; busy?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={busy} onPress={onPress}
      style={{ flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center", opacity: busy ? 0.6 : 1, backgroundColor: outline ? "#fff" : (color ?? colors.primary), borderWidth: outline ? 1 : 0, borderColor: colors.border }}>
      <Body style={{ color: outline ? colors.text : "#fff", fontWeight: "700", fontSize: 13 }}>{label}</Body>
    </Pressable>
  );
}
