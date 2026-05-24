export type Testimonial = {
  name: string;
  role: string;
  message: string;
  date: string | null;
};

const REVALIDATE_SECONDS = 60;
export const TESTIMONIALS_CACHE_TAG = "testimonials-csv";

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

function splitCsv(text: string): string[][] {
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

function findColumn(header: string[], candidates: string[]): number {
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

function isApproved(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "yes" || v === "y" || v === "1" || v === "approved" || v === "✓";
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const url = process.env.TESTIMONIALS_SHEET_CSV_URL;
  if (!url) return [];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ajas-portfolio" },
      next: { revalidate: REVALIDATE_SECONDS, tags: [TESTIMONIALS_CACHE_TAG] },
    });
    if (!res.ok) {
      console.error("[testimonials] csv fetch !ok", res.status);
      return [];
    }
    const text = await res.text();
    const rows = splitCsv(text);
    if (rows.length < 2) return [];
    const header = rows[0];
    const nameIdx = findColumn(header, ["name", "your name", "full name"]);
    const roleIdx = findColumn(header, ["role", "relation", "relationship", "you are my"]);
    const msgIdx = findColumn(header, ["message", "testimonial", "review", "opinion", "your message"]);
    const approvedIdx = findColumn(header, ["approved", "approve", "publish", "show"]);
    const tsIdx = findColumn(header, ["timestamp", "date"]);

    if (nameIdx === -1 || msgIdx === -1 || approvedIdx === -1) {
      console.warn(
        "[testimonials] required columns missing — need at least name, message, approved. Found:",
        header,
      );
      return [];
    }

    const items: Testimonial[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!isApproved(r[approvedIdx])) continue;
      const name = (r[nameIdx] ?? "").trim();
      const message = (r[msgIdx] ?? "").trim();
      if (!name || !message) continue;
      items.push({
        name,
        role: roleIdx === -1 ? "" : (r[roleIdx] ?? "").trim(),
        message,
        date: tsIdx === -1 ? null : (r[tsIdx] ?? "").trim() || null,
      });
    }
    // Newest first if timestamps look parseable
    items.sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return tb - ta;
    });
    return items;
  } catch (e) {
    console.error("[testimonials] fetch threw", e);
    return [];
  }
}
