import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FPS, body, display } from "./theme";
import { Phone, type Media } from "./components/ui";

// The effects kit for fast, dramatic cuts — kept elegant: warm light blooms
// instead of white flashes, a light-sweep instead of glitches, words that
// settle rather than slam from huge, a whisper of shake. Portrait stage size:
export const HW = 1080;
export const HH = 1920;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const INK = "#f4f1ea";
export const GLOW = "#ffd48a";
export const NIGHT = "#070b14";

// ------------------------------------------------------------------ fx --

/** A sound on frame `at`. */
export const Sfx: React.FC<{
  at: number;
  name: string;
  volume?: number;
  voice?: boolean;
}> = ({ at, name, volume = 0.5, voice }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={FPS * 4} layout="none">
    <Audio
      src={staticFile(voice ? `voice-hype/${name}.mp3` : `sfx/${name}.mp3`)}
      volume={volume}
    />
  </Sequence>
);

/**
 * A bloom of warm light from the centre of the frame on a cut: the edges stay
 * dark, so it reads as light arriving, not the picture washing out.
 */
export const Flash: React.FC<{ at: number; len?: number; strength?: number; color?: string }> = ({ at, len = 7, strength = 0.9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 2, at + len + 6], [0, strength * 0.55, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 45% at 50% 45%, rgba(255,226,178,${o}), rgba(255,200,140,${o * 0.35}) 45%, transparent 75%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};

/** An expanding ring from a point: the visual of an impact. */
export const Shock: React.FC<{
  at: number;
  x?: number;
  y?: number;
  color?: string;
}> = ({ at, x = HW / 2, y = HH / 2, color = GLOW }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 22], [0, 1], clamp);
  if (f < at || p >= 1) return null;
  const r = 60 + p * 1100;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${Math.max(1, 26 * (1 - p))}px solid ${color}`,
        opacity: (1 - p) * 0.8,
        filter: "blur(2px)",
        pointerEvents: "none",
      }}
    />
  );
};

/** Camera shake: a sharp jolt after each impact frame, gone in ~10 frames. */
export function shake(f: number, impacts: number[]) {
  let x = 0;
  let y = 0;
  for (const at of impacts) {
    const d = f - at;
    if (d < 0 || d > 12) continue;
    const a = 7 * Math.exp(-d / 3.5);
    x += a * Math.sin(d * 2.7 + at);
    y += a * Math.cos(d * 3.3 + at * 1.7);
  }
  return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

/** Scale punch on a beat: in hard, settle fast. */
export function punch(f: number, at: number, amount = 0.1) {
  const d = f - at;
  if (d < 0) return 1;
  return 1 + amount * Math.exp(-d / 4);
}

/**
 * A word that slams in: from huge and blurred to its size in a few frames,
 * then (if `out` is given) blows past the camera and is gone.
 */
export const Slam: React.FC<{
  at: number;
  out?: number;
  children: React.ReactNode;
  size?: number;
  y?: number;
  color?: string;
  italic?: boolean;
  font?: "display" | "body";
  tracking?: string;
}> = ({
  at,
  out,
  children,
  size = 150,
  y = HH / 2,
  color = INK,
  italic,
  font = "display",
  tracking,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || (out !== undefined && f > out + 8)) return null;
  const inP = spring({
    frame: f - at,
    fps,
    config: { damping: 18, stiffness: 170, mass: 0.7 },
  });
  const outP =
    out === undefined ? 0 : interpolate(f, [out, out + 7], [0, 1], clamp);
  const scale = (1.35 - 0.35 * inP) * (1 + outP * 0.35);
  const blur = Math.max(0, (1 - inP) * 10) + outP * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: `translateY(-50%) scale(${scale})`,
        textAlign: "center",
        fontFamily: font === "display" ? display : body,
        fontWeight: font === "display" ? 700 : 700,
        fontStyle: italic ? "italic" : "normal",
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: tracking ?? (font === "display" ? "-0.035em" : "0.14em"),
        textTransform: font === "body" ? "uppercase" : "none",
        color,
        filter: `blur(${blur}px)`,
        opacity: Math.min(1, inP * 3) * (1 - outP),
        textShadow: "0 10px 60px rgba(0,0,0,0.55)",
        whiteSpace: "pre-line",
      }}
    >
      {children}
    </div>
  );
};

/**
 * An image with an RGB split for a few frames after a cut — the glitch — and
 * a slow push-in the rest of the time.
 */
export const LitImg: React.FC<{
  src: string;
  cut: number;
  w: number;
  h: number;
  push?: number;
  style?: React.CSSProperties;
  fit?: "cover" | "contain";
}> = ({ src, cut, w, h, push = 0.08, style, fit = "cover" }) => {
  const f = useCurrentFrame();
  const d = f - cut;
  // A cut arrives in a breath of warm light: slightly over-exposed and soft
  // for a few frames, settling into the picture.
  const bloom = d >= 0 ? interpolate(d, [0, 10], [0.45, 0], clamp) : 0;
  const soft = d >= 0 ? interpolate(d, [0, 5], [4, 0], clamp) : 0;
  const zoom = 1 + push * interpolate(f, [cut, cut + 90], [0, 1], clamp);
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: fit,
            filter: `brightness(${1 + bloom}) blur(${soft}px)`,
          }}
        />
      </div>
    </div>
  );
};

/**
 * The effect reveal: the redrawn picture sweeps in over the photo along a
 * slanted edge of warm light.
 */
export const SweepReveal: React.FC<{ from: string; to: string; at: number; w: number; h: number; style?: React.CSSProperties }> = ({ from, to, at, w, h, style }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const slant = w * 0.3;
  const xt = p * (w + slant);
  const xb = xt - slant;
  const img: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  const zoom = 1 + 0.05 * interpolate(f, [at - 30, at + 60], [0, 1], clamp);
  const angle = (Math.atan2(slant, h) * 180) / Math.PI;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <Img src={staticFile(from)} style={{ ...img, filter: "saturate(0.7) brightness(0.85)" }} />
        <Img src={staticFile(to)} style={{ ...img, clipPath: `polygon(0 0, ${xt}px 0, ${xb}px ${h}px, 0 ${h}px)` }} />
      </div>
      {p > 0 && p < 1 && (
        <div
          style={{
            position: "absolute",
            top: -h * 0.1,
            left: (xt + xb) / 2 - 60,
            width: 120,
            height: h * 1.2,
            transform: `rotate(${angle}deg)`,
            background: "linear-gradient(90deg, transparent, rgba(255,232,190,0.85), transparent)",
            filter: "blur(10px)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
};

/** Night backdrop with drifting coloured light — the room the cut plays in. */
export const Stage: React.FC<{ warm?: number }> = ({ warm = 0.6 }) => {
  const f = useCurrentFrame();
  const blob = (
    x: number,
    y: number,
    r: number,
    c: string,
    o: number,
    s: number,
  ) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(f / (60 * s)) * 120 - r,
        top: y + Math.cos(f / (70 * s)) * 160 - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `radial-gradient(closest-side, ${c}, transparent)`,
        opacity: o,
        filter: "blur(40px)",
        mixBlendMode: "screen",
      }}
    />
  );
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 80% at 50% 40%, #16203a, ${NIGHT} 70%)`,
      }}
    >
      {blob(200, 400, 520, "#b4682a", 0.45 * warm, 1)}
      {blob(900, 1400, 620, "#3b5bdb", 0.35, 1.3)}
      {blob(700, 300, 380, GLOW, 0.25 * warm, 0.8)}
    </AbsoluteFill>
  );
};

