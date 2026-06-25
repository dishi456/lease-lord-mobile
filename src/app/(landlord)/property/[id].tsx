import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H1, H2, Muted, Body, Badge, Row, Field, Button, Loading, ErrorText, money } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, uploadPropertyPhoto, type LPropertyDetail } from "@/lib/api";
import { detailLabel } from "@/lib/property-forms";
import { fileUrl } from "@/lib/config";
import { colors, radius } from "@/lib/theme";

const AVAIL_NEXT: Record<string, string> = { AVAILABLE: "OCCUPIED", OCCUPIED: "UNAVAILABLE", UNAVAILABLE: "AVAILABLE" };
const TYPES = ["APARTMENT", "HOUSE", "ROOM", "COMMERCIAL", "OTHER"] as const;
const FURNISH = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"] as const;
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[^\d.]/g, "")));

// Rebuild the full property write body (PATCH needs name/type/address/rent + the rest).
function writeBody(p: LPropertyDetail, overrides: Record<string, unknown>) {
  const g = (k: string) => (p as Record<string, unknown>)[k];
  return {
    name: p.name, type: p.type, address: p.address, description: p.description ?? undefined,
    rentAmount: p.rentAmount, securityDeposit: p.securityDeposit,
    numberOfUnits: g("numberOfUnits") ?? 1, noticePeriodDays: g("noticePeriodDays") ?? 30,
    rooms: p.rooms ?? undefined, bathrooms: p.bathrooms ?? undefined, balconies: g("balconies") ?? undefined,
    floor: g("floor") ?? undefined, totalFloors: g("totalFloors") ?? undefined, areaSqft: p.areaSqft ?? undefined,
    carpetAreaSqft: g("carpetAreaSqft") ?? undefined, parkingSpots: g("parkingSpots") ?? undefined,
    maintenanceMonthly: g("maintenanceMonthly") ?? undefined, furnishing: p.furnishing,
    hasLobby: g("hasLobby") ?? false, hasParking: g("hasParking") ?? false, hasLift: g("hasLift") ?? false,
    powerBackup: g("powerBackup") ?? false, bachelorsAllowed: g("bachelorsAllowed") ?? true,
    listedPublic: p.listedPublic, facing: g("facing") ?? undefined, listedBy: g("listedBy") ?? "OWNER",
    projectName: g("projectName") ?? undefined, amenities: p.amenities ?? [], availability: p.availability,
    ...overrides,
  };
}

