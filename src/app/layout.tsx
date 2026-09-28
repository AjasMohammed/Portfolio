import type { Metadata } from "next";
import localFont from "next/font/local";
import { CURRENT_ROLE, profile } from "@/data/profile";
import "./globals.css";
import { siteUrl } from "@/lib/site";

// Main face — Grift (Envato Elements licence), the
// three weights the type scale uses. No italic cut: every italic on the page
// is a .t-serif accent, which is Moisette.
const grift = localFont({
  src: [
    { path: "../../assets/fonts/Grift-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/Grift-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../assets/fonts/Grift-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-grift",
  // Grift draws small on its em (x-height 0.47, Inter 0.546), and the type
  // scale was tuned on Inter. 108% puts its advance widths back on Inter's, so
  // no tile gets tighter, and lands its x-height on Moisette's (0.50) so the
  // accents need no correction of their own. Scoped to this face, so the
  // system-mono ASCII grids are untouched.
  declarations: [{ prop: "size-adjust", value: "108%" }],
});

// Accent face — Moisette Italic, for the soft word in display lines and the
// testimonial quotes. Subset to Latin-1 + typographic punctuation (54KB → 24KB);
// anything outside that falls back to Grift.
const moisette = localFont({
  src: "../../assets/fonts/Moisette-Italic.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-moisette",
});

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
      className={`${grift.variable} ${moisette.variable} h-full antialiased`}
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
