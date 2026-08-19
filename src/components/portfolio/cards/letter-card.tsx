"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ease,
    RADIUS,
    WHATSAPP_IMG,
    LETTER_VIDEO,
    CONTENT_BASE_DELAY,
    SKY_BG,
    LETTER_IMG,
    CONTACT_IMG,
    LETTER_INK,
    LETTER_INK_SOFT,
} from "../constants";
import { SplitText } from "../split-text";
import { SocialIcon } from "../social-icon";
import { Magnetic } from "../magnetic";
import { innerPadding } from "../card";
import { contactIcons } from "./bio-card";

export function LetterCollapsed({ compact = false }: { compact?: boolean } = {}) {
    const reduce = useReducedMotion();
    const vid = useRef<HTMLVideoElement>(null);
    // ponytail: autoplay only survives muted, so unmute on hover instead.
    const sound = (on: boolean) => {
        const v = vid.current;
        if (!v) return;
        v.muted = !on;
        if (on) {
            v.volume = 0.6;
            v.play().catch(() => {});
        }
    };
    return (
        <>
            {/* Desktop / lg+ — 2x2 editorial grid */}
            <div className={`${compact ? "hidden" : "hidden lg:grid"} grid-cols-2 grid-rows-2 w-full h-full gap-2 min-w-0 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]`}>
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
                    !
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
                        overflowWrap: "break-word",
                    }}
                >
                    <SplitText delay={CONTENT_BASE_DELAY + 0.25}>
                        For you, then.
                    </SplitText>
                </h3>
            </div>

            {/* Compact tile — used on mobile and when `compact` is set on lg */}
            <div
                className={`${compact ? "block" : "block lg:hidden"} relative w-full h-full`}
                onMouseEnter={() => sound(true)}
                onMouseLeave={() => sound(false)}
            >
                <video
                    ref={vid}
                    src={LETTER_VIDEO}
                    poster={LETTER_IMG}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    style={{ objectPosition: "50% 65%" }}
                />
            </div>
        </>
    );
}

export function SocialCard({
    extraStyle,
    className,
    entered = true,
    enterDelay = 0,
}: {
    extraStyle?: React.CSSProperties;
    className?: string;
    entered?: boolean;
    enterDelay?: number;
}) {
    const reduce = useReducedMotion();
    const [open, setOpen] = useState(false);
    // Mirrors BentoCard's enterDone: drop the stagger delay once the slide-in
    // has played so hover transitions stay snappy.
    const [enterDone, setEnterDone] = useState(reduce ?? false);
    useEffect(() => {
        if (!entered || enterDone) return;
        const t = setTimeout(() => setEnterDone(true), (enterDelay + 0.9) * 1000);
        return () => clearTimeout(t);
    }, [entered, enterDone, enterDelay]);

    return (
        <motion.div
            className={`group hidden lg:block relative overflow-hidden ${className ?? ""}`}
            style={{
                borderRadius: RADIUS,
                minWidth: 0,
                minHeight: 0,
                ...extraStyle,
            }}
            initial={reduce ? false : { y: "110vh" }}
            animate={entered || reduce ? { y: 0 } : { y: "110vh" }}
            whileHover={reduce ? undefined : { scale: 1.012, y: -4 }}
            transition={{
                duration: enterDone ? 0.32 : 0.8,
                ease,
                delay: enterDone ? 0 : enterDelay,
            }}
            onMouseLeave={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
            <Image
                src={CONTACT_IMG}
                alt=""
                fill
                sizes="20vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />

            <AnimatePresence initial={false} mode="wait">
                {!open ? (
                    <motion.button
                        key="closed"
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-expanded={false}
                        className="absolute inset-0 flex flex-col items-start justify-center gap-1 cursor-pointer text-left"
                        style={{
                            color: "var(--orange-deep)",
                            padding: "clamp(10px,1.4svh,18px) clamp(14px,1.4vw,24px)",
                        }}
                        initial={reduce ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.34, ease }}
                    >
                        <span
                            className="t-display"
                            style={{ fontSize: "clamp(18px,1.6vw,28px)", lineHeight: 1 }}
                        >
                            say hello
                        </span>
                        <span
                            className="t-mono-xs"
                            style={{ letterSpacing: "0.18em", opacity: 0.75 }}
                        >
                            click for contacts →
                        </span>
                    </motion.button>
                ) : (
                    <motion.div
                        key="open"
                        className="absolute inset-0 grid place-items-stretch"
                        style={{
                            gridTemplateColumns: `repeat(${contactIcons.length}, minmax(0, 1fr))`,
                            gap: "clamp(6px, 0.7vw, 12px)",
                            padding: "clamp(8px,1svh,14px) clamp(8px,0.8vw,14px)",
                        }}
                        initial={reduce ? false : { opacity: 0, y: 10, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.985 }}
                        transition={{ duration: 0.38, ease }}
                    >
                        {contactIcons.map((c, i) => (
                            <motion.a
                                key={c.name}
                                href={c.href}
                                target={c.ext ? "_blank" : undefined}
                                rel={c.ext ? "noreferrer" : undefined}
                                aria-label={c.label}
                                title={c.label}
                                autoFocus={i === 0}
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.42, ease, delay: 0.06 + i * 0.055 }}
                                className="group relative flex overflow-hidden transition-transform duration-300 ease-out hover:-translate-y-0.5"
                                style={{
                                    background: "var(--cream)",
                                    color: "var(--orange-deep)",
                                    borderRadius: RADIUS,
                                    minWidth: 0,
                                    padding: "clamp(6px, 0.6svh, 12px) clamp(4px, 0.5vw, 10px)",
                                }}
                            >
                                <Magnetic
                                    className="flex w-full flex-col items-center justify-center min-w-0"
                                    style={{ gap: "clamp(3px, 0.4svh, 6px)" }}
                                >
                                    {/* ponytail: icon only — the strip is 2 columns wide now,
                                        labels only truncated to one letter. title/aria-label carry the name. */}
                                    <SocialIcon name={c.name} size={20} />
                                </Magnetic>
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
                sizes="(max-width: 1279px) 100vw, 80vw"
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
                                    lineHeight: 1,
                                    marginRight: "0.18em",
                                    textTransform: "none",
                                }}
                            >
                                Hey ,
                            </span>
                        </p>
                        <p className="pl-[clamp(16px,4vw,40px)]">
                            On
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
                            className="t-display-med text-left lg:text-right"
                            style={{
                                fontSize: "clamp(15px,1.3vw,22px)",
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
