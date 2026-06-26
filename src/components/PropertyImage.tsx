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
  // Only a genuinely uploaded photo (/api/files/...) or a real remote URL counts.
  // Seed/demo placeholders like "demo/p1.png" are solid-colour stand-ins that load
  // fine but aren't real photos — skip them and show a real house image instead.
  const isReal = !!path && (path.startsWith("http") || path.includes("/api/files"));
  const primary = isReal ? fileUrl(path) : undefined;
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
