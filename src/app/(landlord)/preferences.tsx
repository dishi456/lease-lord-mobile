import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { CURRENCIES, CURRENCY_CODES } from "@/lib/currency";
import { colors, radius } from "@/lib/theme";

const COUNTRIES = ["India", "United States", "Canada", "United Kingdom", "Australia"];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
      <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export default function LandlordPreferences() {
  const { refresh: refreshAuth } = useAuth();
  const { data, loading, error } = useAsync(() => api.landlordProfile());
  const [currency, setCur] = useState("INR");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) { setCur(data.currency ?? "INR"); setCountry(data.prefCountry ?? ""); setState(data.prefState ?? ""); setCity(data.prefCity ?? ""); }
  }, [data]);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Could not load."}</ErrorText></Screen>;

  async function save() {
    setSaving(true);
    try {
      await api.updateLandlordProfile({ currency, prefCountry: country.trim(), prefState: state.trim(), prefCity: city.trim() });
      await refreshAuth();
      Alert.alert("Saved", "Amounts now show in " + currency + ".");
    } catch (e) { Alert.alert("Could not save", e instanceof ApiError ? e.message : "Try again."); }
    finally { setSaving(false); }
  }

  return (
    <Screen>
      <H2>Preferences</H2>
      <Muted>Set your country, currency and location.</Muted>

      <Card style={{ gap: 12 }}>
        <Body style={{ fontWeight: "700" }}>Currency</Body>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CURRENCY_CODES.map((c) => <Chip key={c} label={`${CURRENCIES[c].symbol} ${c}`} active={currency === c} onPress={() => setCur(c)} />)}
        </View>
        <Muted>Selected: {CURRENCIES[currency]?.label}. Example rent {money(25000)} (applies across rent, deposits & payments).</Muted>
      </Card>

      <Card style={{ gap: 12 }}>
        <Body style={{ fontWeight: "700" }}>Location</Body>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {COUNTRIES.map((c) => <Chip key={c} label={c} active={country === c} onPress={() => setCountry(c)} />)}
        </View>
        <Field label="Province / State" value={state} onChangeText={setState} placeholder="e.g. Maharashtra" />
        <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Pune" />
      </Card>

      <Button title="Save preferences" onPress={save} loading={saving} />
    </Screen>
  );
}
