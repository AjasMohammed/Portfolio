"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* Altocumulus "mackerel sky" in ASCII on one canvas: hundreds of small soft
   cloudlets on a jittered grid, coverage decided by large-scale noise, edges
   feathered by small-scale noise, lit from top-left. Field is periodic in x,
   rendered once per layer to an offscreen canvas, then scrolled. Two layers
   for parallax. Generated at runtime (~50ms) so it fits any aspect: all the
   sizes below are physical px, so the sky scales by fitting more or fewer
   cloudlets, never by shrinking them. */

export const GLYPHS = "..:11000@@"; // per brightness digit 0-9
export const ALPHAS = [0.12, 0.22, 0.34, 0.46, 0.58, 0.7, 0.8, 0.9, 0.96, 1];
export const CHAR_ASPECT = 0.6;
// Must stay a real monospace: CHAR_ASPECT below hard-codes the cell width, so a
// proportional face (Geist Pixel included, despite its name) collides glyphs.
export const FONT = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
const SHADOW = [200, 220, 242]; // cool blue-grey on the unlit side

// [glyph px, cloudlet px, coverage lo/hi, alpha, speed px/s, seed]
// Front layer: bigger, brighter, faster. Back layer: finer, dimmer, slower.
// Every size here is physical px, so a phone gets the same glyph and cloudlet
// size as a desktop and simply fits fewer of them. They used to be fractions
// of the width, which at 360px shrank cloudlets 6x (clouds read as static) and
// floored both layers onto the same 3px glyph, flattening the parallax. The
// numbers below are what those fractions resolved to at 1440w — the width the
// sky was tuned on — so the desktop look is unchanged.
const LAYERS: [number, number, number, number, number, number, number][] = [
    [4.2, 70, 0.55, 0.72, 0.38, 2.8, 3],
    [5.2, 108, 0.46, 0.64, 1, 5.9, 11],
];
/* Large-scale coverage blobs and small-scale edge feathering, also in px. */
const COVER_PX = 350;
const FEATHER_PX = 35;

function hash(ix: number, iy: number, seed: number) {
    let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) & 0xffff) / 65535;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
// value noise, periodic in x with lattice period px
function noise(x: number, y: number, px: number, seed: number) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const x0 = ((ix % px) + px) % px;
    const x1 = (x0 + 1) % px;
    const a = hash(x0, iy, seed);
    const b = hash(x1, iy, seed);
    const c = hash(x0, iy + 1, seed);
    const d = hash(x1, iy + 1, seed);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}
function fbm(x: number, y: number, px: number, seed: number, oct: number) {
    let v = 0;
    let amp = 1;
    let tot = 0;
    for (let o = 0; o < oct; o++) {
        v += amp * noise(x, y, px, seed + o);
        tot += amp;
        amp *= 0.5;
        x *= 2;
        y *= 2;
        px *= 2;
    }
    return v / tot;
}

// One digit per cell (-1 = sky), periodic across cols.
function field(
    cols: number,
    rows: number,
    nx: number,
    lo: number,
    hi: number,
    seed: number,
    W: number,
    H: number,
) {
    const sx = cols / nx; // cloudlet spacing in cells
    const sy = sx * CHAR_ASPECT; // same spacing in rows (cells are tall)
    const ny = Math.ceil(rows / sy);
    // Noise frequencies come off the box's px size, and y off x, so blobs stay
    // round instead of stretching with the aspect ratio. x has to be a whole
    // number of cycles: it doubles as the lattice period that keeps the field
    // seamless when it scrolls.
    const covX = Math.max(2, Math.round(W / COVER_PX));
    const covY = covX * (H / W);
    const featX = Math.max(4, Math.round(W / FEATHER_PX));
    const featY = featX * (H / W);
    const dens = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
        const gy = r / sy;
        const grow = 0.85 + 0.6 * (r / rows); // bigger cloudlets lower in the sky
        for (let c = 0; c < cols; c++) {
            const gx = c / sx;
            const i0 = Math.floor(gx);
            const j0 = Math.floor(gy);
            let d = 0;
            for (let j = j0 - 1; j <= j0 + 1; j++) {
                if (j < -1 || j > ny) continue;
                for (let i = i0 - 1; i <= i0 + 1; i++) {
                    const ii = ((i % nx) + nx) % nx;
                    const cx = i + 0.5 + (hash(ii, j, seed) - 0.5) * 0.9;
                    const cy = j + 0.5 + (hash(ii, j, seed + 7) - 0.5) * 0.9;
                    const rr = (0.38 + 0.34 * hash(ii, j, seed + 13)) * grow;
                    const bri = 0.5 + 0.5 * hash(ii, j, seed + 19); // some cloudlets faint
                    const dx = (gx - cx) / rr;
                    const dy = (gy - cy) / rr;
                    d += bri * Math.exp(-(dx * dx + dy * dy) * 1.9);
                }
            }
            // coverage: soft-thresholded large-scale noise
            const m = fbm((c / cols) * covX, (r / rows) * covY, covX, seed + 50, 3);
            const cov = Math.min(1, Math.max(0, (m - lo) / (hi - lo)));
            // feathering
            const f = 0.72 + 0.5 * fbm((c / cols) * featX, (r / rows) * featY, featX, seed + 90, 3);
            // slightly denser toward the top-right, like the reference sky
            const bias = 0.8 + 0.2 * (c / cols) * (1 - r / rows);
            dens[r * cols + c] = Math.min(1, d * bias * 1.6) * smooth(cov) * f; // x1.6 saturates cores
        }
    }
    return shade(dens, cols, rows);
}

