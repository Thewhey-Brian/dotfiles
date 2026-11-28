import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FPS } from "./theme";
import { B0, PERIOD, bf } from "./beats";
import { F, PHOTOS } from "./footage";
import {
  Finish,
  Flash,
  HH,
  HW,
  LitImg,
  NIGHT,
  Phone3D,
  Sfx,
  Shock,
  Slam,
  Stage,
  SweepReveal,
  Tag,
  punch,
  shake,
} from "./fx";

// Example hype cut: portrait, cut to the beat of public/music/hype.mp3.
// Sections are beat ranges; L(k) is beat k in a section's local frames.
// Grow it section by section — see references/hype-cut.md for the structure.

export const HYPE_FRAMES = Math.round(24 * FPS);
const GLOW = "#ffd48a";

type Scene = {
  from: number;
  to: number;
  C: React.FC<{ L: (k: number) => number; frames: number }>;
};

/** Build: photos on every beat under the opening words. */
const Build: Scene["C"] = ({ L }) => {
  const f = useCurrentFrame();
  const cuts = Array.from({ length: 8 }, (_, k) => L(k));
  const i = Math.max(
    0,
    cuts.findLastIndex((c) => f >= c),
  );
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <AbsoluteFill
        style={{
          opacity: 0.55,
          transform: `scale(${punch(f, cuts[i], 0.05)})`,
        }}
      >
        <LitImg
          src={PHOTOS[i % PHOTOS.length]}
          cut={cuts[i]}
          w={HW}
          h={HH}
          push={0.1}
        />
      </AbsoluteFill>
      <Slam at={L(1)} out={L(3.5)} size={150}>
        {"Every\nphoto"}
      </Slam>
      <Slam at={L(4)} size={170} color={GLOW} italic>
        {"second\nlife."}
      </Slam>
      {cuts.map((c, k) => (
        <Flash key={k} at={c} strength={0.3} len={4} />
      ))}
    </AbsoluteFill>
  );
};

/** The drop: bloom, shockwave, the mark. */
const Drop: Scene["C"] = ({ L }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: shake(f, [0]) }}>
      <Stage warm={1} />
      <Img
        src={staticFile("brand/icon.png")}
        style={{
          position: "absolute",
          left: HW / 2 - 130,
          top: HH / 2 - 300,
          width: 260,
          height: 260,
          borderRadius: 60,
        }}
      />
      <Slam at={0} size={220} y={HH / 2 + 80}>
        Your App
      </Slam>
      <Tag at={L(1.5)} y={HH / 2 + 260}>
        Your tagline
      </Tag>
      <Shock at={1} />
      <Flash at={0} len={10} strength={1} />
      <Sfx at={0} name="impact" volume={0.8} />
    </AbsoluteFill>
  );
};

/** A feature on a turning phone, one headline word per two beats. */
const FeatureHit: Scene["C"] = ({ L, frames }) => (
  <AbsoluteFill>
    <Stage />
    <Slam at={0} out={L(1.6)} size={130} y={320}>
      A full
    </Slam>
    <Slam at={L(2)} size={150} y={320} italic color={GLOW}>
      toolbox
    </Slam>
    <Phone3D at={0} frames={frames} media={F.demo} y={HH * 0.62} width={480} />
    <Sfx at={0} name="whip" volume={0.35} />
  </AbsoluteFill>
);

/** Before → after, along a sweep of light. */
const Reveal: Scene["C"] = ({ L }) => (
  <AbsoluteFill>
    <Stage warm={0.9} />
    <Tag at={0} y={170}>
      Redrawn
    </Tag>
    <div style={{ position: "absolute", left: 90, top: 260 }}>
      <SweepReveal
        from={PHOTOS[0]}
        to={PHOTOS[1]}
        at={L(1)}
        w={900}
        h={1200}
        style={{ borderRadius: 30 }}
      />
    </div>
    <Sfx at={L(1)} name="shimmer" volume={0.25} />
  </AbsoluteFill>
);

const SCENES: Scene[] = [
  { from: 0, to: 8, C: Build },
  { from: 8, to: 12, C: Drop },
  { from: 12, to: 20, C: FeatureHit },
  { from: 20, to: 999, C: Reveal },
];

// One short phrase per beat that matters: public/voice-hype/<name>.mp3.
const VO: { name: string; k: number; len: number }[] = [];

function musicVolume(f: number) {
  const t = f / FPS;
  const talking = VO.some((v) => {
    const a = B0 + v.k * PERIOD;
    return t >= a - 0.08 && t <= a + v.len + 0.12;
  });
  const fade = interpolate(f, [HYPE_FRAMES - 45, HYPE_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (talking ? 0.42 : 0.85) * fade;
}

export const Hype: React.FC = () => (
  <AbsoluteFill style={{ background: NIGHT }}>
    {SCENES.map((s) => {
      const from = s.from === 0 ? 0 : bf(s.from);
      const to = s.to >= 999 ? HYPE_FRAMES : bf(s.to);
      const L = (k: number) => bf(s.from + k) - from;
      return (
        <Sequence key={s.from} from={from} durationInFrames={to - from}>
          <s.C L={L} frames={to - from} />
        </Sequence>
      );
    })}
    <Finish />
    <Audio src={staticFile("music/hype.mp3")} volume={musicVolume} />
    {VO.map((v, i) => (
      <Sequence
        key={i}
        from={bf(v.k)}
        durationInFrames={Math.ceil((v.len + 0.5) * FPS)}
        layout="none"
      >
        <Audio src={staticFile(`voice-hype/${v.name}.mp3`)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
