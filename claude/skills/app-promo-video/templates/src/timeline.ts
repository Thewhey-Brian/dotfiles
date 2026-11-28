import { staticFile } from "remotion";
import { FPS } from "./theme";
import { SCRIPTS, VOICE_DIR, estimateSeconds, type SceneId, type Variant } from "./script";

export type Word = { text: string; start: number; end: number };
export type Voice = { duration: number; words: Word[] };

export type Timed = {
  id: SceneId;
  text: string;
  /** Null until scripts/voice.mjs has been run for this scene. */
  voice: Voice | null;
  from: number;
  frames: number;
};

/** The voice starts this long into its scene, after the picture arrives. */
export const LEAD = 0.35;

export async function loadTimeline(variant: Variant = "full"): Promise<Timed[]> {
  const out: Timed[] = [];
  let from = 0;
  for (const line of SCRIPTS[variant]) {
    let voice: Voice | null = null;
    try {
      const res = await fetch(staticFile(`${VOICE_DIR[variant]}/${line.id}.json`));
      if (res.ok) voice = await res.json();
    } catch {
      voice = null;
    }
    const spoken = voice?.duration ?? estimateSeconds(line.text);
    const frames = Math.ceil((LEAD + spoken + line.tail) * FPS);
    out.push({ id: line.id, text: line.text, voice, from, frames });
    from += frames;
  }
  return out;
}

/**
 * When, in scene frames, the narration reaches `word` (its nth occurrence).
 * Falls back to an even spread of the line when there is no voice yet, so
 * beats land in roughly the right place in a draft.
 */
export function cue(t: Timed, word: string, nth = 0): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
  const target = norm(word);
  if (t.voice) {
    const hits = t.voice.words.filter((w) => norm(w.text) === target);
    const hit = hits[nth] ?? hits[0];
    if (hit) return Math.round((LEAD + hit.start) * FPS);
  }
  const words = t.text.split(/\s+/).map(norm);
  let seen = 0;
  const idx = words.findIndex((w) => w === target && seen++ === nth);
  const at = idx < 0 ? 0 : idx / words.length;
  return Math.round((LEAD + at * estimateSeconds(t.text)) * FPS);
}

/**
 * Whether the narration says `word` at all. Scenes show only the items
 * their line names, so a shorter cut simply names fewer of them.
 */
export function said(t: Timed, word: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
  const target = norm(word);
  const words = t.voice ? t.voice.words.map((w) => w.text) : t.text.split(/\s+/);
  return words.some((w) => norm(w) === target);
}