// density -> glyph digit, lit from top-left (-1 = sky)
function shade(dens: Float32Array, cols: number, rows: number) {
    const out = new Int8Array(cols * rows);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const d = dens[r * cols + c];
            if (d < 0.14) {
                out[r * cols + c] = -1;
                continue;
            }
            const ul = dens[Math.max(0, r - 1) * cols + ((c - 1 + cols) % cols)];
            const lr = dens[Math.min(rows - 1, r + 1) * cols + ((c + 1) % cols)];
            const v = d * 1.05 + (ul - lr) * 0.5 + 0.18;
            out[r * cols + c] = Math.max(0, Math.min(9, (v * 9.999) | 0));
        }
    }
    return out;
}

type Layer = { cache: HTMLCanvasElement; w: number; h: number; speed: number };

function buildLayer(W: number, H: number, dpr: number, spec: (typeof LAYERS)[number]): Layer {
    const [font, cloudPx, lo, hi, alpha, speed, seed] = spec;
    const cellW = font * CHAR_ASPECT;
    const cols = Math.ceil(W / cellW);
    const rows = Math.ceil(H / font);
    // Cloudlets across = how many of them fit, so each keeps one physical size.
    const nx = Math.max(3, Math.round(W / cloudPx));
    const grid = field(cols, rows, nx, lo, hi, seed, W, H);
    return drawGrid(grid, cols, rows, cellW, font, dpr, alpha, speed);
}

function drawGrid(
    grid: Int8Array,
    cols: number,
    rows: number,
    cellW: number,
    font: number,
    dpr: number,
    alpha: number,
    speed: number,
): Layer {
    const w = cols * cellW;
    const h = rows * font;
    const cache = document.createElement("canvas");
    cache.width = Math.ceil(w * dpr);
    cache.height = Math.ceil(h * dpr);
    const ctx = cache.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${font}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fills = ALPHAS.map((a, d) => {
        const t = d / 9;
        const cr = SHADOW[0] + (255 - SHADOW[0]) * t;
        const cg = SHADOW[1] + (255 - SHADOW[1]) * t;
        const cb = SHADOW[2] + (255 - SHADOW[2]) * t;
        return `rgba(${cr | 0},${cg | 0},${cb | 0},${a * alpha})`;
    });
    for (let r = 0; r < rows; r++) {
        const y = (r + 0.56) * font;
        for (let c = 0; c < cols; c++) {
            const d = grid[r * cols + c];
            if (d < 0) continue;
            ctx.fillStyle = fills[d];
            ctx.fillText(GLYPHS[d], (c + 0.5) * cellW, y);
        }
    }
    return { cache, w, h, speed };
}

export function AsciiSky() {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const host = canvas?.parentElement;
        if (!canvas || !host) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let W = 0;
        let H = 0;
        let dpr = 1;
        let layers: Layer[] = [];
        let raf = 0;
        let t0 = 0;

        const build = () => {
            const b = host.getBoundingClientRect();
            const w = Math.round(b.width);
            const h = Math.round(b.height);
            const d = window.devicePixelRatio || 1;
            // A zero box (mounted while display:none) would build a 0-cell grid
            // and leave drawImage with a zero-size source.
            if (w < 1 || h < 1) return false;
            if (w === W && h === H && d === dpr) return false;
            W = w;
            H = h;
            dpr = d;
            canvas.width = Math.max(1, Math.floor(W * dpr));
            canvas.height = Math.max(1, Math.floor(H * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            layers = LAYERS.map((spec) => buildLayer(W, H, dpr, spec));
            return true;
        };

        const frame = (t: number) => {
            if (!t0) t0 = t;
            const s = (t - t0) / 1000;
            ctx.clearRect(0, 0, W, H);
            for (const l of layers) {
                // periodic field: draw twice, seam-free
                const off = reduce ? 0 : (s * l.speed) % l.w;
                ctx.drawImage(l.cache, -off, 0, l.w, l.h);
                ctx.drawImage(l.cache, l.w - off, 0, l.w, l.h);
            }
            if (!reduce) raf = requestAnimationFrame(frame);
        };

        build();
        // Regenerating both fields costs ~50ms, and ResizeObserver fires on
        // every frame of a phone's URL-bar show/hide — coalesce to one per
        // frame (build() itself drops the ones where nothing actually moved).
        let pending = 0;
        const ro = new ResizeObserver(() => {
            cancelAnimationFrame(pending);
            pending = requestAnimationFrame(() => {
                if (build() && reduce) frame(0);
            });
        });
        ro.observe(host);
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            cancelAnimationFrame(pending);
            ro.disconnect();
        };
    }, [reduce]);

    return (
        <canvas
            ref={ref}
            aria-hidden
            className="absolute inset-0 block h-full w-full pointer-events-none"
        />
    );
}
