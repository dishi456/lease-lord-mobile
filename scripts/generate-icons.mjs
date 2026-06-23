// Generates Lease Lord app icons from an inline SVG (house + crown mark).
// Run: node scripts/generate-icons.mjs   (requires `sharp`, installed --no-save)
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "images");

// The white logo mark, authored in a 1024 canvas. `door` colors the doorway.
const logo = (door) => `
  <g fill="#ffffff">
    <!-- crown -->
    <path d="M376 384 L376 320 L444 362 L512 300 L580 362 L648 320 L648 384 Z"/>
    <circle cx="376" cy="312" r="13"/>
    <circle cx="512" cy="291" r="15"/>
    <circle cx="648" cy="312" r="13"/>
    <!-- roof -->
    <path d="M512 408 L724 588 L300 588 Z"/>
    <!-- body -->
    <rect x="352" y="582" width="320" height="208" rx="22"/>
  </g>
  <rect x="468" y="654" width="88" height="136" rx="12" fill="${door}"/>
`;

const DOOR = "#1E3A8A";

// Full icon: blue gradient rounded square + logo.
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3B82F6"/><stop offset="0.55" stop-color="#2563EB"/><stop offset="1" stop-color="#06B6D4"/>
  </linearGradient></defs>
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>
  ${logo(DOOR)}
</svg>`;

// Transparent + scaled (for adaptive foreground / splash / monochrome safe zone).
const padded = (core, scale) => {
  const off = (1024 - 1024 * scale) / 2;
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${off},${off}) scale(${scale})">${core}</g>
  </svg>`;
};

// Full-bleed gradient square for the Android adaptive icon background layer
// (the launcher masks it to the device's icon shape, so no rounded corners).
const bgSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3B82F6"/><stop offset="0.55" stop-color="#2563EB"/><stop offset="1" stop-color="#06B6D4"/>
  </linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;

const monoLogo = `<g fill="#ffffff">
  <path d="M376 384 L376 320 L444 362 L512 300 L580 362 L648 320 L648 384 Z"/>
  <circle cx="376" cy="312" r="13"/><circle cx="512" cy="291" r="15"/><circle cx="648" cy="312" r="13"/>
  <path d="M512 408 L724 588 L300 588 Z"/>
  <rect x="352" y="582" width="320" height="208" rx="22"/>
</g>`;

async function png(svg, name, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT, name));
  console.log("wrote", name, `${size}x${size}`);
}

await png(iconSvg, "icon.png", 1024);
await png(bgSvg, "android-icon-background.png", 1024);
await png(padded(logo(DOOR), 0.64), "android-icon-foreground.png", 1024);
await png(padded(monoLogo, 0.64), "android-icon-monochrome.png", 1024);
await png(padded(logo(DOOR), 0.7), "splash-icon.png", 1024);
await png(iconSvg, "favicon.png", 196);
console.log("done");
