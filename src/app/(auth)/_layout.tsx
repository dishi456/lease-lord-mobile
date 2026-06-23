import { Stack } from "expo-router";

// All auth screens use the branded AuthScreen shell (own header + back button),
// so the native stack header is hidden.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
