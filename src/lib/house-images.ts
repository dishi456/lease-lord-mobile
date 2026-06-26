import type { ImageSourcePropType } from "react-native";

// Real property photos, BUNDLED INTO THE APP (not remote) so they always show —
// no internet, backend, or firewall required. Used wherever a listing/lease has
// no usable photo of its own (demo data, or an image that fails to resolve).
export const HOUSE_IMAGES: ImageSourcePropType[] = [
  require("../../assets/images/house1.jpg"),
  require("../../assets/images/house2.jpg"),
  require("../../assets/images/house3.jpg"),
  require("../../assets/images/house4.jpg"),
  require("../../assets/images/house5.jpg"),
  require("../../assets/images/house6.jpg"),
];

// Deterministic pick so the same id always shows the same fallback photo.
export function houseImage(seed?: string | null): ImageSourcePropType {
  if (!seed) return HOUSE_IMAGES[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HOUSE_IMAGES[h % HOUSE_IMAGES.length];
}
