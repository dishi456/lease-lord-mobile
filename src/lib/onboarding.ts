import * as SecureStore from "expo-secure-store";

// Remembers whether a landlord has completed the one-time, mandatory feature
// guide. Stored per-user so each new landlord sees it once after first sign-in.
const key = (userId: string) => `ll_onboarded_v1_${userId}`;

export async function isLandlordOnboarded(userId: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(key(userId))) === "1";
  } catch {
    return false;
  }
}

export async function markLandlordOnboarded(userId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(userId), "1");
  } catch {
    /* non-fatal — they'll just see the guide again next launch */
  }
}
