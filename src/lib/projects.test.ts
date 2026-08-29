/* Run: node --experimental-strip-types src/lib/projects.test.ts
   Explicit .ts specifiers so node's ESM resolver can load the lib directly —
   no test runner, no build step. */
import assert from "node:assert";
import { parseProjectsCsv, shotUrl } from "./projects.ts";

const csv = [
  `Order,Project,Context,Description,Highlights,Stack,Preview,Live,Repo,Embeddable,Published`,
  `2,Beta,"Shop, freelance",Second one,"a; b",Next.js;React,/images/b.webp,https://b.example,,,yes`,
  `1,Alpha,Concept · demo,"Quoted, with comma","one
two",Python | Django,,https://a.example,https://github.com/x/a,no,TRUE`,
  `3,Draft,ctx,Not published yet,,,,,,,no`,
  `4,,ctx,Missing name,,,,,,,yes`,
].join("\n");

const items = parseProjectsCsv(csv);

assert.deepStrictEqual(items.map((p) => p.name), ["Alpha", "Beta"], "order column sorts, unpublished + nameless rows drop");

const [alpha, beta] = items;
assert.strictEqual(alpha.description, "Quoted, with comma");
assert.deepStrictEqual(alpha.highlights, ["one", "two"], "newline splits a list cell");
assert.deepStrictEqual(alpha.technologies, ["Python", "Django"], "pipe splits a list cell");
assert.strictEqual(alpha.embeddable, false);
assert.strictEqual(alpha.repo, "https://github.com/x/a");
assert.strictEqual(alpha.preview, shotUrl("https://a.example"), "blank Preview + a Live url → derived screenshot");

assert.deepStrictEqual(beta.highlights, ["a", "b"], "semicolon splits a list cell");
assert.strictEqual(beta.context, "Shop, freelance");
assert.strictEqual(beta.embeddable, undefined, "blank embeddable keeps the card default");
assert.strictEqual(beta.repo, undefined);

assert.deepStrictEqual(parseProjectsCsv("Name,Nope\nx,y"), [], "missing description column → empty, caller falls back");

// A blank Preview cell derives a screenshot from the Live url, so a new row
// needs no committed image; an explicit Preview still wins.
assert.strictEqual(beta.preview, "/images/b.webp", "an explicit Preview is left alone");

assert.strictEqual(
  shotUrl("https://example.com/"),
  "https://api.microlink.io/?url=https%3A%2F%2Fexample.com%2F&screenshot=true&meta=false&embed=screenshot.url",
  "screenshot url shape",
);
const [noLive] = parseProjectsCsv("Name,Description\nGamma,Some pitch");
assert.strictEqual(noLive.preview, undefined, "no Preview and no Live url → no image at all");
assert.ok(shotUrl("https://a.test/x?y=1").includes(encodeURIComponent("https://a.test/x?y=1")), "query strings survive encoding");

console.log("ok — projects csv");
