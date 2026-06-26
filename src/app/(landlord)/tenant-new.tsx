import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Field, Button, ErrorText, Muted } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useUsernameGate } from "@/components/UsernameGate";

// Landlord creates a tenant account directly (status ACTIVE, linked to them).
// Mirrors the website's "Add tenant". Needs the backend POST /landlord/tenants.
export default function NewTenant() {
  const router = useRouter();
  const gate = useUsernameGate("add a tenant");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [governmentId, setGovernmentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (fullName.trim().length < 2) return setError("Enter the tenant's full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await api.landlordAddTenant({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        governmentId: governmentId.trim() || undefined,
      });
      Alert.alert("Tenant added", `${fullName.trim()} can now sign in with the email and password you set.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add the tenant.");
    } finally {
      setLoading(false);
    }
  }

  if (gate) return gate;

  return (
    <Screen>
      <Muted>Create a tenant account. They’ll sign in with the email and temporary password you set here.</Muted>
      <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="tenant@example.com" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional" />
      <Field label="Government ID" value={governmentId} onChangeText={setGovernmentId} placeholder="Optional (Aadhaar / PAN)" />
      <Field label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
      <ErrorText>{error}</ErrorText>
      <Button title="Add tenant" onPress={submit} loading={loading} />
    </Screen>
  );
}
