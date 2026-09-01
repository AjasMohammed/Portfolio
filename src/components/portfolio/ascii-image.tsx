"use client";

import { useEffect, useRef } from "react";
import { ALPHAS, CHAR_ASPECT, FONT, GLYPHS } from "./ascii-sky";

/* An image redrawn in the AsciiSky glyph ramp: one character per cell, the
   cell's ink density (dark + opaque) picks the glyph and its alpha, the cell's
   own colour paints it. Fits the parent box like object-contain, or fills it
   bottom-anchored like `object-cover object-bottom` so it can sit exactly on
   top of a matching <Image>.

   Hovering the enclosing card drifts the glyphs apart — positions scale, glyph
   size doesn't, so the grid loosens instead of zooming. */

const SPREAD = 0.05; // glyph drift at full hover, as a fraction of the box
const TAU = 130; // ms — exponential ease toward the hover target

export function AsciiImage({
    src,
    cell = 4,
    className,
    alt,
    style,
    fit = "contain",
    ink,
}: {
    src: string;
    /** glyph height in css px — smaller is finer and slower */
    cell?: number;
    className?: string;
    /** omit for a decorative copy — the canvas is then hidden from AT */
    alt?: string;
    style?: React.CSSProperties;
    /** "cover" fills the box bottom-anchored, matching object-cover object-bottom */
    fit?: "contain" | "cover";
    /** single glyph colour — needed when the ascii sits over the same image,
        where per-cell colour would be invisible against what it copies */
    ink?: string;
}) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const host = canvas?.parentElement;
        if (!canvas || !host) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new window.Image();
        img.src = src;
        let dead = false;

        // One entry per drawn cell, so the hover pass only moves glyphs around
        // instead of re-sampling the image.
        // ponytail: ~10k fillText per frame at cell=4 on a card-sized box, which
        // holds 60fps on desktop. Raise `cell` if it ever lands somewhere bigger.
        let xs = new Float32Array(0);
        let ys = new Float32Array(0);
        let gs = new Uint8Array(0);
        let fills: string[] = [];
        let boxW = 0;
        let boxH = 0;

        const paint = (t: number) => {
            ctx.clearRect(0, 0, boxW, boxH);
            const k = 1 + SPREAD * t;
            const cx = boxW / 2;
            const cy = boxH / 2;
            for (let i = 0; i < gs.length; i++) {
                const g = gs[i];
                if (ink) {
                    ctx.globalAlpha = ALPHAS[g];
                    ctx.fillStyle = ink;
                } else {
                    ctx.fillStyle = fills[i];
                }
                ctx.fillText(
                    GLYPHS[g],
                    cx + (xs[i] - cx) * k,
                    cy + (ys[i] - cy) * k,
                );
            }
        };

        const layout = () => {
            if (dead || !img.width) return false;
            const box = host.getBoundingClientRect();
            const sx = box.width / img.width;
            const sy = box.height / img.height;
            const scale = fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
            const W = img.width * scale;
            const H = img.height * scale;
            if (W < 1 || H < 1) return false;

            const cellW = cell * CHAR_ASPECT;
            const cols = Math.ceil(W / cellW);
            const rows = Math.ceil(H / cell);

            // Downscale to one pixel per cell — the browser's box filter gives
            // each cell's average colour for free.
            const small = document.createElement("canvas");
            small.width = cols;
            small.height = rows;
            const sctx = small.getContext("2d");
            if (!sctx) return false;
            sctx.drawImage(img, 0, 0, cols, rows);
            const px = sctx.getImageData(0, 0, cols, rows).data;

            boxW = box.width;
            boxH = box.height;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.floor(boxW * dpr));
            canvas.height = Math.max(1, Math.floor(boxH * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalAlpha = 1;
            ctx.font = `${cell}px ${FONT}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const ox = (boxW - cols * cellW) / 2;
            // cover anchors to the bottom edge; the overflow clips at the canvas
            const oy = fit === "cover" ? boxH - rows * cell : (boxH - rows * cell) / 2;
            const cap = cols * rows;
            xs = new Float32Array(cap);
            ys = new Float32Array(cap);
            gs = new Uint8Array(cap);
            fills = ink ? [] : new Array(cap);
            let n = 0;
            for (let r = 0; r < rows; r++) {
                const y = oy + (r + 0.56) * cell;
                for (let c = 0; c < cols; c++) {
                    const i = (r * cols + c) * 4;
                    const a = px[i + 3] / 255;
                    const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
                    const d = a * (1 - lum); // ink density: white paper drops out
                    if (d < 0.06) continue;
                    const g = Math.max(0, Math.min(9, (d * 9.999) | 0));
                    xs[n] = ox + (c + 0.5) * cellW;
                    ys[n] = y;
                    gs[n] = g;
                    if (!ink) {
                        fills[n] = `rgba(${px[i]},${px[i + 1]},${px[i + 2]},${ALPHAS[g]})`;
                    }
                    n++;
                }
            }
            xs = xs.subarray(0, n);
            ys = ys.subarray(0, n);
            gs = gs.subarray(0, n);
            if (!ink) fills.length = n;
            return true;
        };

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let t = 0;
        let target = 0;
        let raf = 0;
        let last = 0;

        const tick = (now: number) => {
            const dt = Math.min(64, now - last);
            last = now;
            t += (target - t) * (1 - Math.exp(-dt / TAU));
            if (Math.abs(target - t) < 0.002) t = target;
            paint(t);
            raf = t === target ? 0 : requestAnimationFrame(tick);
        };

        const to = (v: number) => {
            if (reduce || !gs.length) return;
            target = v;
            if (!raf) {
                last = performance.now();
                raf = requestAnimationFrame(tick);
            }
        };

        // The canvas is pointer-events-none, so hover comes from the card.
        const hoverTarget = host.closest(".group") ?? host;
        const enter = () => to(1);
        const leave = () => to(0);
        hoverTarget.addEventListener("mouseenter", enter);
        hoverTarget.addEventListener("mouseleave", leave);

        const build = () => {
            if (layout()) paint(t);
        };
        if (img.complete) build();
        else img.onload = build;
        const ro = new ResizeObserver(build);
        ro.observe(host);

        return () => {
            dead = true;
            cancelAnimationFrame(raf);
            ro.disconnect();
            hoverTarget.removeEventListener("mouseenter", enter);
            hoverTarget.removeEventListener("mouseleave", leave);
        };
    }, [src, cell, fit, ink]);

    return (
        <canvas
            ref={ref}
            role={alt ? "img" : undefined}
            aria-label={alt}
            aria-hidden={alt ? undefined : true}
            style={style}
            className={`absolute inset-0 block h-full w-full pointer-events-none ${className ?? ""}`}
        />
    );
}
