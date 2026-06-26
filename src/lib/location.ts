import * as Location from "expo-location";

export type Coords = { lat: number; lng: number };

// Request foreground location permission and return coordinates (or null if
// denied / unavailable). Safe to call on screen mount.
export async function getCoords(): Promise<{ coords: Coords | null; denied: boolean }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { coords: null, denied: true };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, denied: false };
  } catch {
    return { coords: null, denied: false };
  }
}
