import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Muted, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

// A landlord must set their unique user ID (@username) before they can add a
// property or a tenant. `useUsernameGate()` returns the blocking screen to early
// -return when the username is missing, or null when the action is allowed.
export function useUsernameGate(action: string) {
  const { user } = useAuth();
  const router = useRouter();
  if (!user || user.username) return null;
  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="at" size={28} color={colors.primary} />
        </View>
        <H2>Set your unique user ID first</H2>
        <View style={{ paddingHorizontal: 4 }}>
          <Muted>
            Before you can {action}, create your unique @username on your profile. It’s how tenants
            identify you — you only need to do this once.
          </Muted>
        </View>
        <Button title="Set up my user ID" onPress={() => router.push("/(landlord)/profile")} />
      </Card>
    </Screen>
  );
}
