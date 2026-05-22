"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
    ease,
    RADIUS,
    WHATSAPP_IMG,
    CONTENT_BASE_DELAY,
    SKY_BG,
    LETTER_INK,
    LETTER_INK_SOFT,
} from "../constants";
import { SplitText } from "../split-text";
import { SocialIcon } from "../social-icon";
import { innerPadding } from "../card";
import { contactIcons } from "./bio-card";

export function LetterCollapsed() {
    const reduce = useReducedMotion();
    return (
        <>
            {/* Desktop / lg+ — 2x2 editorial grid */}
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 w-full h-full gap-2 min-w-0 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]">
                {/* Top-left: soft serif invite, words stair-stepped left → right within the cell */}
                <div
                    className="t-serif self-start justify-self-stretch flex flex-col w-full min-w-0"
                    style={{
                        color: LETTER_INK_SOFT,
                        fontSize: "clamp(20px, 2.4vw, 38px)",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        wordSpacing: "0.4em",
                        lineHeight: 1.25,
                    }}
                >
                    <motion.div
                        className="text-left whitespace-nowrap"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            ease,
                            delay: CONTENT_BASE_DELAY + 0.15,
                        }}
                    >
                        if
                    </motion.div>
                    <motion.div
                        className="text-left whitespace-nowrap"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            ease,
                            delay: CONTENT_BASE_DELAY + 0.25,
                        }}
                    >
                        you
                    </motion.div>
                    <motion.div
                        className="text-left whitespace-nowrap"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            ease,
                            delay: CONTENT_BASE_DELAY + 0.35,
                        }}
                    >
                        have a
                    </motion.div>
                    <motion.div
                        className="text-left whitespace-nowrap"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            ease,
                            delay: CONTENT_BASE_DELAY + 0.45,
                        }}
                    >
                        moment
                    </motion.div>
                </div>

                {/* Top-right: section label */}
                <p
                    className="t-mono-xs self-start justify-self-end text-right"
                    style={{
                        opacity: 0.7,
                        fontSize: "clamp(10px,0.78vw,13px)",
                        letterSpacing: "0.18em",
                    }}
                >
                    note
                </p>

                {/* Bottom-left: click hint */}
                <motion.p
                    className="t-mono self-end justify-self-start"
                    style={{
                        letterSpacing: "0.08em",
                        fontSize: "clamp(10px,0.78vw,13px)",
                        opacity: 0.85,
                    }}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 0.85, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease,
                        delay: CONTENT_BASE_DELAY + 0.5,
                    }}
                >
                    click to read →
                </motion.p>

                {/* Bottom-right: main headline */}
                <h3
                    className="t-display min-w-0 self-end justify-self-end text-right"
                    style={{
                        fontSize: "clamp(18px, 2vw, 34px)",
                        lineHeight: 1.05,
                        letterSpacing: "-0.01em",
                        overflowWrap: "break-word",
                    }}
                >
                    <SplitText delay={CONTENT_BASE_DELAY + 0.25}>
                        For you, then.
                    </SplitText>
                </h3>
            </div>

            {/* Mobile — compact tile fitting a 3×2 sub-grid cell */}
            <div className="flex lg:hidden flex-col items-center justify-center w-full h-full gap-0.5 px-1.5 py-1.5">
                <motion.p
                    className="t-serif text-center"
                    style={{
                        color: LETTER_INK_SOFT,
                        fontSize: "clamp(8px, 1.6vw, 14px)",
                        letterSpacing: "0.02em",
                        lineHeight: 1.1,
                    }}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.6,
                        ease,
                        delay: CONTENT_BASE_DELAY + 0.1,
                    }}
                >
                    I left a note
                </motion.p>
                <h3
                    className="t-display text-center"
                    style={{
                        fontSize: "clamp(16px, 3.4vw, 30px)",
                        lineHeight: 0.9,
                        letterSpacing: "-0.02em",
                    }}
                >
                    <SplitText delay={CONTENT_BASE_DELAY + 0.3}>
                        for you.
                    </SplitText>
                </h3>
            </div>
        </>
    );
}

