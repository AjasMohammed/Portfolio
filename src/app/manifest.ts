import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

// Colours mirror --ink / --cream in globals.css. theme_color is what tints the
// Android address bar, so it tracks the page background, not the accent.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} — Software Developer`,
    short_name: profile.name,
    description:
      "Single-screen portfolio of Ajas Mohammed — software developer writing Python that ages well: backends, APIs, and quiet interfaces.",
    start_url: "/",
    display: "standalone",
    background_color: "#231510",
    theme_color: "#231510",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
