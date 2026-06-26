import { useState } from "react";
import { Alert, RefreshControl, View } from "react-native";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Body, Badge, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { StatGrid } from "@/components/stats";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, type LInvoice } from "@/lib/api";
import { openProtectedFile } from "@/lib/openFile";
import { methodLabel } from "@/lib/payments";
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

  function markPaid(inv: LInvoice, paid: boolean) {
    Alert.alert(paid ? "Mark as paid?" : "Mark as unpaid?", paid ? `Mark ${inv.tenant}'s rent (${money(inv.amount)}) as paid?` : "Revert this invoice to unpaid?", [
      { text: "Cancel", style: "cancel" },
      { text: paid ? "Mark paid" : "Mark unpaid", onPress: async () => {
        setBusy(inv.id);
        try { await api.landlordMarkPaid(inv.id, paid); reload(); }
        catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
        finally { setBusy(null); }
      } },
    ]);
  }

  async function decideProof(paymentId: string, action: "confirm" | "reject") {
    setBusy(paymentId);
    try {
      const r = await api.landlordConfirmPayment(paymentId, action);
      Alert.alert(action === "confirm" ? "Payment confirmed" : "Proof rejected", action === "confirm" && r.receiptNumber ? `Receipt ${r.receiptNumber}` : "");
      reload();
    } catch (e) { Alert.alert("Error", e instanceof ApiError ? e.message : "Failed"); }
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
            {/* Tenant-submitted payment proofs awaiting confirmation */}
            {(i.payments ?? []).filter((p) => p.status === "PENDING").map((p) => (
              <View key={p.id} style={{ marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: "#D97706", backgroundColor: "#D9770612", padding: 10, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="hourglass" size={15} color="#D97706" />
                  <Body style={{ fontWeight: "700", flex: 1, fontSize: 13 }}>Tenant sent proof · {money(p.amount)} · {methodLabel(p.method)}</Body>
                </View>
                {p.reference ? <Muted style={{ fontSize: 11 }}>Ref: {p.reference}</Muted> : null}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {p.proofUrl ? (
                    <Pressable onPress={() => openProtectedFile(p.proofUrl)} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}>
                      <Body style={{ fontSize: 12, fontWeight: "700" }}>View proof</Body>
                    </Pressable>
                  ) : null}
                  <Pressable disabled={busy === p.id} onPress={() => decideProof(p.id, "confirm")} style={{ flex: 1, backgroundColor: colors.success, borderRadius: 8, paddingVertical: 8, alignItems: "center", opacity: busy === p.id ? 0.6 : 1 }}>
                    <Body style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Confirm</Body>
                  </Pressable>
                  <Pressable disabled={busy === p.id} onPress={() => decideProof(p.id, "reject")} style={{ flex: 1, borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingVertical: 8, alignItems: "center", opacity: busy === p.id ? 0.6 : 1 }}>
                    <Body style={{ color: colors.danger, fontSize: 12, fontWeight: "700" }}>Reject</Body>
                  </Pressable>
                </View>
              </View>
            ))}

            {i.status !== "PAID" && i.status !== "CANCELLED" ? (
              i.hasAgreement === false ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
                  <Ionicons name="lock-closed" size={14} color={colors.muted} />
                  <Muted style={{ fontSize: 12, flex: 1 }}>Upload the signed lease agreement to record payments.</Muted>
                  <Pressable disabled={busy === i.id} onPress={() => remind(i)}><Muted style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>Remind</Muted></Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <Pressable disabled={busy === i.id} onPress={() => pay(i)} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 9, alignItems: "center", opacity: busy === i.id ? 0.6 : 1 }}>
                    <Body style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Record payment</Body>
                  </Pressable>
                  <Pressable disabled={busy === i.id} onPress={() => remind(i)} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 9, alignItems: "center", opacity: busy === i.id ? 0.6 : 1 }}>
                    <Body style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>Remind</Body>
                  </Pressable>
                </View>
              )
            ) : null}

            {/* Quick paid/unpaid toggle */}
            {i.status === "PAID" ? (
              <Pressable disabled={busy === i.id} onPress={() => markPaid(i, false)} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 }}>
                <Ionicons name="refresh" size={14} color={colors.danger} />
                <Muted style={{ color: colors.danger, fontSize: 12, fontWeight: "700" }}>Mark as unpaid</Muted>
              </Pressable>
            ) : i.status !== "CANCELLED" ? (
              <Pressable disabled={busy === i.id} onPress={() => markPaid(i, true)} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Muted style={{ color: colors.success, fontSize: 12, fontWeight: "700" }}>Mark as paid (quick)</Muted>
              </Pressable>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