/** Film grain and a vignette over everything. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          opacity: 0.22,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundPosition: `${(f * 37) % 220}px ${(f * 53) % 220}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.6))",
        }}
      />
    </>
  );
};

/** A small tracked label: the eyebrow of a beat. */
export const Tag: React.FC<{
  at: number;
  out?: number;
  y: number;
  children: React.ReactNode;
  color?: string;
}> = ({ at, out, y, children, color = GLOW }) => {
  const f = useCurrentFrame();
  const o =
    interpolate(f, [at, at + 4], [0, 1], clamp) *
    (out === undefined ? 1 : interpolate(f, [out, out + 4], [1, 0], clamp));
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        textAlign: "center",
        fontFamily: body,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: "0.34em",
        textTransform: "uppercase",
        color,
        opacity: o,
        transform: `translateY(${(1 - o) * 14}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** A phone that swings in on a 3D turn and keeps turning slowly. */
export const Phone3D: React.FC<{
  at: number;
  media: Media | { at: number; media: Media }[];
  frames: number;
  width?: number;
  y?: number;
  from?: number;
}> = ({ at, media, frames, width = 470, y = HH * 0.58, from = -40 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 16, mass: 0.8 } });
  const drift = interpolate(f - at, [0, frames], [0, 10]);
  return (
    <div
      style={{
        position: "absolute",
        left: HW / 2,
        top: y,
        perspective: 1800,
        opacity: Math.min(1, p * 2),
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 500}px)`,
      }}
    >
      <div
        style={{
          transform: `rotateY(${from * (1 - p) - 8 + drift}deg) rotateX(${8 * (1 - p) + 4}deg) scale(${0.8 + p * 0.2})`,
          transformStyle: "preserve-3d",
        }}
      >
        <Phone media={media} frames={frames} width={width} />
      </div>
    </div>
  );
};

