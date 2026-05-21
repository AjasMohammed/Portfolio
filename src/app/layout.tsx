import type { Metadata } from "next";
import {
  Archivo,
  Archivo_Black,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const gunterz = localFont({
  variable: "--font-gunterz",
  display: "swap",
  src: [
    { path: "../../public/fonts/Gunterz/Gunterz-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Gunterz/Gunterz-Italic.otf", weight: "400", style: "italic" },
    { path: "../../public/fonts/Gunterz/Gunterz-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Gunterz/Gunterz-MediumItalic.otf", weight: "500", style: "italic" },
    { path: "../../public/fonts/Gunterz/Gunterz-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Gunterz/Gunterz-BoldItalic.otf", weight: "700", style: "italic" },
    { path: "../../public/fonts/Gunterz/Gunterz-Black.otf", weight: "900", style: "normal" },
    { path: "../../public/fonts/Gunterz/Gunterz-BlackItalic.otf", weight: "900", style: "italic" },
  ],
});

const roketto = localFont({
  variable: "--font-roketto",
  display: "swap",
  src: [
    { path: "../../public/fonts/roketto/Roketto.ttf", weight: "400", style: "normal" },
  ],
});

const francy = localFont({
  variable: "--font-francy",
  display: "swap",
  src: [
    { path: "../../public/fonts/francy/Francy.woff2", weight: "400", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Ajas Mohammed — Python Developer",
  description:
    "Single-screen portfolio of Ajas Mohammed — Python developer building backends, APIs, and quiet interfaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${archivoBlack.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${gunterz.variable} ${roketto.variable} ${francy.variable} h-full antialiased`}
    >
      <body className="h-full bg-ink text-cream">{children}</body>
    </html>
  );
}