export function SocialCard({
    extraStyle,
    className,
}: {
    extraStyle?: React.CSSProperties;
    className?: string;
}) {
    const reduce = useReducedMotion();
    return (
        <div
            className={`hidden lg:flex flex-col ${className ?? ""}`}
            style={{
                gap: "clamp(4px, 0.5svh, 8px)",
                minWidth: 0,
                minHeight: 0,
                ...extraStyle,
            }}
        >
            <p
                className="t-mono-xs shrink-0 text-center"
                style={{
                    opacity: 0.85,
                    fontSize: "clamp(12px,1vw,16px)",
                    letterSpacing: "0.18em",
                    fontWeight: 600,
                }}
            >
                reach me
            </p>
            <div
                className="grid flex-1 place-items-center min-h-0"
                style={{
                    gridTemplateColumns: `repeat(${contactIcons.length}, minmax(0, 1fr))`,
                    gap: "clamp(6px, 0.7vw, 12px)",
                    minWidth: 0,
                }}
            >
                {contactIcons.map((c, i) => (
                <motion.a
                    key={c.name}
                    href={c.href}
                    target={c.ext ? "_blank" : undefined}
                    rel={c.ext ? "noreferrer" : undefined}
                    aria-label={c.label}
                    title={c.label}
                    initial={reduce ? false : { opacity: 0, scale: 0.3, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease,
                        delay: CONTENT_BASE_DELAY + 0.45 + i * 0.08,
                    }}
                    className="group relative flex flex-col items-center justify-center aspect-square overflow-hidden transition-transform duration-300 ease-out hover:-translate-y-0.5"
                    style={{
                        width: "100%",
                        maxHeight: "100%",
                        background: "var(--cream)",
                        color: "var(--orange-deep)",
                        borderRadius: RADIUS,
                        minWidth: 0,
                        padding: "clamp(6px, 0.6svh, 12px) clamp(4px, 0.5vw, 10px)",
                        gap: "clamp(3px, 0.4svh, 6px)",
                    }}
                >
                    <SocialIcon name={c.name} size={20} />
                    <span
                        className="t-mono-xs truncate w-full text-center"
                        style={{
                            fontSize: "clamp(9px, 0.7vw, 12px)",
                            letterSpacing: "0.12em",
                            opacity: 0.75,
                        }}
                    >
                        {c.label}
                    </span>
                </motion.a>
                ))}
            </div>
        </div>
    );
}

export function SocialMobileCells() {
    const reduce = useReducedMotion();
    return (
        <>
            {contactIcons.map((c, i) => (
                <motion.a
                    key={c.name}
                    href={c.href}
                    target={c.ext ? "_blank" : undefined}
                    rel={c.ext ? "noreferrer" : undefined}
                    aria-label={c.label}
                    title={c.label}
                    initial={reduce ? false : { opacity: 0, scale: 0.3, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease,
                        delay: CONTENT_BASE_DELAY + 0.45 + i * 0.08,
                    }}
                    className="relative flex flex-col items-center justify-center transition-transform active:scale-95"
                    style={{
                        background: "var(--cream)",
                        color: "var(--orange-deep)",
                        borderRadius: RADIUS,
                        minWidth: 0,
                        minHeight: 0,
                        padding: "clamp(6px, 1.6vw, 10px) clamp(4px, 1vw, 8px)",
                        gap: "clamp(2px, 0.8vw, 5px)",
                        overflow: "hidden",
                    }}
                >
                    <SocialIcon name={c.name} size={18} />
                    <span
                        className="t-mono-xs truncate w-full text-center"
                        style={{
                            fontSize: "clamp(8px, 1.4vw, 13px)",
                            letterSpacing: "0.06em",
                            opacity: 0.75,
                        }}
                    >
                        {c.label}
                    </span>
                </motion.a>
            ))}
        </>
    );
}

