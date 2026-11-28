import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, body, display } from "../theme";

// ---------------------------------------------------------------- motion --

/** 0 → 1 on a soft spring, starting at `at` frames. */
export function useRise(at = 0, damping = 18) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, mass: 0.9 } });
}

export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Fades a whole scene in and out over its first and last frames. */
export const SceneFade: React.FC<{
  frames: number;
  children: React.ReactNode;
}> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 12, frames - 12, frames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ------------------------------------------------------------ background --

/** The site's sky: a paper-blue gradient, slow clouds, one sheet of grain. */
export const Sky: React.FC<{ dusk?: number }> = ({ dusk = 0 }) => {
  const f = useCurrentFrame();
  const top = dusk
    ? `color-mix(in srgb, ${C.skyTop}, #1b2438 ${dusk * 100}%)`
    : C.skyTop;
  const bot = dusk
    ? `color-mix(in srgb, ${C.skyBot}, #3a3550 ${dusk * 100}%)`
    : C.skyBot;
  const clouds = [
    { x: 12, y: 18, w: 900, h: 260, s: 0.12, o: 0.55 },
    { x: 70, y: 10, w: 1100, h: 300, s: -0.08, o: 0.45 },
    { x: 40, y: 82, w: 1300, h: 340, s: 0.06, o: 0.6 },
    { x: 88, y: 70, w: 800, h: 240, s: -0.1, o: 0.4 },
  ];
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${top} 0%, ${bot} 65%, ${top} 100%)`,
      }}
    >
      {clouds.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(${c.x}% + ${f * c.s}px)`,
            top: `${c.y}%`,
            width: c.w,
            height: c.h,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(247,250,253,${c.o}), rgba(247,250,253,0))`,
            filter: "blur(18px)",
          }}
        />
      ))}
      <Grain />
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.35,
      mixBlendMode: "multiply",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.16'/%3E%3C/svg%3E\")",
    }}
  />
);

// ----------------------------------------------------------------- phone --

export type Media =
  | { kind: "image"; src: string; position?: string }
  | {
      kind: "video";
      src: string;
      /**
       * The part of the source to show, in seconds. It is stretched or
       * squeezed to fill its slot, so a clip fits whatever length the
       * narration gives its scene.
       */
      span: [number, number];
      position?: string;
    };

/** One stretch of a phone's screen: `media` from scene frame `at` onward. */
export type Segment = { at: number; media: Media };

const Screen: React.FC<{ media: Media; frames: number; style: React.CSSProperties }> = ({
  media,
  frames,
  style,
}) => {
  const { fps } = useVideoConfig();
  if (media.kind === "image") return <Img src={staticFile(media.src)} style={style} />;
  // A span is fitted to its slot — but never faster than 2.5×. When the
  // slot is too short for that, show the end of the span, where the result
  // is, rather than a blur of how it got there.
  const MAX_RATE = 2.5;
  const [a0, b] = media.span;
  const a = Math.max(a0, b - (MAX_RATE * frames) / fps);
  const rate = Math.max(0.25, ((b - a) * fps) / Math.max(1, frames));
  return (
    <OffthreadVideo
      src={staticFile(media.src)}
      muted
      startFrom={Math.round(a * fps)}
      playbackRate={rate}
      style={style}
    />
  );
};

/**
 * An iPhone 17 Pro Max, drawn: screen 440×956pt, a thin dark bezel and the
 * Dynamic Island. The screen shows one `media`, or a list of segments that
 * cut from one to the next — the captures are cropped under the status bar,
 * so the island sits over a clean edge.
 */
export const Phone: React.FC<{
  media: Media | Segment[];
  /** Frames the phone is on screen for; the last segment runs to here. */
  frames?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({ media, frames = 900, width = 420, style }) => {
  const segments: Segment[] = Array.isArray(media) ? media : [{ at: 0, media }];
  const height = width * (956 / 440);
  const bezel = width * 0.035;
  const radius = width * 0.14;
  const barH = height * 0.066;
  const dark = segments[0].media.kind === "video";
  return (
    <div
      style={{
        width: width + bezel * 2,
        height: height + bezel * 2,
        padding: bezel,
        borderRadius: radius + bezel,
        background: "linear-gradient(145deg, #3b4252, #11151d 40%, #2a303b)",
        boxShadow:
          "0 60px 120px -40px rgba(23,38,62,0.55), 0 0 0 1.5px rgba(255,255,255,0.18) inset",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
          borderRadius: radius,
          overflow: "hidden",
          background: dark ? "#0d1017" : "#eef2f7",
        }}
      >
        {segments.map((seg, i) => {
          const until = segments[i + 1]?.at ?? frames;
          const len = Math.max(1, until - seg.at);
          const fill: React.CSSProperties = {
            position: "absolute",
            left: 0,
            top: barH,
            width: "100%",
            height: `calc(100% - ${barH}px)`,
            objectFit: "cover",
            objectPosition: seg.media.position ?? "top center",
          };
          return (
            <Sequence key={i} from={seg.at} durationInFrames={len} layout="none">
              <Screen media={seg.media} frames={len} style={fill} />
            </Sequence>
          );
        })}
        <div
          style={{
            position: "absolute",
            top: height * 0.012,
            left: "50%",
            width: width * 0.29,
            height: width * 0.085,
            transform: "translateX(-50%)",
            borderRadius: 999,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ type --

/**
 * An eyebrow and a two-part serif title, the second part in italic — the
 * site's section-head pattern. Each word rises on its own beat.
 */
export const Title: React.FC<{
  eyebrow?: string;
  lead: string;
  accent?: string;
  at?: number;
  size?: number;
  align?: "left" | "center";
  color?: string;
}> = ({
  eyebrow,
  lead,
  accent,
  at = 0,
  size = 104,
  align = "left",
  color = C.ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = [
    ...lead.split(" ").map((w) => ({ w, italic: false })),
    ...(accent ? accent.split(" ").map((w) => ({ w, italic: true })) : []),
  ];
  const eyebrowIn = spring({ frame: frame - at, fps, config: { damping: 20 } });
  return (
    <div style={{ textAlign: align }}>
      {eyebrow && (
        <div
          style={{
            fontFamily: body,
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: color === C.ink ? C.inkSoft : "rgba(255,255,255,0.7)",
            marginBottom: 26,
            opacity: eyebrowIn,
            transform: `translateY(${(1 - eyebrowIn) * 14}px)`,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          fontFamily: display,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 0.98,
          letterSpacing: "-0.025em",
          color,
        }}
      >
        {words.map(({ w, italic }, i) => {
          const p = spring({
            frame: frame - at - 4 - i * 3,
            fps,
            config: { damping: 16 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "top",
                paddingBottom: "0.12em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 105}%)`,
                  fontStyle: italic ? "italic" : "normal",
                  color: italic
                    ? color === C.ink
                      ? C.inkMid
                      : "rgba(255,255,255,0.78)"
                    : undefined,
                }}
              >
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** A glass pill, like the app's own chips. `on` lights it. */
export const Chip: React.FC<{
  label: string;
  at: number;
  on?: number;
  tag?: string;
  dark?: boolean;
  size?: number;
}> = ({ label, at, on = 0, tag, dark, size = 30 }) => {
  const p = useRise(at);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: `${size * 0.5}px ${size * 0.9}px`,
        borderRadius: 999,
        fontFamily: body,
        fontWeight: 600,
        fontSize: size,
        color: on > 0.5 ? (dark ? C.ink : "#fff") : dark ? "#fff" : C.ink,
        background:
          on > 0.5
            ? dark
              ? "rgba(255,255,255,0.92)"
              : C.ink
            : dark
              ? "rgba(255,255,255,0.12)"
              : "rgba(255,255,255,0.62)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)"}`,
        boxShadow: "0 18px 40px -22px rgba(23,38,62,0.55)",
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px) scale(${1 + on * 0.04})`,
        backdropFilter: "blur(10px)",
      }}
    >
      {label}
      {tag && (
        <span
          style={{
            fontSize: size * 0.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "5px 12px",
            borderRadius: 999,
            border: `1px solid ${on > 0.5 && !dark ? "rgba(255,255,255,0.5)" : C.hair}`,
            opacity: 0.85,
          }}
        >
          {tag}
        </span>
      )}
    </div>
  );
};

/** A photograph held like a print: white mat, soft shadow, a slight turn. */
export const Print: React.FC<{
  src: string;
  width: number;
  aspect?: number;
  rotate?: number;
  mat?: number;
  style?: React.CSSProperties;
  label?: string;
}> = ({ src, width, aspect = 4 / 3, rotate = 0, mat = 14, style, label }) => (
  <div
    style={{
      width,
      padding: mat,
      paddingBottom: label ? mat + 34 : mat,
      background: "#f7f9fb",
      borderRadius: 4,
      boxShadow:
        "0 40px 70px -34px rgba(23,38,62,0.6), 0 0 0 1px rgba(255,255,255,0.6)",
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        display: "block",
        width: "100%",
        aspectRatio: String(aspect),
        objectFit: "cover",
      }}
    />
    {label && (
      <div
        style={{
          marginTop: 12,
          fontFamily: body,
          fontSize: 18,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: C.inkSoft,
        }}
      >
        {label}
      </div>
    )}
  </div>
);
