import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Ajas Mohammed — Software Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette mirrored from globals.css (:root) — this file renders at build
// time, outside the CSS pipeline, so the values are inlined.
const INK = "#231510";
const CREAM = "#f4ebd8";
const ORANGE = "#ea5a1a";
const ORANGE_SOFT = "#f08047";

export default async function Image() {
  const [roketto, gunterz, portrait] = await Promise.all([
    readFile(join(process.cwd(), "assets/og/Roketto.ttf")),
    readFile(join(process.cwd(), "assets/og/Gunterz-BlackItalic.ttf")),
    readFile(join(process.cwd(), "public/images/portrait.jpeg")),
  ]);
  const portraitSrc = `data:image/jpeg;base64,${portrait.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          color: CREAM,
          fontFamily: "Roketto",
        }}
      >
        {/* Left: type block */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 8px 56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            Ajas / Mohammed
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                lineHeight: 0.95,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Software
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                lineHeight: 0.95,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                color: ORANGE,
              }}
            >
              Developer.
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontFamily: "Gunterz",
                fontStyle: "italic",
                fontSize: 30,
                color: ORANGE_SOFT,
                textTransform: "uppercase",
              }}
            >
              Quietly built.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.65,
            }}
          >
            python · django · react · kochi, india
          </div>
        </div>

        {/* Right: portrait panel */}
        <div
          style={{
            width: 430,
            display: "flex",
            alignItems: "stretch",
            borderLeft: `6px solid ${ORANGE}`,
          }}
        >
          <img
            src={portraitSrc}
            alt=""
            width={430}
            height={630}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Roketto", data: roketto, weight: 400, style: "normal" },
        { name: "Gunterz", data: gunterz, weight: 900, style: "italic" },
      ],
    },
  );
}