function Chips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)}
            style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
            <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 13 }}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refresh } = useAsync(() => api.landlordPropertyDetail(id), [id]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Not found."}</ErrorText></Screen>;
  const p = data;

  async function patch(overrides: Record<string, unknown>) {
    setBusy(true);
    try {
      await api.landlordUpdateProperty(id, writeBody(p, overrides));
      await refresh();
    } catch (e: any) {
      Alert.alert("Could not save", e?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.7 });
    if (res.canceled) return;
    setBusy(true);
    let uploaded = 0;
    for (const a of res.assets) {
      try { await uploadPropertyPhoto(id, { uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }); uploaded++; } catch { /* skip */ }
    }
    setBusy(false);
    await refresh();
    Alert.alert("Photos added", `${uploaded}/${res.assets.length} uploaded.`);
  }

  return (
    <Screen>
      {p.photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.lg }}>
          {p.photos.map((ph) => (
            <Image key={ph} source={{ uri: fileUrl(ph) }} style={{ width: 320, height: 200, borderRadius: radius.lg, marginRight: 8 }} contentFit="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={{ height: 160, backgroundColor: "#E2E8F0", borderRadius: radius.lg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="business" size={44} color={colors.subtle} />
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H1>{money(p.rentAmount)}/mo</H1>
        <Badge label={p.availability} />
      </View>
      <H2>{p.name}</H2>
      <Muted>{p.address}</Muted>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {p.ref ? <Badge label={`REF ${p.ref}`} /> : null}
        <Badge label={p.approved ? "APPROVED" : "PENDING APPROVAL"} />
        <Badge label={p.listedPublic ? "PUBLIC" : "HIDDEN"} />
      </View>

      <Card>
        <Row label="Type" value={label(p.type)} />
        {p.rooms != null ? <Row label="Bedrooms" value={String(p.rooms)} /> : null}
        {p.bathrooms != null ? <Row label="Bathrooms" value={String(p.bathrooms)} /> : null}
        {p.areaSqft != null ? <Row label="Area" value={`${p.areaSqft} sqft`} /> : null}
        <Row label="Furnishing" value={label(String(p.furnishing))} />
        <Row label="Security deposit" value={money(p.securityDeposit)} />
      </Card>

      {(() => {
        const details = (p as any).details as Record<string, unknown> | null | undefined;
        const entries = details ? Object.entries(details).filter(([, v]) => v !== "" && v != null && v !== false) : [];
        return entries.length > 0 ? (
          <Card>
            <H2>{label(p.type)} details</H2>
            {entries.map(([k, v]) => <Row key={k} label={detailLabel(k)} value={typeof v === "boolean" ? "Yes" : String(v)} />)}
          </Card>
        ) : null;
      })()}

      {(p as any).city || (p as any).state || (p as any).country ? (
        <Card>
          <H2>Location</H2>
          {(p as any).city ? <Row label="City" value={String((p as any).city)} /> : null}
          {(p as any).state ? <Row label="State" value={String((p as any).state)} /> : null}
          {(p as any).country ? <Row label="Country" value={String((p as any).country)} /> : null}
          {(p as any).postalCode ? <Row label="Postal code" value={String((p as any).postalCode)} /> : null}
        </Card>
      ) : null}

      {p.description ? <Card><H2>About</H2><Body>{p.description}</Body></Card> : null}

      {editing ? (
        <EditForm p={p} busy={busy} onCancel={() => setEditing(false)} onSave={async (ov) => { await patch(ov); setEditing(false); }} />
      ) : (
        <Card style={{ gap: 12 }}>
          <H2>Manage</H2>
          <Button title="Edit details" onPress={() => setEditing(true)} />
          <Button title={`Add photos (${p.photos.length}/10)`} variant="secondary" onPress={addPhotos} loading={busy} />
          <Button title={`Mark ${(AVAIL_NEXT[p.availability] ?? "AVAILABLE").toLowerCase()}`} variant="secondary" onPress={() => patch({ availability: AVAIL_NEXT[p.availability] ?? "AVAILABLE" })} loading={busy} />
          <Button title={p.listedPublic ? "Hide from public listings" : "Show on public listings"} variant="secondary" onPress={() => patch({ listedPublic: !p.listedPublic })} loading={busy} />
        </Card>
      )}
    </Screen>
  );
}

function EditForm({ p, busy, onSave, onCancel }: { p: LPropertyDetail; busy: boolean; onSave: (ov: Record<string, unknown>) => void; onCancel: () => void }) {
  const [name, setName] = useState(p.name);
  const [type, setType] = useState<(typeof TYPES)[number]>((p.type as any) ?? "APARTMENT");
  const [address, setAddress] = useState(p.address);
  const [rent, setRent] = useState(String(p.rentAmount ?? ""));
  const [deposit, setDeposit] = useState(String(p.securityDeposit ?? ""));
  const [rooms, setRooms] = useState(p.rooms != null ? String(p.rooms) : "");
  const [bathrooms, setBathrooms] = useState(p.bathrooms != null ? String(p.bathrooms) : "");
  const [area, setArea] = useState(p.areaSqft != null ? String(p.areaSqft) : "");
  const [furnishing, setFurnishing] = useState<(typeof FURNISH)[number]>((p.furnishing as any) ?? "UNFURNISHED");
  const [description, setDescription] = useState(p.description ?? "");
  const [err, setErr] = useState("");

  function save() {
    setErr("");
    if (name.trim().length < 2) return setErr("Enter a property name.");
    if (address.trim().length < 3) return setErr("Enter the address.");
    const rentAmount = num(rent);
    if (!rentAmount || rentAmount <= 0) return setErr("Enter a valid monthly rent.");
    onSave({
      name: name.trim(), type, address: address.trim(), rentAmount,
      securityDeposit: num(deposit) ?? 0, rooms: num(rooms), bathrooms: num(bathrooms),
      areaSqft: num(area), furnishing, description: description.trim() || undefined,
    });
  }

  return (
    <Card style={{ gap: 12 }}>
      <H2>Edit details</H2>
      <Field label="Property name" value={name} onChangeText={setName} />
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Type</Text>
        <Chips options={TYPES} value={type} onChange={setType} />
      </View>
      <Field label="Address" value={address} onChangeText={setAddress} multiline />
      <Field label="Monthly rent (₹)" value={rent} onChangeText={setRent} keyboardType="number-pad" />
      <Field label="Security deposit (₹)" value={deposit} onChangeText={setDeposit} keyboardType="number-pad" />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Bedrooms" value={rooms} onChangeText={setRooms} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" /></View>
      </View>
      <Field label="Area (sq.ft)" value={area} onChangeText={setArea} keyboardType="number-pad" />
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Furnishing</Text>
        <Chips options={FURNISH} value={furnishing} onChange={setFurnishing} />
      </View>
      <Field label="Description" value={description} onChangeText={setDescription} multiline />
      <ErrorText>{err}</ErrorText>
      <Button title="Save changes" onPress={save} loading={busy} />
      <Button title="Cancel" variant="secondary" onPress={onCancel} />
    </Card>
  );
}
