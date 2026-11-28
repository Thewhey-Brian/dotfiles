import { FPS } from "./theme";

// The hype cut's beat grid. Measure your track with scripts/beats.py and set:
//   B0     — time of beat 0, seconds
//   PERIOD — seconds per beat (60 / BPM), from the steady median gap
// Then place every cut on a beat number with bf(k); fractions are off-beats.
export const B0 = 0.53;
export const PERIOD = 0.4843;
export const bf = (k: number) => Math.round((B0 + k * PERIOD) * FPS);
