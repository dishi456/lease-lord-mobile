import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Muted, Body, Row, Field, Button, ErrorText, money, shortDate } from "@/components/ui";
import { api, ApiError, uploadPaymentProof } from "@/lib/api";
import { openProtectedFile } from "@/lib/openFile";
import { PAYMENT_METHODS } from "@/lib/payments";
import { colors, radius } from "@/lib/theme";

const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[^\d.]/g, "")));

export default function RecordPayment() {
  const router = useRouter();
  const params = useLocalSearchParams<{ invoiceId: string; amount?: string; balance?: string; tenant?: string; property?: string; periodMonth?: string }>();
  const balance = Number(params.balance ?? params.amount ?? 0);

  const [amount, setAmount] = useState(balance ? String(balance) : "");
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<{ uri: string; fileName?: string | null; mimeType?: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  async function pickProof() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (res.canceled) return;
    setProof({ uri: res.assets[0].uri, fileName: res.assets[0].fileName, mimeType: res.assets[0].mimeType });
  }

  async function submit() {
    setErr("");
    const a = num(amount);
    if (!a || a <= 0) return setErr("Enter a valid amount.");
    if (balance && a > balance) return setErr(`Amount can't exceed the balance of ${money(balance)}.`);
    setBusy(true);
    try {
      let proofUrl: string | undefined;
      if (proof) { setStatus("Uploading proof…"); try { proofUrl = (await uploadPaymentProof(proof)).url; } catch { /* skip */ } }
      setStatus("Recording…");
      const r = await api.landlordRecordPayment({ invoiceId: params.invoiceId, amount: a, method, reference: reference.trim() || undefined, notes: notes.trim() || undefined, proofUrl });
      Alert.alert(
        r.status === "PAID" ? "Payment recorded" : "Partial payment recorded",
        `Receipt ${r.receiptNumber}${r.balance > 0 ? `\nRemaining balance: ${money(r.balance)}` : ""}`,
        [
          { text: "View receipt", onPress: () => openProtectedFile(`/api/receipts/${r.paymentId}`) },
          { text: "Done", onPress: () => router.back() },
        ],
      );
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not record the payment.");
    } finally { setBusy(false); setStatus(""); }
  }

  return (
    <Screen>
      <H2>Record payment</H2>

      <Card>
        {params.property ? <Row label="Property" value={params.property} /> : null}
        {params.tenant ? <Row label="Tenant" value={params.tenant} /> : null}
        {params.periodMonth ? <Row label="Rent month" value={shortDate(params.periodMonth)} /> : null}
        {params.amount ? <Row label="Invoice amount" value={money(Number(params.amount))} /> : null}
        <Row label="Balance due" value={money(balance)} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Field label="Amount received (₹)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
        <Muted>Enter less than the balance to record a partial payment.</Muted>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Payment method</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {PAYMENT_METHODS.map((m) => {
              const active = method === m.k;
              return (
                <Pressable key={m.k} onPress={() => setMethod(m.k)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
                  <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 12 }}>{m.l}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field label="Transaction reference (optional)" value={reference} onChangeText={setReference} placeholder="UPI ref / cheque no. / txn id" autoCapitalize="characters" />
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any note about this payment" multiline />

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Payment proof (optional)</Text>
          {proof ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Image source={{ uri: proof.uri }} style={{ width: 64, height: 64, borderRadius: radius.md }} contentFit="cover" />
              <Pressable onPress={() => setProof(null)} hitSlop={8}><Ionicons name="close-circle" size={22} color={colors.danger} /></Pressable>
            </View>
          ) : (
            <Pressable onPress={pickProof} style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignSelf: "flex-start" }}>
              <Ionicons name="camera" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Attach screenshot</Text>
            </Pressable>
          )}
        </View>
      </Card>

      {status ? <Muted>{status}</Muted> : null}
      <ErrorText>{err}</ErrorText>
      <Button title="Record payment" onPress={submit} loading={busy} />
    </Screen>
  );
}
