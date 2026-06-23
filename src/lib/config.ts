import Constants from "expo-constants";

// API base URL resolution order:
//   1. EXPO_PUBLIC_API_URL env var (set in .env or shell) — best for dev
//   2. app.json → expo.extra.apiBaseUrl
//   3. production fallback
//
// For DEVICE testing against a local dev server, set EXPO_PUBLIC_API_URL to your
// machine's LAN IP, e.g. http://192.168.1.15:3000  (localhost won't work from a
// phone — that points at the phone itself).
const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;

export const API_BASE = (fromEnv || fromExtra || "https://prebuildapps.com").replace(/\/$/, "");
export const API_V1 = `${API_BASE}/api/mobile/v1`;

// Turn a relative file path (e.g. "/api/files/abc") into an absolute URL the
// <Image> component can load.
export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}
