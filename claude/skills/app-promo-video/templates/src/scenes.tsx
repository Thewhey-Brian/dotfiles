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
import { C, body, display } from "./theme";
import { cue, said, type Timed } from "./timeline";
import { Phone, Sky, Title, useRise } from "./components/ui";
import { PORTRAIT_PHONE, Pane, useVertical } from "./components/layout";
import { F, PHOTOS } from "./footage";

// Example scenes. Each gets its Timed line: cue(t, "word") is the frame the
// narration says a word; said(t, "word") whether it says it at all. Author on
// the 1920×1080 stage; wrap everything but the phone in <Pane> for portrait.

type S = React.FC<{ t: Timed }>;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** A sound effect at scene frame `at` (files in public/sfx/). */
export const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({
  at,
  name,
  volume = 0.4,
}) => (
  <Sequence
    from={Math.max(0, Math.round(at))}
    durationInFrames={75}
    layout="none"
  >
    <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
  </Sequence>
);

/** A phone that springs up into place; in portrait it sits under the Pane. */
const RisingPhone: React.FC<
  React.ComponentProps<typeof Phone> & { at?: number; x: number; tilt?: number }
> = ({ at = 0, x, tilt = 0, ...phone }) => {
  const frame = useCurrentFrame();
  const vertical = useVertical();
  const p = useRise(at, 20);
  const drift = Math.sin(frame / 55) * 6;
  if (vertical) {
    x = PORTRAIT_PHONE.cx;
    phone = { ...phone, width: PORTRAIT_PHONE.width };
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: vertical ? PORTRAIT_PHONE.cy : "50%",
        transform: `translate(-50%, calc(-50% + ${(1 - p) * 260 + drift}px)) rotate(${tilt * (1 - p * 0.4)}deg)`,
        opacity: p,
      }}
    >
      <Phone {...phone} />
    </div>
  );
};

const lit = (frame: number, at: number) =>
  interpolate(frame, [at - 4, at + 8], [0, 1], clamp);

// ------------------------------------------------------------------ intro --

export const Intro: S = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    frame: frame - cue(t, "This"),
    fps,
    config: { damping: 22 },
  });
  return (
    <AbsoluteFill>
      <Sky />
      <AbsoluteFill
        style={{
          transform: `rotate(-10deg) scale(1.3)`,
          filter: `blur(${reveal * 10}px)`,
          opacity: 1 - reveal * 0.55,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 26,
            justifyContent: "center",
            marginTop: -300,
          }}
        >
          {Array.from({ length: 7 }).map((_, c) => (
            <div
              key={c}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 26,
                transform: `translateY(${(c % 2 ? 1 : -1) * frame * 1.6 - 500}px)`,
              }}
            >
              {Array.from({ length: 7 }).map((__, r) => (
                <Img
                  key={r}
                  src={staticFile(PHOTOS[(c * 5 + r * 3) % PHOTOS.length])}
                  style={{
                    width: 300,
                    height: r % 2 ? 380 : 260,
                    objectFit: "cover",
                    borderRadius: 18,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            textAlign: "center",
            opacity: reveal,
            transform: `translateY(${(1 - reveal) * 40}px)`,
          }}
        >
          <Img
            src={staticFile("brand/icon.png")}
            style={{ width: 190, height: 190, borderRadius: 44 }}
          />
          <div
            style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 170,
              color: C.ink,
              marginTop: 20,
            }}
          >
            Your App
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- feature --

// A list lit by the narration, beside a phone that cuts on the same words —
// so the label that's lit is always what the phone is showing.
const ITEMS = [
  { word: "light", label: "Light", note: "Exposure, highlights, shadows" },
  { word: "colour", label: "Colour", note: "Every hue on its own" },
  { word: "masks", label: "Masks", note: "They find the sky for you" },
];

export const Feature: S = ({ t }) => {
  const frame = useCurrentFrame();
  const items = ITEMS.filter((x) => said(t, x.word));
  const active = Math.max(
    0,
    items.findLastIndex((x) => frame >= cue(t, x.word) - 4),
  );
  return (
    <AbsoluteFill>
      <Sky />
      <Pane region={{ x: 150, y: 100, w: 900, h: 760 }}>
        <div style={{ position: "absolute", left: 150, top: 110, width: 900 }}>
          <Title
            eyebrow="The tools"
            lead="Everything"
            accent="you need."
            at={4}
            size={96}
          />
        </div>
        <div style={{ position: "absolute", left: 150, top: 380, width: 820 }}>
          {items.map((x, i) => {
            const on = i === active && frame >= cue(t, x.word) - 4;
            return (
              <div
                key={x.label}
                style={{
                  display: "flex",
                  gap: 22,
                  alignItems: "baseline",
                  padding: "16px 26px",
                  marginBottom: 10,
                  borderRadius: 18,
                  background: on ? C.ink : "rgba(255,255,255,0.5)",
                  color: on ? "#fff" : C.ink,
                  opacity: 0.3 + lit(frame, cue(t, x.word)) * 0.7,
                }}
              >
                <span
                  style={{
                    fontFamily: display,
                    fontWeight: 600,
                    fontSize: 40,
                    width: 190,
                  }}
                >
                  {x.label}
                </span>
                <span style={{ fontFamily: body, fontSize: 24, opacity: 0.8 }}>
                  {x.note}
                </span>
              </div>
            );
          })}
        </div>
        {said(t, "free") && (
          <div
            style={{
              position: "absolute",
              left: 150,
              top: 700,
              fontFamily: display,
              fontWeight: 700,
              fontSize: 120,
              color: C.ink,
              opacity: lit(frame, cue(t, "free")),
            }}
          >
            Free<span style={{ color: C.ember }}>.</span>
          </div>
        )}
        {items.map((x) => (
          <Sfx key={x.word} at={cue(t, x.word) - 2} name="tap" volume={0.25} />
        ))}
      </Pane>
      <RisingPhone
        x={1440}
        frames={t.frames}
        width={400}
        tilt={2}
        media={[{ at: 0, media: F.demo }]}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ outro --

export const Outro: S = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = spring({
    frame: frame - cue(t, "Make") + 4,
    fps,
    config: { damping: 22 },
  });
  return (
    <AbsoluteFill>
      <Sky dusk={0.5} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            textAlign: "center",
            opacity: brand,
            transform: `translateY(${(1 - brand) * 40}px)`,
          }}
        >
          <Img
            src={staticFile("brand/icon.png")}
            style={{ width: 170, height: 170, borderRadius: 40 }}
          />
          <div
            style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 150,
              color: "#fff",
              marginTop: 18,
            }}
          >
            Your App
          </div>
          <div
            style={{
              fontFamily: display,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 46,
              color: "rgba(255,255,255,0.85)",
              marginTop: 10,
            }}
          >
            Your tagline.
          </div>
          <div
            style={{
              display: "flex",
              gap: 36,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 36,
            }}
          >
            <div
              style={{
                fontFamily: body,
                fontSize: 30,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              yourapp.com
            </div>
            {/* the store QR, on a white card so it scans off any screen */}
            <div
              style={{
                padding: 12,
                borderRadius: 20,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Img
                src={staticFile("brand/qr.png")}
                style={{ width: 170, height: 170 }}
              />
              <span
                style={{
                  marginTop: 6,
                  fontFamily: body,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.ink,
                }}
              >
                Scan to download
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SCENES: Record<Timed["id"], S> = {
  intro: Intro,
  feature: Feature,
  outro: Outro,
};
