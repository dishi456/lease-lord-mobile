import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, Empty, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[^\d.]/g, "")));
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function addMonths(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
const TERMS = [6, 11, 12, 24];

function SelectRow({ active, title, subtitle, onPress }: { active: boolean; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
      <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? colors.primary : colors.subtle} />
      <View style={{ flex: 1 }}>
        <Body style={{ fontWeight: "700" }}>{title}</Body>
        {subtitle ? <Muted numberOfLines={1}>{subtitle}</Muted> : null}
      </View>
    </Pressable>
  );
}

export default function NewLease() {
  const router = useRouter();
  const { data, loading, error } = useAsync(() => Promise.all([api.landlordTenants(), api.landlordProperties()]));

  const tenants = data?.[0]?.items ?? [];
  const properties = data?.[1]?.items ?? [];

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [start, setStart] = useState(fmt(new Date()));
  const [term, setTerm] = useState(11);
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [notice, setNotice] = useState("30");
  const [terms, setTerms] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const endDate = useMemo(() => {
    const s = new Date(start);
    if (isNaN(s.getTime())) return null;
    return addMonths(s, term);
  }, [start, term]);

  function pickProperty(p: { id: string; rent: number }) {
    setPropertyId(p.id);
    if (!rent) setRent(String(p.rent ?? ""));
    if (!deposit) setDeposit(String((p.rent ?? 0) * 2));
  }

  async function submit() {
    setErr("");
    if (!tenantId) return setErr("Choose a tenant.");
    if (!propertyId) return setErr("Choose a property.");
    const s = new Date(start);
    if (isNaN(s.getTime())) return setErr("Enter a valid start date (YYYY-MM-DD).");
    const monthlyRent = num(rent);
    if (!monthlyRent || monthlyRent <= 0) return setErr("Enter a valid monthly rent.");
    if (!endDate) return setErr("Invalid term.");

    setBusy(true);
    try {
      await api.landlordCreateLease({
        tenantId, propertyId, monthlyRent,
        securityDeposit: num(deposit) ?? 0,
        startDate: s.toISOString(),
        endDate: endDate.toISOString(),
        noticePeriodDays: num(notice) ?? 30,
        terms: terms.trim() || undefined,
      });
      Alert.alert("Lease created", "The lease is active and the property is now marked occupied.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create the lease.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <Screen><ErrorText>{error}</ErrorText></Screen>;

  return (
    <Screen>
      <H2>New lease</H2>
      <Muted>Create a lease for one of your tenants on one of your properties.</Muted>

      <Card style={{ gap: 10 }}>
        <Body style={{ fontWeight: "700" }}>Tenant</Body>
        {tenants.length === 0 ? (
          <Empty title="No tenants" subtitle="Add a tenant first, then create a lease." />
        ) : (
          tenants.map((t) => (
            <SelectRow key={t.id} active={tenantId === t.id} title={t.fullName} subtitle={t.email} onPress={() => setTenantId(t.id)} />
          ))
        )}
      </Card>

      <Card style={{ gap: 10 }}>
        <Body style={{ fontWeight: "700" }}>Property</Body>
        {properties.length === 0 ? (
          <Empty title="No properties" subtitle="List a property first." />
        ) : (
          properties.map((p) => (
            <SelectRow key={p.id} active={propertyId === p.id} title={p.name} subtitle={`${money(p.rent)}/mo · ${p.availability}`} onPress={() => pickProperty(p)} />
          ))
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <Body style={{ fontWeight: "700" }}>Terms</Body>
        <Field label="Start date (YYYY-MM-DD)" value={start} onChangeText={setStart} placeholder="2026-06-25" autoCapitalize="none" />
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Lease length</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TERMS.map((m) => {
              const active = term === m;
              return (
                <Pressable key={m} onPress={() => setTerm(m)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
                  <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 13 }}>{m} months</Text>
                </Pressable>
              );
            })}
          </View>
          {endDate ? <Muted>Ends {fmt(endDate)}</Muted> : null}
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Monthly rent ($)" value={rent} onChangeText={setRent} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Deposit ($)" value={deposit} onChangeText={setDeposit} keyboardType="number-pad" /></View>
        </View>
        <Field label="Notice period (days)" value={notice} onChangeText={setNotice} keyboardType="number-pad" />
        <Field label="Terms / notes (optional)" value={terms} onChangeText={setTerms} placeholder="e.g. Rent due by the 5th. No subletting." multiline />
      </Card>

      <ErrorText>{err}</ErrorText>
      <Button title="Create lease" onPress={submit} loading={busy} />
    </Screen>
  );
}
