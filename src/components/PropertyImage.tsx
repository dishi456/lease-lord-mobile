import { useState } from "react";
import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";
import { fileUrl } from "@/lib/config";
import { houseImage } from "@/lib/house-images";

// A property photo that never shows an empty/broken box: it tries the property's
// own photo first, and on a missing OR failed-to-load image swaps to a real
// house photo (deterministic per `seed`, so the same property stays consistent).
export function PropertyImage({
  path,
  seed,
  style,
  height,
}: {
  path?: string | null;
  seed?: string | null;
  style?: StyleProp<ImageStyle>;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const primary = fileUrl(path);
  const uri = !failed && primary ? primary : houseImage(seed);
  return (
    <Image
      source={{ uri }}
      style={[height != null ? { width: "100%", height } : null, style]}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}
