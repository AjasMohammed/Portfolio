export const ease = [0.22, 1, 0.36, 1] as const;
export const RADIUS = "clamp(8px, 0.9vw, 14px)";
export const WHATSAPP_IMG = "/images/rooftop-kochi.webp";

export const CONTENT_BASE_DELAY = 1.3;

export const SKY_BG = "#a8c4dc";

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
