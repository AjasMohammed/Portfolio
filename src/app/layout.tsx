import type { Metadata } from "next";
import { Fugaz_One, Instrument_Serif, Jost } from "next/font/google";
import localFont from "next/font/local";
import { CURRENT_ROLE, profile } from "@/data/profile";
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

// Headline face — Vercel's Geist Pixel, Square cut. SIL OFL, so the one woff2
// is vendored rather than pulled from the `geist` package, which routes every
// cut through one module and preloads all five (132KB) to use one.
//
// Square is the solidest of the five cuts; Grid/Circle/Triangle/Line are dotted
// and go faint at headline weight. Despite the name and the vendor's monospace
// fallback list it is a PROPORTIONAL display face — '.' is 0.19em, '@' 0.836em
// — so it can't stand in for --font-mono, and its 0.038em pixel unit falls
// below one device pixel under ~24px. Headlines only; see --font-pixel.
const geistPixel = localFont({
  src: "../../public/fonts/GeistPixel-Square.woff2",
  variable: "--font-geist-pixel-square",
  weight: "500",
  adjustFontFallback: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* Person + WebSite structured data, derived from `profile`/`experiences` so it
   can't drift from what the tiles render.

   The `@id` and `sameAs` matter more here than usual: another Ajas Mohammed
   publishes a portfolio too, so the github/linkedin pair is what tells a
   crawler which one this is. Keep sameAs pointing at profiles that are
   unambiguously this person. */
const [city, country] = profile.location.split(",").map((s) => s.trim());

const personLd = {
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: profile.name,
  url: siteUrl,
  jobTitle: CURRENT_ROLE.role,
  description: profile.summary,
  email: `mailto:${profile.email}`,
  telephone: profile.phone,
  address: {
    "@type": "PostalAddress",
    addressLocality: city,
    addressCountry: country,
  },
  worksFor: { "@type": "Organization", name: CURRENT_ROLE.company },
  alumniOf: profile.education.map((e) => ({
    "@type": "EducationalOrganization",
    name: e.institution,
  })),
  knowsAbout: Object.values(profile.skills).flat(),
  // Empty strings would emit `sameAs: [""]`, which is worse than omitting it.
  sameAs: [profile.social.githubUrl, profile.social.linkedinUrl, profile.social.twitterUrl].filter(Boolean),
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    personLd,
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: `${profile.name} — Portfolio`,
      inLanguage: "en",
      author: { "@id": `${siteUrl}/#person` },
      publisher: { "@id": `${siteUrl}/#person` },
    },
  ],
};

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
  verification: {
    google: "7M8wKixViOGe6HT-Lc3kyCq547cslHl1Y7gBZMWM3MY",
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
      className={`${jost.variable} ${instrumentSerif.variable} ${fugaz.variable} ${geistPixel.variable} h-full antialiased`}
    >
      <body className="h-full bg-ink text-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
