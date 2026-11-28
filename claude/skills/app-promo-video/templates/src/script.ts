// The narration, one line per scene. voice.mjs reads this list, so what's
// spoken is exactly what the scenes cue on. Scene length = LEAD + spoken
// duration + tail.
//
// Put the evidence for every claim here, next to it (file in the product):
// - "free, no subscription" — billing code only gates <paid feature>
// - "<N> styles" — avoid counts that drift; show variety instead

export type SceneId = "intro" | "feature" | "outro";

export type Line = { id: SceneId; text: string; tail: number };

export const LINES: Line[] = [
  { id: "intro", text: "Every photo you've taken has a second life waiting in it. This is how you find it.", tail: 0.8 },
  {
    id: "feature",
    text: "Open a photo, and the tools are all there: light, colour, and masks that find the sky for you. All of it free.",
    tail: 0.6,
  },
  { id: "outro", text: "Pick a photo. Make it yours. Download it free today.", tail: 2.4 },
];

// The social cut: same scene ids, lines cut to their bones. Write lists as
// phrases ("light and colour and masks") — TTS pauses at every comma.
export const LINES_SOCIAL: Line[] = [
  { id: "intro", text: "Every photo deserves a second life.", tail: 0.3 },
  { id: "feature", text: "Light and colour and masks that find the sky, all free.", tail: 0.3 },
  { id: "outro", text: "Pick a photo. Make it yours.", tail: 2.0 },
];

export type Variant = "full" | "social";
export const SCRIPTS: Record<Variant, Line[]> = { full: LINES, social: LINES_SOCIAL };
export const VOICE_DIR: Record<Variant, string> = { full: "voice", social: "voice-social" };

/** Speaking rate used until real voice files exist: ~2.6 words a second. */
export const estimateSeconds = (text: string) => text.split(/\s+/).length / 2.6;
