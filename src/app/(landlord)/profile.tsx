import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, Row } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { useAuth } from "@/lib/auth";
import { api, ApiError, uploadAvatar } from "@/lib/api";
import { authedImageUri } from "@/lib/openFile";
import { colors } from "@/lib/theme";

const VERIF: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: "VERIFIED", color: colors.success },
  PENDING: { label: "PENDING", color: "#D97706" },
  NOT_VERIFIED: { label: "NOT VERIFIED", color: colors.subtle },
};

export default function LandlordProfile() {
  const { refresh: refreshAuth } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.landlordProfile());
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (data) { setFullName(data.fullName); setUsername(data.username ?? ""); setPhone(data.phone ?? ""); }
  }, [data]);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Could not load profile."}</ErrorText></Screen>;
  const v = VERIF[data.verificationStatus] ?? VERIF.NOT_VERIFIED;
  const avatar = authedImageUri(data.avatarUrl);

  async function changePhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled) return;
    setPhotoBusy(true);
    try {
      const up = await uploadAvatar({ uri: res.assets[0].uri, fileName: res.assets[0].fileName, mimeType: res.assets[0].mimeType });
      await api.updateLandlordProfile({ avatarUrl: up.url });
      await Promise.all([reload(), refreshAuth()]);
    } catch (e) { Alert.alert("Upload failed", e instanceof ApiError ? e.message : "Try again."); }
    finally { setPhotoBusy(false); }
  }
  async function removePhoto() {
    setPhotoBusy(true);
    try { await api.updateLandlordProfile({ avatarUrl: "" }); await Promise.all([reload(), refreshAuth()]); }
    catch { Alert.alert("Could not remove photo"); } finally { setPhotoBusy(false); }
  }
  async function save() {
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) return Alert.alert("Invalid username", "3-20 letters, numbers or underscores.");
    setSaving(true);
    try {
      await api.updateLandlordProfile({ fullName: fullName.trim(), username: username.trim() || undefined, phone: phone.trim() });
      await Promise.all([reload(), refreshAuth()]);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) { Alert.alert("Could not save", e instanceof ApiError ? e.message : "Try again."); }
    finally { setSaving(false); }
  }

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: 10 }}>
        <Pressable onPress={changePhoto} disabled={photoBusy}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {avatar ? <Image source={{ uri: avatar }} style={{ width: 96, height: 96 }} contentFit="cover" /> : <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 36 }}>{data.fullName.charAt(0).toUpperCase()}</Text>}
            <View style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 14, width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
              <Ionicons name="camera" size={15} color="#fff" />
            </View>
          </View>
        </Pressable>
        <View style={{ alignItems: "center", gap: 2 }}>
          <H2>{data.fullName}</H2>
          {data.username ? <Muted>@{data.username}</Muted> : null}
          <Muted>{data.email}</Muted>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: v.color + "1A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
          <Ionicons name={data.verificationStatus === "VERIFIED" ? "checkmark-circle" : "time"} size={14} color={v.color} />
          <Text style={{ color: v.color, fontWeight: "700", fontSize: 11 }}>{v.label}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button title={avatar ? "Change photo" : "Add photo"} variant="secondary" onPress={changePhoto} loading={photoBusy} />
          {avatar ? <Button title="Remove" variant="secondary" onPress={removePhoto} loading={photoBusy} /> : null}
        </View>
      </Card>

      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Body style={{ fontWeight: "700" }}>Profile completion</Body>
          <Body style={{ fontWeight: "700", color: colors.primary }}>{data.completion}%</Body>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
          <View style={{ width: `${data.completion}%`, height: 8, backgroundColor: colors.primary }} />
        </View>
      </Card>

      <Card>
        <Row label="Properties" value={String(data.stats.properties)} />
        <Row label="Tenants" value={String(data.stats.tenants)} />
        <Row label="Rating" value={data.stats.rating != null ? `★ ${data.stats.rating} (${data.stats.ratingCount})` : "No reviews yet"} />
      </Card>

      <Card style={{ gap: 12 }}>
        <H2>Edit details</H2>
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="unique handle" />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Add a phone number" />
        <Button title="Save changes" onPress={save} loading={saving} />
      </Card>
    </Screen>
  );
}
