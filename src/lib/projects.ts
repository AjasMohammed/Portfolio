import { fetchSheetCsv, findColumn, isTruthyCell, splitCsv } from "./csv.ts";
import { projects as staticProjects, type ProjectItem } from "../data/profile.ts";

const REVALIDATE_SECONDS = 60;
export const PROJECTS_CACHE_TAG = "projects-csv";

/**
 * A screenshot of the live site, rendered on demand by microlink.
 *
 * Used when the sheet's Preview cell is empty, so a new row needs nothing but
 * its url — no capturing, no committing a file. Preview still wins when it's
 * set, for the shots worth choosing by hand.
 *
 * Why a service and not a headless browser here: every one of these sites sits
 * behind Cloudflare, which serves a bot-check page to most screenshot backends
 * (thum.io captures the "Performing security verification" screen, not the
 * site). microlink gets through.
 */
export function shotUrl(siteUrl: string): string {
  const q = new URLSearchParams({
    url: siteUrl,
    screenshot: "true",
    meta: "false",
    embed: "screenshot.url",
  });
  return `https://api.microlink.io/?${q}`;
}

/** List cells hold several values in one box — split on ; | or a newline. */
function splitList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseProjectsCsv(text: string): ProjectItem[] {
  const rows = splitCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0];

  const nameIdx = findColumn(header, ["name", "project", "title"]);
  const contextIdx = findColumn(header, ["context", "kind", "type", "subtitle"]);
  const descIdx = findColumn(header, ["description", "summary", "pitch"]);
  const hlIdx = findColumn(header, ["highlights", "bullets", "details"]);
  const techIdx = findColumn(header, ["technologies", "tech", "stack", "tools"]);
  const previewIdx = findColumn(header, ["preview", "image", "screenshot"]);
  const urlIdx = findColumn(header, ["url", "live", "link", "site"]);
  const repoIdx = findColumn(header, ["repo", "source", "github"]);
  const embedIdx = findColumn(header, ["embeddable", "embed", "iframe"]);
  const publishedIdx = findColumn(header, ["published", "publish", "show", "live?", "approved"]);
  const orderIdx = findColumn(header, ["order", "sort", "position", "rank"]);

  // Name and description carry the card; without them there is nothing to show.
  if (nameIdx === -1 || descIdx === -1) {
    console.warn("[projects] need at least name + description columns. Found:", header);
    return [];
  }

  const cell = (r: string[], i: number) => (i === -1 ? "" : (r[i] ?? "").trim());

  const items: { order: number; item: ProjectItem }[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    // A published column is opt-in: with no such column every row ships.
    if (publishedIdx !== -1 && !isTruthyCell(r[publishedIdx])) continue;
    const name = cell(r, nameIdx);
    const description = cell(r, descIdx);
    if (!name || !description) continue;

    const embedRaw = cell(r, embedIdx);
    const live = cell(r, urlIdx);
    items.push({
      order: Number(cell(r, orderIdx)) || i,
      item: {
        name,
        context: cell(r, contextIdx),
        description,
        highlights: splitList(r[hlIdx]),
        technologies: splitList(r[techIdx]),
        preview: cell(r, previewIdx) || (live ? shotUrl(live) : undefined),
        url: live || undefined,
        repo: cell(r, repoIdx) || undefined,
        // Blank means "no opinion" → the card's default (embed if there's a url).
        embeddable: embedRaw === "" ? undefined : isTruthyCell(embedRaw),
      },
    });
  }
  return items.sort((a, b) => a.order - b.order).map((x) => x.item);
}

/**
 * Projects from a published Google Sheet CSV, falling back to the committed
 * list. The works section is the centrepiece — a sheet that's down or
 * unconfigured must not blank it out the way an empty testimonial list can.
 */
export async function getProjects(): Promise<ProjectItem[]> {
  const url = process.env.PROJECTS_SHEET_CSV_URL;
  if (!url) return staticProjects;
  try {
    const text = await fetchSheetCsv(url, PROJECTS_CACHE_TAG, REVALIDATE_SECONDS);
    if (text === null) return staticProjects;
    const items = parseProjectsCsv(text);
    return items.length > 0 ? items : staticProjects;
  } catch (e) {
    console.error("[projects] fetch threw", e);
    return staticProjects;
  }
}
