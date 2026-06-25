import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Muted, Field, Button, Loading, ErrorText } from "@/components/ui";
import { api, ApiError, uploadMarketplacePhoto } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { CATEGORIES, CONDITIONS } from "@/lib/marketplace";
import { colors, radius } from "@/lib/theme";

type Pic = { uri: string; remote?: string; fileName?: string | null; mimeType?: string | null };
const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[^\d.]/g, "")));

export default function NewListing() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState("GOOD");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [pics, setPics] = useState<Pic[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const l = await api.marketplaceDetail(id!);
        setTitle(l.title); setCategory(l.category); setCondition(l.condition);
        setPrice(String(l.price)); setLocation(l.location ?? ""); setDescription(l.description ?? "");
        setPics(l.images.map((im) => ({ uri: authedImageUri(im)!, remote: im })));
      } catch { setErr("Could not load listing."); }
      finally { setLoadingEdit(false); }
    })();
  }, [editing, id]);

  async function pickImages() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 6 - pics.length, quality: 0.7 });
    if (res.canceled) return;
    setPics((cur) => [...cur, ...res.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }))].slice(0, 6));
  }

  async function submit() {
    setErr("");
    if (title.trim().length < 2) return setErr("Enter a title.");
    const p = num(price);
    if (p === undefined || p < 0) return setErr("Enter a valid price.");
    setBusy(true);
    try {
      // Upload any new (local) images; keep existing remote ones.
      const urls: string[] = [];
      for (let i = 0; i < pics.length; i++) {
        if (pics[i].remote) { urls.push(pics[i].remote!); continue; }
        setStatus(`Uploading photo ${i + 1}…`);
        try { const up = await uploadMarketplacePhoto(pics[i]); urls.push(up.url); } catch { /* skip */ }
      }
      setStatus("Saving…");
      const body = { title: title.trim(), category, condition, price: p, location: location.trim() || undefined, description: description.trim() || undefined, images: urls };
      if (editing) { await api.marketplaceUpdate(id!, body); } else { await api.marketplaceCreate(body); }
      Alert.alert(editing ? "Listing updated" : "Listing posted", "", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not save the listing.");
    } finally { setBusy(false); setStatus(""); }
  }

  if (loadingEdit) return <Loading />;

  return (
    <Screen>
      <H2>{editing ? "Edit listing" : "Sell an item"}</H2>

      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. IKEA 3-seater sofa" />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
        </ScrollView>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Condition</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CONDITIONS.map((c) => <Chip key={c.k} label={c.l} active={condition === c.k} onPress={() => setCondition(c.k)} />)}
        </View>
      </View>

      <Field label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="5000" />
      <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Koregaon Park, Pune" />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Condition, age, pickup details…" multiline />

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Photos ({pics.length}/6)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {pics.map((p, i) => (
            <View key={p.uri} style={{ width: 84, height: 84, borderRadius: radius.md, overflow: "hidden" }}>
              <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              <Pressable onPress={() => setPics((cur) => cur.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 11, width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {pics.length < 6 ? (
            <Pressable onPress={pickImages} style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 }}>
              <Ionicons name="camera" size={22} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>Add</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {status ? <Muted>{status}</Muted> : null}
      <ErrorText>{err}</ErrorText>
      <Button title={editing ? "Save changes" : "Post listing"} onPress={submit} loading={busy} />
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
      <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
