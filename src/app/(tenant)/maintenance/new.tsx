import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Field, Button, ErrorText, Muted } from "@/components/ui";
import { api, ApiError, uploadFile } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
type Photo = { uri: string; fileName?: string | null; mimeType?: string | null };

export default function NewMaintenance() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("MEDIUM");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function pickPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 5 - photos.length, quality: 0.7 });
    if (res.canceled) return;
    setPhotos((cur) => [...cur, ...res.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }))].slice(0, 5));
  }

  async function submit() {
    setError("");
    if (title.trim().length < 3) return setError("Enter a short title.");
    if (description.trim().length < 5) return setError("Describe the issue.");
    setLoading(true);
    try {
      const imageUrls: string[] = [];
      for (const p of photos) { try { imageUrls.push((await uploadFile("maintenance-image", "me", p)).url); } catch { /* skip */ } }
      await api.createMaintenance({ title: title.trim(), description: description.trim(), priority, imageUrls });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Leaking kitchen tap" />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe what's wrong…"
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.card, fontSize: 16, color: colors.text }}
      />
      <Muted>Priority</Muted>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={{
              flex: 1,
              padding: 12,
              alignItems: "center",
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: priority === p ? colors.primary : colors.border,
              backgroundColor: priority === p ? colors.infoBg : colors.card,
            }}
          >
            <Text style={{ fontWeight: "700", color: priority === p ? colors.primary : colors.text }}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <Muted>Photos ({photos.length}/5)</Muted>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {photos.map((p, i) => (
          <View key={p.uri} style={{ width: 80, height: 80, borderRadius: radius.md, overflow: "hidden" }}>
            <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            <Pressable onPress={() => setPhotos((cur) => cur.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 11, width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {photos.length < 5 ? (
          <Pressable onPress={pickPhotos} style={{ width: 80, height: 80, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="camera" size={22} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <ErrorText>{error}</ErrorText>
      <Button title="Submit request" onPress={submit} loading={loading} />
    </Screen>
  );
}
