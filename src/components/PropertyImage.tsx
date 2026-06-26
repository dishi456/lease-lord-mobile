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
  // Only a genuinely uploaded photo or a real remote URL counts. Seed/demo
  // placeholders are solid-colour stand-ins: "demo/p1.png", or backend docs with
  // hyphenated ids like /api/files/sx-au-doc-01-0 (real uploads use hyphen-free
  // cuid ids). Skip those and show a real house image instead.
  const fileId = path?.match(/\/api\/files\/([^/?#]+)/)?.[1];
  const isSeedDoc = !!fileId && fileId.includes("-");
  const isReal = !!path && !isSeedDoc && (path.startsWith("http") || path.includes("/api/files"));
  const primary = isReal ? fileUrl(path) : undefined;
  // Real photo → load by URL; otherwise (or on load failure) → a bundled house photo.
  const source = !failed && primary ? { uri: primary } : houseImage(seed);
  return (
    <Image
      source={source}
      style={[height != null ? { width: "100%", height } : null, style]}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}
