import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Screen, Card, H2, Muted, Field, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Account() {
  const { user, signOut, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function save() {
    setSaving(true);
    try {
      await api.updateAccount({ fullName: fullName.trim(), phone: phone.trim() });
      await refresh();
      Alert.alert("Saved", "Your account has been updated.");
    } catch (e) {
      Alert.alert("Could not save", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <H2>{user?.fullName}</H2>
        <Muted>{user?.email}</Muted>
      </Card>

      <Field label="Full name" value={fullName} onChangeText={setFullName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Add a phone number" />
      <Button title="Save changes" onPress={save} loading={saving} />

      <Button
        title="Sign out"
        variant="danger"
        onPress={() =>
          Alert.alert("Sign out?", "", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: signOut },
          ])
        }
      />

      <Muted style={{ textAlign: "center", color: colors.subtle }}>Lease Lord · v1.0.0</Muted>
    </Screen>
  );
}
