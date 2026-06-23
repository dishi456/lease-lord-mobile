import { Image } from "expo-image";

// The Lease Lord brand mark — reuses the generated app icon (house + crown on
// the blue→cyan gradient) so the in-app logo always matches the launcher icon.
const ICON = require("../../assets/images/icon.png");

export function Logo({ size = 38, radius = 11 }: { size?: number; radius?: number }) {
  return <Image source={ICON} style={{ width: size, height: size, borderRadius: radius }} contentFit="cover" />;
}
