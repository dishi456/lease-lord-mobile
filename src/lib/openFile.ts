import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getToken } from "./api";
import { fileUrl } from "./config";

// Protected files (lease contracts, IDs) require auth. Opening the raw URL in a
// browser has no session, so attach the auth token as a query param and open in
// the in-app browser, falling back to the system browser.
export async function openProtectedFile(path: string | null | undefined) {
  const base = fileUrl(path);
  if (!base) return;
  const tok = getToken();
  const url = tok ? `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(tok)}` : base;
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => Alert.alert("Could not open", "The document could not be opened."));
  }
}
