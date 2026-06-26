import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, H2, Muted, Body, Field, Button, Loading, ErrorText, Empty, shortDate } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { api, ApiError, uploadTenantDocument } from "@/lib/api";
import { openProtectedFile } from "@/lib/openFile";
import { colors, radius } from "@/lib/theme";

const DOC_TYPES = ["Passport", "Driver's License", "National ID", "Aadhaar", "PAN Card", "Student ID", "Work Permit", "Visa", "Other Government ID"];

export default function Documents() {
  const { data, loading, error, reload } = useAsync(() => api.tenantDocuments());
  const [adding, setAdding] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [type, setType] = useState(DOC_TYPES[0]);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  const items = data?.items ?? [];

  async function addDoc() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (res.canceled) return;
    setBusy(true);
    try {
      const up = await uploadTenantDocument(type, { uri: res.assets[0].uri, fileName: res.assets[0].fileName, mimeType: res.assets[0].mimeType });
      if (number.trim() || expiry.trim()) {
        await api.updateTenantDocument(up.id, { docNumber: number.trim() || undefined, expiryDate: expiry.trim() || undefined });
      }
      // Replacing: remove the old document now the new one is uploaded.
      if (replacingId) { try { await api.deleteTenantDocument(replacingId); } catch { /* keep going */ } }
      setNumber(""); setExpiry(""); setAdding(false); setReplacingId(null);
      await reload();
      Alert.alert(replacingId ? "Replaced" : "Uploaded", `${type} ${replacingId ? "updated" : "added"}.`);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(id: string, label: string) {
    Alert.alert("Delete document?", `Remove ${label}? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await api.deleteTenantDocument(id); reload(); } catch (e) { Alert.alert("Could not delete", e instanceof ApiError ? e.message : "Try again."); }
      } },
    ]);
  }

  return (
    <Screen>
      <H2>My documents</H2>
      <Muted>Securely upload your identity documents.</Muted>
      <ErrorText>{error}</ErrorText>

      {adding ? (
        <Card style={{ gap: 12 }}>
          <Body style={{ fontWeight: "700" }}>Add a document</Body>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Type</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DOC_TYPES.map((t) => {
                const active = type === t;
                return (
                  <Pressable key={t} onPress={() => setType(t)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.infoBg : colors.card }}>
                    <Text style={{ fontWeight: "700", color: active ? colors.primary : colors.text, fontSize: 12 }}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Field label="Document number (optional)" value={number} onChangeText={setNumber} placeholder="e.g. A1234567" autoCapitalize="characters" />
          <Field label="Expiry date (optional, YYYY-MM-DD)" value={expiry} onChangeText={setExpiry} placeholder="2030-01-01" autoCapitalize="none" />
          <Button title="Pick image & upload" onPress={addDoc} loading={busy} />
          <Button title="Cancel" variant="secondary" onPress={() => { setAdding(false); setReplacingId(null); }} />
        </Card>
      ) : (
        <Button title="＋ Add document" onPress={() => { setReplacingId(null); setAdding(true); }} />
      )}

      {items.length === 0 ? (
        <Empty title="No documents yet" subtitle="Add your passport, ID or other documents." />
      ) : (
        items.map((d) => (
          <Card key={d.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "700" }}>{d.type}</Body>
                {d.numberMasked ? <Muted>{d.numberMasked}</Muted> : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: (d.verified ? colors.success : "#D97706") + "1A", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
                <Ionicons name={d.verified ? "checkmark-circle" : "time"} size={13} color={d.verified ? colors.success : "#D97706"} />
                <Text style={{ color: d.verified ? colors.success : "#D97706", fontWeight: "700", fontSize: 10 }}>{d.verificationStatus}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Muted>Uploaded {shortDate(d.createdAt)}</Muted>
              {d.expiryDate ? <Muted>Expires {shortDate(d.expiryDate)}</Muted> : null}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Button title="Preview" variant="secondary" onPress={() => openProtectedFile(d.url)} /></View>
              <View style={{ flex: 1 }}><Button title="Replace" variant="secondary" onPress={() => { setType(d.type); setReplacingId(d.id); setAdding(true); }} /></View>
              <View style={{ flex: 1 }}><Button title="Delete" variant="danger" onPress={() => confirmDelete(d.id, d.type)} /></View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
