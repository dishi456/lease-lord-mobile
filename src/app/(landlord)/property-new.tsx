import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Field, Button, ErrorText, Muted, Body } from "@/components/ui";
import { api, ApiError, uploadPropertyPhoto, uploadFile, type NewProperty } from "@/lib/api";
import { PROPERTY_TYPES, TYPE_FIELDS, type FieldDef } from "@/lib/property-forms";
import { colors, radius } from "@/lib/theme";

type Photo = { uri: string; fileName?: string | null; mimeType?: string | null };
const FURNISH = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"] as const;
const COUNTRIES = ["India", "United States", "Canada", "United Kingdom", "Australia"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[^\d.]/g, "")));

function Chips<T extends string>({ options, value, onChange }: { options: readonly { k: T; l: string }[] | readonly T[]; value: T; onChange: (v: T) => void }) {
  const norm = options.map((o: any) => (typeof o === "string" ? { k: o, l: label(o) } : o));
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {norm.map((o) => {
        const active = o.k === value;
        return (
          <Pressable key={o.k} onPress={() => onChange(o.k)} style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
            <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 13 }}>{o.l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Renders one dynamic, type-specific field.
function DynamicField({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  if (def.type === "bool") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
        <Body>{def.label}</Body>
        <Switch value={!!value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
      </View>
    );
  }
  if (def.type === "select") {
    return (
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{def.label}</Text>
        <Chips options={def.options ?? []} value={value ?? ""} onChange={onChange} />
      </View>
    );
  }
  return (
    <Field label={def.label} value={value != null ? String(value) : ""} onChangeText={(t) => onChange(def.type === "number" ? t : t)} keyboardType={def.type === "number" ? "number-pad" : "default"} />
  );
}

export default function NewPropertyScreen() {
  const router = useRouter();
  const [type, setType] = useState<NewProperty["type"]>("APARTMENT");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [furnishing, setFurnishing] = useState<(typeof FURNISH)[number]>("UNFURNISHED");
  const [description, setDescription] = useState("");
  const [dyn, setDyn] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [proofs, setProofs] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const fields = useMemo(() => TYPE_FIELDS[type] ?? [], [type]);
  const setField = (k: string, v: any) => setDyn((cur) => ({ ...cur, [k]: v }));

  async function pickPhotos(setter: (fn: (cur: Photo[]) => Photo[]) => void, cur: Photo[], max: number) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: max - cur.length, quality: 0.7 });
    if (res.canceled) return;
    setter((c) => [...c, ...res.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }))].slice(0, max));
  }

  function buildDetails() {
    const details: Record<string, string | number | boolean> = {};
    for (const f of fields) {
      const v = dyn[f.key];
      if (v === undefined || v === "" || v === null) continue;
      details[f.key] = f.type === "number" ? Number(String(v).replace(/[^\d.]/g, "")) : f.type === "bool" ? !!v : v;
    }
    return details;
  }

  async function submit() {
    setError("");
    if (name.trim().length < 2) return setError("Enter a property name.");
    if (address.trim().length < 3) return setError("Enter the address.");
    const rentAmount = num(rent);
    if (!rentAmount || rentAmount <= 0) return setError("Enter a valid rent/price.");

    const details = buildDetails();
    const body: NewProperty = {
      name: name.trim(), type, address: address.trim(),
      country, state: state.trim() || undefined, city: city.trim() || undefined, postalCode: postal.trim() || undefined,
      rentAmount, securityDeposit: num(deposit), furnishing, description: description.trim() || undefined, details,
      // map a few dynamic fields onto real columns so cards/search still work
      rooms: details.bedrooms != null ? Number(details.bedrooms) : details.beds != null ? Number(details.beds) : undefined,
      bathrooms: details.bathrooms != null ? Number(details.bathrooms) : details.washrooms != null ? Number(details.washrooms) : undefined,
      areaSqft: details.carpetArea != null ? Number(details.carpetArea) : details.builtUpArea != null ? Number(details.builtUpArea) : details.plotSize != null ? Number(details.plotSize) : undefined,
    };

    setLoading(true);
    try {
      setStatus("Listing property…");
      const created = await api.landlordCreateProperty(body);
      let up = 0;
      for (let i = 0; i < photos.length; i++) { setStatus(`Uploading photo ${i + 1}/${photos.length}…`); try { await uploadPropertyPhoto(created.id, photos[i]); up++; } catch { /* skip */ } }
      for (let i = 0; i < proofs.length; i++) { setStatus(`Uploading proof ${i + 1}/${proofs.length}…`); try { await uploadFile("property-proof", created.id, proofs[i]); } catch { /* skip */ } }
      Alert.alert("Property listed", `${up ? `${up} photo(s) uploaded. ` : ""}It's awaiting admin approval.`, [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not list the property.");
    } finally { setLoading(false); setStatus(""); }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Property type</Text>
        <Chips options={PROPERTY_TYPES} value={type} onChange={(t) => { setType(t as NewProperty["type"]); setDyn({}); }} />
      </View>

      <Field label="Property name / title" value={name} onChangeText={setName} placeholder="e.g. Sunrise Apartments 2BHK" />

      {/* dynamic, type-specific fields */}
      {fields.length > 0 ? (
        <Card style={{ gap: 12 }}>
          <H2>{label(type)} details</H2>
          {fields.map((f) => <DynamicField key={f.key} def={f} value={dyn[f.key]} onChange={(v) => setField(f.key, v)} />)}
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <H2>Location</H2>
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Street / building" multiline />
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Country</Text>
          <Chips options={COUNTRIES} value={country} onChange={setCountry} />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Province / State" value={state} onChangeText={setState} /></View>
          <View style={{ flex: 1 }}><Field label="City" value={city} onChangeText={setCity} /></View>
        </View>
        <Field label="Postal / ZIP code" value={postal} onChangeText={setPostal} />
      </Card>

      <Card style={{ gap: 12 }}>
        <H2>Pricing & terms</H2>
        <Field label="Rent / price (₹)" value={rent} onChangeText={setRent} keyboardType="number-pad" placeholder="15000" />
        <Field label="Security deposit (₹)" value={deposit} onChangeText={setDeposit} keyboardType="number-pad" placeholder="Optional" />
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Furnishing</Text>
          <Chips options={FURNISH} value={furnishing} onChange={setFurnishing} />
        </View>
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Highlight what makes it great" multiline />
      </Card>

      <PhotoPicker title={`Photos (${photos.length}/10)`} pics={photos} onAdd={() => pickPhotos(setPhotos as any, photos, 10)} onRemove={(i) => setPhotos((c) => c.filter((_, idx) => idx !== i))} />
      <PhotoPicker title={`Ownership proof / documents (${proofs.length}/5)`} pics={proofs} onAdd={() => pickPhotos(setProofs as any, proofs, 5)} onRemove={(i) => setProofs((c) => c.filter((_, idx) => idx !== i))} />

      {status ? <Muted>{status}</Muted> : null}
      <ErrorText>{error}</ErrorText>
      <Button title="List property" onPress={submit} loading={loading} />
    </Screen>
  );
}

function PhotoPicker({ title, pics, onAdd, onRemove }: { title: string; pics: Photo[]; onAdd: () => void; onRemove: (i: number) => void }) {
  const max = 10;
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {pics.map((p, i) => (
          <View key={p.uri} style={{ width: 84, height: 84, borderRadius: radius.md, overflow: "hidden" }}>
            <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            <Pressable onPress={() => onRemove(i)} style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 11, width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {pics.length < max ? (
          <Pressable onPress={onAdd} style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 }}>
            <Ionicons name="camera" size={22} color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>Add</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
