// Real property photos used as a fallback wherever a listing/lease has no usable
// photo of its own (demo data, or an image that fails to resolve). Keeps the UI
// looking like real estate instead of an empty/placeholder block.
export const HOUSE_IMAGES = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=70",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=70",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=70",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=70",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=70",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=70",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=70",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=70",
];

// Deterministic pick so the same id always shows the same fallback photo.
export function houseImage(seed?: string | null): string {
  if (!seed) return HOUSE_IMAGES[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HOUSE_IMAGES[h % HOUSE_IMAGES.length];
}
