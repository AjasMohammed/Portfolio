import type { Metadata } from "next";
import {
  Archivo,
  Fugaz_One,
  Instrument_Serif,
  Jost,
} from "next/font/google";
import "./globals.css";

// Small-text face — Jost, a geometric sans cut from the same Futura skeleton.
// (Futura PT itself is Adobe-licensed and can't be self-hosted; swap the src
// here if a licensed woff2 ever lands in public/fonts.) Variable weight axis,
// so labels, body copy, and emphasis all come from one request.
const jost = Jost({
  variable: "--font-futura",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Title + running-copy face — Fugaz One. Single weight by design, so display
// hierarchy comes from size and tracking; never request 700 or the browser
// fakes it.
const fugaz = Fugaz_One({
  variable: "--font-fugaz",
  weight: "400",
  subsets: ["latin"],
});

// Archivo variable (width axis) — numeral face for stats. Still Black/125%
// for the big stat numbers, where a weight axis actually matters.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["wdth"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// "Software Developer" everywhere — matches the on-page header, bio heading,
// and current job title. "Python developer" stays in keywords/description for
// search since that's the trade.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Ajas Mohammed — Software Developer",
  description:
    "Single-screen portfolio of Ajas Mohammed — software developer writing Python that ages well: backends, APIs, and quiet interfaces.",
  applicationName: "Ajas Mohammed — Portfolio",
  authors: [{ name: "Ajas Mohammed" }],
  keywords: [
    "Ajas Mohammed",
    "software developer",
    "Python developer",
    "backend developer",
    "Django",
    "FastAPI",
    "portfolio",
    "Kochi",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Ajas Mohammed",
    title: "Ajas Mohammed — Software Developer",
    description:
      "Single-screen portfolio of Ajas Mohammed — software developer writing Python that ages well: backends, APIs, and quiet interfaces.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ajas Mohammed — Software Developer",
    description:
      "Single-screen portfolio of Ajas Mohammed — software developer writing Python that ages well: backends, APIs, and quiet interfaces.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${instrumentSerif.variable} ${archivo.variable} ${fugaz.variable} h-full antialiased`}
    >
      <body className="h-full bg-ink text-cream">{children}</body>
    </html>
  );
}
