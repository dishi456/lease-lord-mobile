import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Screen, Card, H2, Muted, Field, Button, Loading, ErrorText, Row, Badge } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

export default function Profile() {
  const { refresh: refreshAuth } = useAuth();
  const { data, loading, error } = useAsync(() => api.tenantProfile());
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName);
      setPhone(data.phone ?? "");
      setEmergencyContact(data.emergencyContact ?? "");
    }
  }, [data]);

  if (loading) return <Loading />;
  if (error || !data) return <Screen><ErrorText>{error || "Could not load profile."}</ErrorText></Screen>;

  async function save() {
    setSaving(true);
    try {
      await api.updateTenantProfile({ fullName: fullName.trim(), phone: phone.trim(), emergencyContact: emergencyContact.trim() });
      await refreshAuth();
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) {
      Alert.alert("Could not save", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <H2>{data.email}</H2>
        <Row label="Verification" value={<Badge label={data.verified ? "VERIFIED" : "PENDING"} />} />
        <Row label="Account" value={<Badge label={data.status} />} />
      </Card>

      <Field label="Full name" value={fullName} onChangeText={setFullName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Add a phone number" />
      <Field label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Name & phone" />
      <Button title="Save changes" onPress={save} loading={saving} />

      {data.documents.length > 0 ? (
        <>
          <Muted>Documents on file: {data.documents.length}</Muted>
        </>
      ) : null}
    </Screen>
  );
}
