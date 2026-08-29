import { fetchSheetCsv, findColumn, isTruthyCell, splitCsv } from "./csv";

export type Testimonial = {
  name: string;
  role: string;
  message: string;
  date: string | null;
};

const REVALIDATE_SECONDS = 60;
export const TESTIMONIALS_CACHE_TAG = "testimonials-csv";

export async function getTestimonials(): Promise<Testimonial[]> {
  const url = process.env.TESTIMONIALS_SHEET_CSV_URL;
  if (!url) return [];
  try {
    const text = await fetchSheetCsv(url, TESTIMONIALS_CACHE_TAG, REVALIDATE_SECONDS);
    if (text === null) return [];
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
      if (!isTruthyCell(r[approvedIdx])) continue;
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
