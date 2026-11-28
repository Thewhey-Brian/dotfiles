import type { Media } from "./components/ui";

// What each phone shows. Video media are *spans* of source seconds, fitted to
// their slot (never faster than 2.5×), so re-voicing never breaks the edit.
// Record real flows with scripts/sim.py; encode with scripts/encode-sim.sh.
const v = (src: string, a: number, b: number): Media => ({
  kind: "video",
  src: `footage/${src}.mp4`,
  span: [a, b],
});
const img = (src: string): Media => ({
  kind: "image",
  src: `footage/${src}.jpg`,
});

export const F = {
  // replace with your captures, e.g. home: v("sim-home", 0.6, 3.4)
  demo: v("demo", 0, 6),
  demoStill: img("demo"),
};

// Sample photographs (CC0 via Openverse; record sources in photos/CREDITS.json).
export const PHOTOS = [
  "sample-1",
  "sample-2",
  "sample-3",
  "sample-4",
  "sample-5",
  "sample-6",
].map((n) => `photos/${n}.jpg`);
