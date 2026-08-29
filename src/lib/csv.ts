/** Shared CSV reading for the published-Google-Sheet data sources. */

/**
 * Parses one row of RFC-4180-ish CSV.
 * Handles double-quoted fields and doubled quotes inside them.
 */
function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        buf += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        buf += ch;
      }
    } else if (ch === ",") {
      out.push(buf);
      buf = "";
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      buf += ch;
    }
  }
  out.push(buf);
  return out;
}

export function splitCsv(text: string): string[][] {
  // CSV cells may contain literal newlines inside quoted strings.
  // Scan char-by-char so we only break on unquoted newlines.
  const rows: string[][] = [];
  let line = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      line += ch;
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (line.length > 0) rows.push(parseCsvRow(line));
      line = "";
      continue;
    }
    line += ch;
  }
  if (line.length > 0) rows.push(parseCsvRow(line));
  return rows;
}

export function findColumn(header: string[], candidates: string[]): number {
  // Normalize: lowercase, strip non-letter trailing punctuation like "?" / ":".
  const norm = header.map((h) =>
    h.trim().toLowerCase().replace(/[^a-z0-9 ]+$/g, "").trim(),
  );
  for (const c of candidates) {
    const target = c.toLowerCase();
    const exact = norm.indexOf(target);
    if (exact !== -1) return exact;
  }
  // Fallback: substring match (e.g. header "you are my?" should match "you are my").
  for (const c of candidates) {
    const target = c.toLowerCase();
    const partial = norm.findIndex((h) => h.includes(target));
    if (partial !== -1) return partial;
  }
  return -1;
}

/** Truthy spreadsheet cell — checkbox, "yes", "TRUE", "1", a tick. */
export function isTruthyCell(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "yes" || v === "y" || v === "1" || v === "approved" || v === "✓";
}

/**
 * Fetch a published-to-web sheet as CSV text.
 *
 * Production caches for `revalidateSeconds` under `tag`, so the sheet is hit
 * once a minute rather than once a render. Dev skips the cache entirely:
 * `revalidate` is stale-while-revalidate, so the first reload after an edit
 * serves the *old* rows and only refetches in the background — which reads as
 * "my change didn't apply" when you're actually editing the sheet.
 */
export async function fetchSheetCsv(
  url: string,
  tag: string,
  revalidateSeconds: number,
): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ajas-portfolio" },
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" as const }
      : { next: { revalidate: revalidateSeconds, tags: [tag] } }),
  });
  if (!res.ok) {
    console.error(`[${tag}] csv fetch !ok`, res.status);
    return null;
  }
  return res.text();
}
