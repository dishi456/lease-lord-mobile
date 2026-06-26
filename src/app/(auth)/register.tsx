import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Field, ErrorText, Button } from "@/components/ui";
import { AuthScreen, GradientButton } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

type Role = "USER" | "LANDLORD";

export default function Register() {
  const { signInWithToken } = useAuth();
  const [step, setStep] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError("");
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const r = await api.sendOtp(email.trim(), "register");
      // Dev/demo without email configured: auto-fill the code the server returns.
      if (r.devCode) { setCode(r.devCode); setDevHint(`Demo mode — code auto-filled: ${r.devCode}`); }
      setStep("code");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndRegister() {
    setError("");
    setLoading(true);
    try {
      const v = await api.verifyOtp(email.trim(), code.trim(), "register");
      const res = await api.register({ fullName: fullName.trim(), email: email.trim(), password, role, otpToken: v.verifyToken });
      await signInWithToken(res.token);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Create account"
      subtitle={step === "details" ? "Tenants are added by their landlord — choose seeker or landlord below." : `Enter the 6-digit code sent to ${email}.`}
    >
      {step === "details" ? (
        <>
          <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>I am a…</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["USER", "LANDLORD"] as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: role === r ? colors.primary : colors.border,
                  backgroundColor: role === r ? colors.infoBg : colors.card,
                }}
              >
                <Text style={{ fontWeight: "700", color: role === r ? colors.primary : colors.text }}>
                  {r === "USER" ? "Property seeker" : "Landlord"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {r === "USER" ? "Browse & enquire" : "List properties"}
                </Text>
              </Pressable>
            ))}
          </View>

          <ErrorText>{error}</ErrorText>
          <GradientButton title="Send verification code" onPress={sendCode} loading={loading} />
        </>
      ) : (
        <>
          <Field label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="123456" maxLength={6} />
          {devHint ? <Text style={{ color: "#059669", fontSize: 13, fontWeight: "600" }}>{devHint}</Text> : null}
          <ErrorText>{error}</ErrorText>
          <GradientButton title="Verify & create account" onPress={verifyAndRegister} loading={loading} />
          <Button title="Back" variant="secondary" onPress={() => setStep("details")} />
        </>
      )}

      <View style={{ alignItems: "center", marginTop: 4 }}>
        <Link href="/(auth)/login" style={{ color: colors.primary, fontWeight: "700" }}>
          Already have an account? Sign in
        </Link>
      </View>
    </AuthScreen>
  );
}
