import { useState } from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { Field, ErrorText } from "@/components/ui";
import { AuthScreen, GradientButton } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to manage your rentals.">
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
      <ErrorText>{error}</ErrorText>
      <GradientButton title="Sign in" onPress={onSubmit} loading={loading} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
        <Link href="/(auth)/forgot" style={{ color: colors.primary, fontWeight: "700" }}>
          Forgot password?
        </Link>
        <Link href="/(auth)/register" style={{ color: colors.primary, fontWeight: "700" }}>
          Create account
        </Link>
      </View>
    </AuthScreen>
  );
}
