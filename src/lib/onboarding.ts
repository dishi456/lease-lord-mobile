import * as SecureStore from "expo-secure-store";

// Remembers whether a user has completed the one-time, mandatory feature guide.
// Stored per-user + per-role so each new landlord/tenant sees it once after first
// sign-in. Bump the version (v2) when the guide content changes to re-show it.
const key = (userId: string, role: string) => `guide_v2_${role}_${userId}`;

export async function isGuideDone(userId: string, role: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(key(userId, role))) === "1";
  } catch {
    return false;
  }
}

export async function markGuideDone(userId: string, role: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(userId, role), "1");
  } catch {
    /* non-fatal — they'll just see the guide again next launch */
  }
}
