import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  interpolate,
  Sequence,
  staticFile,
} from "remotion";
import { FPS, H, W } from "./theme";
import { LEAD, loadTimeline, type Timed } from "./timeline";
import { VOICE_DIR, type Variant } from "./script";
import { SCENES } from "./scenes";
import { SceneFade } from "./components/ui";
import { Vertical } from "./components/layout";
import { Hype, HYPE_FRAMES } from "./hype";
import { HH, HW } from "./fx";

type Props = { timeline: Timed[]; variant: Variant; vertical: boolean };

/** The bed dips while the narrator speaks and rises in the gaps. */
function bedVolume(timeline: Timed[], total: number, variant: Variant) {
  const [under, gaps] = variant === "social" ? [0.16, 0.32] : [0.1, 0.2];
  const speaking = timeline
    .filter((t) => t.voice)
    .map((t) => {
      const a = t.from + LEAD * FPS;
      return [a, a + (t.voice?.duration ?? 0) * FPS] as const;
    });
  return (f: number) => {
    const talk = speaking.some(([a, b]) => f >= a - 6 && f <= b + 6);
    const fade = interpolate(f, [0, 45, total - 90, total], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (talk ? under : gaps) * fade;
  };
}

const Film: React.FC<Props> = ({ timeline, variant, vertical }) => {
  const last = timeline[timeline.length - 1];
  const total = last ? last.from + last.frames : 1;
  const vol = bedVolume(timeline, total, variant);
  return (
    <Vertical.Provider value={vertical}>
      <AbsoluteFill style={{ background: "#cfdcec" }}>
        {timeline.map((t, i) => {
          const Scene = SCENES[t.id];
          return (
            <Sequence
              key={t.id}
              from={t.from}
              durationInFrames={t.frames}
              name={t.id}
            >
              <SceneFade frames={t.frames}>
                <Scene t={t} />
              </SceneFade>
              {t.voice && (
                <Sequence from={Math.round(LEAD * FPS)} name={`${t.id} voice`}>
                  <Audio
                    src={staticFile(`${VOICE_DIR[variant]}/${t.id}.mp3`)}
                  />
                </Sequence>
              )}
              {i > 0 && (
                <Sequence from={0} durationInFrames={45}>
                  <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.22} />
                </Sequence>
              )}
            </Sequence>
          );
        })}
        <Audio
          src={staticFile(
            variant === "social" ? "music/bed-social.mp3" : "music/bed.mp3",
          )}
          volume={(f) => vol(f)}
        />
      </AbsoluteFill>
    </Vertical.Provider>
  );
};

const film = (id: string, variant: Variant, vertical = false) => (
  <Composition
    id={id}
    component={Film}
    width={vertical ? H : W}
    height={vertical ? W : H}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{ timeline: [] as Timed[], variant, vertical }}
    calculateMetadata={async () => {
      const timeline = await loadTimeline(variant);
      const last = timeline[timeline.length - 1];
      return {
        durationInFrames: last.from + last.frames,
        props: { timeline, variant, vertical },
      };
    }}
  />
);

export const Root: React.FC = () => (
  <>
    {film("Film", "full")}
    {film("Social", "social")}
    {film("FilmVertical", "full", true)}
    {film("SocialVertical", "social", true)}
    <Composition
      id="Hype"
      component={Hype}
      width={HW}
      height={HH}
      fps={FPS}
      durationInFrames={HYPE_FRAMES}
    />
  </>
);
