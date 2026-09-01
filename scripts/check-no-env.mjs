// Refuses a local deploy while a dotenv file is present.
//
// The Cloudflare adapter inlines .env / .env.local / .env.{mode}[.local] into
// .open-next/cloudflare/next-env.mjs at BUILD time and ships them inside the
// uploaded Worker script — see extract-project-env-vars.js in
// @opennextjs/cloudflare. At runtime those baked values only gap-fill
// (`process.env[key] ??= ...`), so real Worker secrets still win and the site
// works either way. That is exactly what makes it dangerous: forget
// `wrangler secret put` and nothing breaks, you have just published a
// full-write Upstash token and a GitHub PAT into an artifact that only a
// rebuild can rotate.
//
// CI has no .env (they are gitignored), so this is a no-op there — it only
// catches deploying from a developer machine.
import { existsSync } from "node:fs";

const found = [".env", ".env.local", ".env.production", ".env.production.local"].filter(
  (f) => existsSync(f),
);

if (found.length) {
  console.error(
    `\n✗ Refusing to deploy: ${found.join(", ")} present.\n\n` +
      `  Their values would be compiled into the uploaded Worker script.\n` +
      `  Set them as Worker secrets instead:\n` +
      `      npx wrangler secret put KV_REST_API_TOKEN\n\n` +
      `  Then deploy from git (Cloudflare Workers Builds), or move the files\n` +
      `  aside for a one-off local deploy:\n` +
      `      mkdir -p .env-bak && mv ${found.join(" ")} .env-bak/ && pnpm deploy; mv .env-bak/* .\n`,
  );
  process.exit(1);
}
