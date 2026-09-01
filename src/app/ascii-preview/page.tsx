// ponytail: temporary preview route — delete once AsciiImage is placed in a card.

import { AsciiImage } from "@/components/portfolio/ascii-image";
import { SKY_GRADIENT } from "@/components/portfolio/constants";

export default function AsciiPreview() {
    return (
        <main className="relative h-svh w-full" style={{ background: SKY_GRADIENT }}>
            <AsciiImage src="/images/foreground-2.webp" cell={4} />
        </main>
    );
}