export function LetterExpanded() {
    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{ background: SKY_BG, color: LETTER_INK }}
        >
            <Image
                src={WHATSAPP_IMG}
                alt="Ajas on a rooftop in Kochi, looking up at clouds"
                fill
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-cover"
            />
            <div
                className="relative z-10 h-full grid min-h-0 overflow-auto lg:overflow-hidden grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:grid-cols-[minmax(0,1fr)_minmax(0,clamp(320px,46%,560px))]"
                style={{
                    ...innerPadding,
                    gap: "clamp(4px,1.6vw,28px)",
                }}
            >
                <div
                    className="self-start min-w-0 col-start-1 row-start-1"
                    style={{ color: LETTER_INK }}
                >
                    <h2
                        className="t-display"
                        style={{
                            fontSize: "clamp(42px,3.4vw,56px)",
                            lineHeight: 0.95,
                            letterSpacing: "-0.01em",
                            color: LETTER_INK,
                        }}
                    >
                        <SplitText delay={0.1}>
                            From my desk to yours.
                        </SplitText>
                    </h2>
                </div>

                <div
                    className="self-start justify-self-end max-w-[52ch] flex flex-col gap-[clamp(10px,1.2svh,16px)] min-w-0 text-left items-start col-start-1 row-start-2 lg:col-start-2 lg:row-start-1 lg:justify-self-stretch lg:max-w-none lg:mt-[clamp(72px,11svh,160px)]"
                    style={{ color: LETTER_INK }}
                >
                    <div
                        className="flex flex-col gap-[clamp(6px,0.9svh,12px)] t-body"
                        style={{
                            fontSize: "clamp(13px,1vw,17px)",
                            lineHeight: 1.6,
                            letterSpacing: "0.08em",
                            color: LETTER_INK,
                            maxWidth: "52ch",
                        }}
                    >
                        <p className="mb-2">
                            <span
                                className="t-display"
                                style={{
                                    fontSize: "clamp(22px,2.3vw,36px)",
                                    fontWeight: 400,
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1,
                                    marginRight: "0.18em",
                                    textTransform: "none",
                                }}
                            >
                                Hey ,
                            </span>
                        </p>
                        <p className="pl-[clamp(16px,4vw,40px)]">
                            <span
                                className="t-display"
                                style={{
                                    fontSize: "clamp(18px,1.9vw,28px)",
                                    fontWeight: 400,
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1,
                                    marginRight: "0.18em",
                                    textTransform: "none",
                                }}
                            >
                                On
                            </span>{" "}
                            the kind of afternoon where the clouds take their
                            time. I figured a note might feel friendlier than a
                            list of bullet points — so here&apos;s something a
                            little more honest about the person behind the work.
                        </p>
                        <p className="pl-[clamp(16px,4vw,40px)]">
                            I like work that ages well. Careful decisions, small
                            changes, the kind of writing — whether in code or in
                            conversation — that doesn&apos;t need a tour.
                            Nothing flashy. Just patient, considered work, and a
                            real respect for the people I do it with.
                        </p>
                        <p className="pl-[clamp(16px,4vw,40px)]">
                            I&apos;m also still learning, and I expect I always
                            will be. I&apos;ll get things wrong from time to
                            time — small things, sometimes less small — and when
                            I do, I&apos;d much rather hear about it than not.
                        </p>
                        <p className="pl-[clamp(16px,4vw,40px)]">
                            So if you&apos;ve got feedback, a correction, an
                            idea, or just something to say, please reach out.
                        </p>
                    </div>

                    <div
                        className="flex items-baseline justify-start lg:justify-end gap-3 pt-[clamp(8px,1svh,12px)] w-full pl-[clamp(16px,4vw,40px)]"
                        style={{ borderTop: `1px solid ${LETTER_INK_SOFT}` }}
                    >
                        <p
                            className="t-display text-left lg:text-right"
                            style={{
                                fontSize: "clamp(15px,1.3vw,22px)",
                                letterSpacing: "-0.005em",
                                color: LETTER_INK,
                            }}
                        >
                            — ajas mohammed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
