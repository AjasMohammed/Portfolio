import type { Metadata } from "next";
import {
  Hanken_Grotesk,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Primary reading/UI face — warm, highly legible humanist grotesque.
// Loaded as a variable font so the full weight axis (regular → bold) is
// available for body copy, labels, and emphasis without extra requests.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
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
    { path: "../../public/fonts/gunterz/Gunterz-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/gunterz/Gunterz-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
});

const roketto = localFont({
  variable: "--font-roketto",
  display: "swap",
  src: [
    { path: "../../public/fonts/roketto/Roketto.woff2", weight: "400", style: "normal" },
  ],
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
      className={`${hankenGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${gunterz.variable} ${roketto.variable} h-full antialiased`}
    >
      <body className="h-full bg-ink text-cream">{children}</body>
    </html>
  );
}
