import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export type MenuItem = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

// Account sheet that slides up from the avatar tap — shows the signed-in user,
// quick links, and a sign-out action.
export function AccountMenu({ visible, onClose, items }: { visible: boolean; onClose: () => void; items: MenuItem[] }) {
  const { user, signOut } = useAuth();
  const initial = (user?.fullName ?? "U").charAt(0).toUpperCase();

  function run(fn: () => void) {
    onClose();
    setTimeout(fn, 120); // let the modal dismiss before navigating
  }

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => run(signOut) },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheetWrap} onPress={() => {}}>
          <SafeAreaView edges={["bottom"]} style={s.sheet}>
            <View style={s.handle} />

            <View style={s.userRow}>
              <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{user?.fullName ?? "Account"}</Text>
                <Text style={s.email} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>

            <View style={s.list}>
              {items.map((it) => (
                <Pressable key={it.label} style={({ pressed }) => [s.item, pressed && { backgroundColor: "#F1F5F9" }]} onPress={() => run(it.onPress)}>
                  <View style={s.itemIcon}><Ionicons name={it.icon} size={19} color={colors.primary} /></View>
                  <Text style={s.itemLabel}>{it.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
                </Pressable>
              ))}
            </View>

            <Pressable style={({ pressed }) => [s.signOut, pressed && { backgroundColor: "#FEF2F2" }]} onPress={confirmSignOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={s.signOutText}>Sign out</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  sheetWrap: { width: "100%" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", marginBottom: 14 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  email: { fontSize: 13, color: colors.muted, marginTop: 1 },
  list: { paddingVertical: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 6, borderRadius: 12 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 6, marginBottom: 6, borderRadius: 12, borderWidth: 1, borderColor: "#FECACA" },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: "800" },
});
