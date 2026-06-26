import { useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Muted, Body, Badge, Row, Button, Loading, ErrorText, Empty, money, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, uploadPaymentProof, type Invoice, type Payment } from "@/lib/api";
import { openProtectedFile } from "@/lib/openFile";
import { PAYMENT_METHODS, methodLabel } from "@/lib/payments";
import { colors, radius } from "@/lib/theme";

export default function Payments() {
  const invoicesQ = useAsync(() => api.invoices());
  const paymentsQ = useAsync(() => api.payments());

  if (invoicesQ.loading && paymentsQ.loading) return <Loading />;
  const invoices = invoicesQ.data?.items ?? [];
  const payments = paymentsQ.data?.items ?? [];
  const refreshing = invoicesQ.refreshing || paymentsQ.refreshing;
  const pendingInvoiceIds = new Set(payments.filter((p) => p.status === "PENDING").map((p) => p.invoiceId));
  const refreshAll = () => { invoicesQ.refresh(); paymentsQ.refresh(); };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}>
      <H2>Invoices</H2>
      <ErrorText>{invoicesQ.error}</ErrorText>
      {invoices.length === 0 ? (
        <Empty title="No invoices" subtitle="Rent invoices will appear here." />
      ) : (
        invoices.map((i) => <InvoiceRow key={i.id} i={i} pending={pendingInvoiceIds.has(i.id)} onDone={refreshAll} />)
      )}

      <View style={{ height: 8 }} />
      <H2>Payment history</H2>
      <ErrorText>{paymentsQ.error}</ErrorText>
      {payments.length === 0 ? <Empty title="No payments yet" /> : payments.map((p) => <PaymentRow key={p.id} p={p} />)}
    </Screen>
  );
}

function InvoiceRow({ i, pending, onDone }: { i: Invoice; pending: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<{ uri: string; fileName?: string | null; mimeType?: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const unpaid = i.status !== "PAID" && i.status !== "CANCELLED";

  async function pickProof() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (res.canceled) return;
    setProof({ uri: res.assets[0].uri, fileName: res.assets[0].fileName, mimeType: res.assets[0].mimeType });
  }
  async function submit() {
    if (!proof) return Alert.alert("Add a screenshot", "Attach a picture of your payment.");
    setBusy(true);
    try {
      const up = await uploadPaymentProof(proof);
      await api.tenantSubmitProof({ invoiceId: i.id, method, reference: reference.trim() || undefined, proofUrl: up.url });
      setOpen(false); setProof(null); setReference("");
      Alert.alert("Proof submitted", "Your landlord will confirm the payment.");
      onDone();
    } catch (e) { Alert.alert("Could not submit", e instanceof ApiError ? e.message : "Try again."); }
    finally { setBusy(false); }
  }

  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Body style={{ fontWeight: "700" }}>{money(i.amount)}</Body>
          <Muted>Due {shortDate(i.dueDate)}</Muted>
        </View>
        <Badge label={i.status} />
      </View>

      {pending ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="hourglass" size={14} color="#D97706" />
          <Muted style={{ color: "#D97706", fontWeight: "600" }}>Proof submitted — awaiting confirmation</Muted>
        </View>
      ) : unpaid ? (
        open ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>How did you pay?</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.k;
                return (
                  <Pressable key={m.k} onPress={() => setMethod(m.k)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
                    <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 12 }}>{m.l}</Text>
                  </Pressable>
                );
              })}
            </View>
            {proof ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Image source={{ uri: proof.uri }} style={{ width: 64, height: 64, borderRadius: radius.md }} contentFit="cover" />
                <Pressable onPress={() => setProof(null)} hitSlop={8}><Ionicons name="close-circle" size={22} color={colors.danger} /></Pressable>
              </View>
            ) : (
              <Pressable onPress={pickProof} style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignSelf: "flex-start" }}>
                <Ionicons name="camera" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Attach payment screenshot</Text>
              </Pressable>
            )}
            <Button title="Submit proof" onPress={submit} loading={busy} />
            <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        ) : (
          <Pressable onPress={() => setOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
            <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
            <Body style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>I've paid — upload proof</Body>
          </Pressable>
        )
      ) : null}
    </Card>
  );
}

function PaymentRow({ p }: { p: Payment }) {
  const pending = p.status === "PENDING";
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: "700" }}>{money(p.amount)}</Body>
          <Muted>{methodLabel(p.method)} · {p.paidAt ? shortDate(p.paidAt) : shortDate(p.createdAt)}</Muted>
        </View>
        <Badge label={pending ? "AWAITING CONFIRMATION" : p.status} />
      </View>
      {p.property || p.periodMonth ? <Muted>{p.property ?? ""}{p.periodMonth ? ` · ${shortDate(p.periodMonth)} rent` : ""}</Muted> : null}
      {p.receiptNumber ? <Row label="Receipt" value={p.receiptNumber} /> : null}
      {p.reference ? <Row label="Reference" value={p.reference} /> : null}
      <View style={{ flexDirection: "row", gap: 16 }}>
        {p.proofUrl ? (
          <Pressable onPress={() => openProtectedFile(p.proofUrl)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="image-outline" size={16} color={colors.primary} />
            <Body style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>View my proof</Body>
          </Pressable>
        ) : null}
        {p.receiptUrl ? (
          <Pressable onPress={() => openProtectedFile(p.receiptUrl)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="download-outline" size={16} color={colors.primary} />
            <Body style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Download receipt</Body>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
