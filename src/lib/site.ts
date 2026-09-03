const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;

// ponytail: fallback is the real domain, not localhost — the Worker build runs
// with .env stripped, and a malformed NEXT_PUBLIC_SITE_URL secret must not
// take the root layout (and every dynamic page) down with "Invalid URL".
export const siteUrl =
  fromEnv && URL.canParse(fromEnv) ? fromEnv.replace(/\/$/, "") : "https://ajasmohammed.space";
