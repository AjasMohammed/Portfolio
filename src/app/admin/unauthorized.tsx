// Rendered with a 401 when page.tsx calls unauthorized(). The WWW-Authenticate
// header on it (next.config.ts) is what makes the browser show its password
// prompt; this body is only seen when the user cancels that prompt.
export default function Unauthorized() {
  return (
    <main className="flex h-full items-center justify-center bg-ink font-sans text-cream-deep">
      401 · reload to sign in
    </main>
  );
}
