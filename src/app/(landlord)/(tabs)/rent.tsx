import { useState } from "react";
import { Alert, RefreshControl, View } from "react-native";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { StatGrid } from "@/components/stats";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type LInvoice } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Rent() {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh, reload } = useAsync(() => api.landlordInvoices());
  const [busy, setBusy] = useState<string | null>(null);
  if (loading) return <Loading />;
  const items = data?.items ?? [];

  function pay(inv: LInvoice) {
    router.push({
      pathname: "/(landlord)/record-payment",
      params: { invoiceId: inv.id, amount: String(inv.amount), balance: String(inv.balance ?? inv.amount), tenant: inv.tenant, property: inv.property, periodMonth: inv.periodMonth },
    });
  }

  async function remind(inv: LInvoice) {
    setBusy(inv.id);
    try { await api.landlordRemindInvoice(inv.id); Alert.alert("Reminder sent", `${inv.tenant} was notified.`); }
    catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ErrorText>{error}</ErrorText>
      <StatGrid stats={[
        { label: "Collected (mo)", value: money(data?.kpis.collectedThisMonth ?? 0), icon: "cash", color: "#059669" },
        { label: "Pending", value: money(data?.kpis.pending ?? 0), icon: "time", color: "#D97706" },
        { label: "Overdue", value: money(data?.kpis.overdue ?? 0), icon: "alert-circle", color: "#DC2626" },
      ]} />

      <View style={{ height: 8 }} />
      {items.length === 0 ? (
        <Empty title="No invoices" />
      ) : (
        items.map((i) => (
          <Card key={i.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "700" }}>{money(i.amount)}</Body>
                <Muted>{i.tenant} · {i.property}</Muted>
                <Muted style={{ fontSize: 11 }}>Due {shortDate(i.dueDate)}</Muted>
                {i.status === "PARTIALLY_PAID" ? <Muted style={{ fontSize: 11, color: "#D97706" }}>Paid {money(i.amountPaid ?? 0)} · balance {money(i.balance ?? 0)}</Muted> : null}
              </View>
              <Badge label={i.status} />
            </View>
            {i.status !== "PAID" && i.status !== "CANCELLED" ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable disabled={busy === i.id} onPress={() => pay(i)} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 9, alignItems: "center", opacity: busy === i.id ? 0.6 : 1 }}>
                  <Body style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Record payment</Body>
                </Pressable>
                <Pressable disabled={busy === i.id} onPress={() => remind(i)} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 9, alignItems: "center", opacity: busy === i.id ? 0.6 : 1 }}>
                  <Body style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>Remind</Body>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
