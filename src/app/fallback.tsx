/* Shared shell for not-found and error — the same ink/grain/cream frame the
   boot screen uses, so a 404 or a crash still looks like the site instead of
   Next's default black-on-white page.

   No "use client" here on purpose: the component holds no state, so it renders
   as a server component under not-found.tsx and folds into the client tree
   under error.tsx without dragging either one across the boundary. */
export function Fallback({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main
      className="grain flex h-svh w-svw flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "var(--ink)", color: "var(--cream)" }}
    >
      <p className="t-mono-xs" style={{ letterSpacing: "0.22em", opacity: 0.6 }}>
        {code}
      </p>
      <h1
        className="t-display leading-none"
        style={{ fontSize: "clamp(30px,4.5vw,60px)" }}
      >
        {title}
      </h1>
      {children}
    </main>
  );
}

/* Cream pill matching the contact tiles. Rendered as <a> for not-found and
   <button> for error's reset, so it takes the element as a prop. */
export function FallbackAction({
  href,
  onClick,
  label,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
}) {
  const style = {
    background: "var(--cream)",
    color: "var(--orange-deep)",
    borderRadius: "clamp(8px, 0.9vw, 14px)",
    padding: "clamp(8px,1svh,12px) clamp(16px,1.6vw,24px)",
  } as const;
  const cls =
    "t-mono-xs mt-2 inline-flex items-center transition-transform duration-300 ease-out hover:-translate-y-0.5";
  return href ? (
    <a href={href} className={cls} style={style}>
      {label}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {label}
    </button>
  );
}
