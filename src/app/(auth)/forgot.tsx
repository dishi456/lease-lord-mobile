import { useState } from "react";
import { View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Field, ErrorText } from "@/components/ui";
import { AuthScreen, GradientButton } from "@/components/auth";
import { api, ApiError } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Forgot() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email.");
    setLoading(true);
    try {
      await api.forgot(email.trim());
      setNotice("If that email is registered, a 6-digit reset code has been sent.");
      setStep("reset");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send code.");
    } finally {
      setLoading(false);
    }
  }

  async function doReset() {
    setError("");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await api.reset(email.trim(), code.trim(), newPassword);
      router.replace("/(auth)/login");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Reset password" subtitle={step === "email" ? "We'll email you a 6-digit reset code." : notice}>
      {step === "email" ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <ErrorText>{error}</ErrorText>
          <GradientButton title="Send reset code" onPress={sendCode} loading={loading} />
        </>
      ) : (
        <>
          <Field label="Reset code" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="123456" maxLength={6} />
          <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 8 characters" />
          <ErrorText>{error}</ErrorText>
          <GradientButton title="Set new password" onPress={doReset} loading={loading} />
        </>
      )}

      <View style={{ alignItems: "center", marginTop: 4 }}>
        <Link href="/(auth)/login" style={{ color: colors.primary, fontWeight: "700" }}>
          Back to sign in
        </Link>
      </View>
    </AuthScreen>
  );
}
