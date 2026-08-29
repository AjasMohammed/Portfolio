export const ease = [0.22, 1, 0.36, 1] as const;
export const RADIUS = "clamp(8px, 0.9vw, 14px)";
/* The one gutter. Page padding, header/bento/footer rows, and the tiles inside
   the bento all ride this value — change it here or the grid drifts apart. */
export const GAP = "clamp(8px, 1.2svh, 14px)";
export const LETTER_VIDEO = "/videos/letter-wind.mp4";
export const LETTER_IMG = "/images/letter-flower.webp";
export const CONTACT_IMG = "/images/contact-arches.webp";
export const LETTER_PORTRAIT_IMG = "/images/letter-portrait-v3.webp";

export const CONTENT_BASE_DELAY = 0.65;

/* Clear blue sky, blues only: deeper overhead (top-right) fading to a pale
   haze low-left. SKY_BG is the flat top colour (page bg while the letter is
   open, sky card variant); the gradient is the letter card itself. */
export const SKY_BG = "#3d7fc4";
export const SKY_GRADIENT =
  "linear-gradient(200deg, #2f6db5 0%, #3d7fc4 22%, #5a9ad8 45%, #7fb6e6 66%, #a6cfee 84%, #c9e2f4 100%)";

export const LETTER_INK = "#0f1f3a";
export const LETTER_INK_SOFT = "rgba(15,31,58,0.78)";

export const langDots: Record<string, string> = {
  Python: "#f4d35e",
  Rust: "#fbe3a0",
  JavaScript: "#f0a35c",
  TypeScript: "#d97e44",
  HTML: "#ea5a1a",
  CSS: "#8d4e2a",
};

/* Cycled when a language isn't in langDots — kept warm to match the palette. */
export const langFallbackPalette: string[] = [
  "#f4ebd8",
  "#f08047",
  "#e6d8b8",
  "#c0440f",
  "#f4d35e",
  "#8d4e2a",
  "#fbf6e9",
  "#ea5a1a",
];
