import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Field, Button, ErrorText, Muted } from "@/components/ui";
import { api, ApiError, uploadPropertyPhoto, type NewProperty } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

type Photo = { uri: string; fileName?: string | null; mimeType?: string | null };

const TYPES: NewProperty["type"][] = ["APARTMENT", "HOUSE", "ROOM", "COMMERCIAL", "OTHER"];
const FURNISH: NonNullable<NewProperty["furnishing"]>[] = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[^\d.]/g, "")));

function Chips<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5,
              borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card,
            }}
          >
            <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 13 }}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function NewPropertyScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<NewProperty["type"]>("APARTMENT");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rooms, setRooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [furnishing, setFurnishing] = useState<NonNullable<NewProperty["furnishing"]>>("UNFURNISHED");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function pickPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10 - photos.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    const picked = res.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }));
    setPhotos((cur) => [...cur, ...picked].slice(0, 10));
  }

  async function submit() {
    setError("");
    if (name.trim().length < 2) return setError("Enter a property name.");
    if (address.trim().length < 3) return setError("Enter the address.");
    const rentAmount = num(rent);
    if (!rentAmount || rentAmount <= 0) return setError("Enter a valid monthly rent.");

    const body: NewProperty = {
      name: name.trim(), type, address: address.trim(), rentAmount,
      securityDeposit: num(deposit), rooms: num(rooms), bathrooms: num(bathrooms),
      areaSqft: num(area), furnishing, description: description.trim() || undefined,
    };
    setLoading(true);
    try {
      setStatus("Listing property…");
      const created = await api.landlordCreateProperty(body);
      // Upload any selected photos to the property (best-effort, one at a time).
      let uploaded = 0;
      for (let i = 0; i < photos.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${photos.length}…`);
        try {
          await uploadPropertyPhoto(created.id, photos[i]);
          uploaded++;
        } catch {
          /* skip a failed photo, keep going */
        }
      }
      const note = photos.length
        ? `${uploaded}/${photos.length} photo${photos.length > 1 ? "s" : ""} uploaded. `
        : "";
      Alert.alert("Property listed", `${note}It's awaiting admin approval before it appears publicly.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not list the property.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <Screen>
      <Field label="Property name" value={name} onChangeText={setName} placeholder="e.g. Sunrise Apartments 2BHK" />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Type</Text>
        <Chips options={TYPES} value={type} onChange={setType} />
      </View>

      <Field label="Address" value={address} onChangeText={setAddress} placeholder="Full address" multiline />
      <Field label="Monthly rent (₹)" value={rent} onChangeText={setRent} keyboardType="number-pad" placeholder="15000" />
      <Field label="Security deposit (₹)" value={deposit} onChangeText={setDeposit} keyboardType="number-pad" placeholder="Optional" />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Bedrooms" value={rooms} onChangeText={setRooms} keyboardType="number-pad" placeholder="2" /></View>
        <View style={{ flex: 1 }}><Field label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" placeholder="1" /></View>
      </View>

      <Field label="Area (sq.ft)" value={area} onChangeText={setArea} keyboardType="number-pad" placeholder="Optional" />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Furnishing</Text>
        <Chips options={FURNISH} value={furnishing} onChange={setFurnishing} />
      </View>

      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional — highlight what makes it great" multiline />

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Photos ({photos.length}/10)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {photos.map((p, i) => (
            <View key={p.uri} style={{ width: 84, height: 84, borderRadius: radius.md, overflow: "hidden" }}>
              <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              <Pressable
                onPress={() => setPhotos((cur) => cur.filter((_, idx) => idx !== i))}
                style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 11, width: 22, height: 22, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < 10 ? (
            <Pressable
              onPress={pickPhotos}
              style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 }}
            >
              <Ionicons name="camera" size={22} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>Add</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {status ? <Muted>{status}</Muted> : null}
      <ErrorText>{error}</ErrorText>
      <Button title="List property" onPress={submit} loading={loading} />
    </Screen>
  );
}
