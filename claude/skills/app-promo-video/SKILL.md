---
name: app-promo-video
description: Make a polished promo / intro / launch / explainer video for an app or product with Remotion — real app footage captured from the iOS simulator (idb), ElevenLabs voiceover + sound effects + music, scenes timed to the narration's word timestamps, landscape and portrait (Reels/TikTok/Shorts) versions, a short social cut, and a fast beat-synced "hype" cut. Use when the user asks for a product video, app demo video, feature showcase, social ad, TikTok/Reels video, or wants an existing Remotion promo revised (pacing, voice, captions, vertical version, more dynamic).
---

# App promo video

A pipeline for turning an app into a finished marketing video, proven end to
end on a real iOS app. Everything is code, so every revision is a re-render.

## What you produce (offer the ones that fit)

| Cut | Length | Shape | Voice | Built from |
|---|---|---|---|---|
| Full explainer | 2–3.5 min | 16:9 | calm narrator, a line per scene | `templates/` |
| Social cut | ~60 s | 16:9 | punchy ad voice, 1.15× | same scenes, shorter lines |
| Portrait versions of both | same | 9:16 | same audio | `Pane` re-fit, no new scenes |
| Hype cut | ~45 s | 9:16 native | a phrase per beat | beat grid + `fx.tsx` |

## Workflow

1. **Inventory before writing a word.** Read the app's code for the facts the
   script will claim (counts, feature names, what's free vs paid, no ads?). Every
   claim in narration must be checkable in the code — note the file next to it
   in the script. See `references/pipeline.md` §1.
2. **Scaffold.** Copy `templates/` into `<project>/video/`, `npm install`, set the
   brand in `src/theme.ts` (fonts, palette). Keep it separate from the product's
   deploy.
3. **Script.** One line per scene in `src/script.ts`. Scenes cue their beats on
   *words in the line* (`cue(t, "word")`), and show only items the line names
   (`said(t, "word")`) — so shortening a line shortens the scene cleanly.
   Avoid comma lists in narration: TTS pauses ~1.5 s at each comma.
4. **Footage.** Record real flows from the simulator with `scripts/sim.py`
   (idb, driven by accessibility labels). Read `references/simulator-capture.md`
   first — it lists the traps (mock renders, float coords, fling scrolling,
   permission prompts). Stills: crop screenshots by the element's frame.
   Sample photos: CC0 from Openverse (Unsplash blocks bots — don't bypass).
5. **Voice, SFX, music.** `node scripts/voice.mjs` (ElevenLabs with timestamps),
   `node scripts/sound.mjs`. Voice choice and settings: `references/elevenlabs.md`.
6. **Scenes.** Build in `src/scenes.tsx` using `components/ui.tsx`. Phone clips
   are *spans* of source seconds fitted to their slot, capped at 2.5× — so
   re-voicing never breaks the edit. Patterns: `references/remotion-patterns.md`.
7. **Review with stills, not renders.** Render stills at cue frames and tile
   them into contact sheets (`scripts/contact-sheet.sh`); look for overflow,
   overlap, blank phones, text on text. Full renders only when stills pass.
   Checklist: `references/review-checklist.md`.
8. **Finish.** Render, then loudness-normalise without re-encoding video:
   `scripts/finalize.sh in.mp4 out.mp4 -16` (film) or `-14` (social).

For the hype cut: `references/hype-cut.md` (generate music → detect beat grid
with `scripts/beats.py` → place every cut on a beat number → elegant fx).

## Principles that held up in revision

- **Real footage and real results beat mockups.** Record the actual app; show
  actual renders. Never fabricate a screen or a number.
- **Pace to the voice.** Labels light when the phone *shows* the thing, not
  when it's convenient. Give dense screens (masks, stores) time to be read.
- **Elegant over loud.** Warm light blooms, slanted light-sweep reveals, gentle
  settles. Avoid RGB-split glitches, white-out flashes and heavy shake — users
  asked for these to be replaced every time.
- **No captions by default** when there's a good voiceover; if captions are
  needed, crossfade phrases and ease each word (never hard-swap).
- **Claims:** don't name competitors in comparative ads (trademark / false
  advertising risk); say "no subscription, no ads" only if the code proves it.
- **Ask about credits/spend** before running paid features in the app for
  footage; say how many were used.
- **End card:** logo, tagline, store badge, URL, and the store QR code.

## Files

- `templates/` — drop-in Remotion project (see `templates/README.md`).
- `references/pipeline.md` — the whole process in order, with commands.
- `references/simulator-capture.md` — idb driving, recording, cropping, traps.
- `references/elevenlabs.md` — voices, TTS with timestamps, SFX, music, loudness.
- `references/remotion-patterns.md` — timeline, cues, spans, portrait panes.
- `references/hype-cut.md` — beat-synced social cut, structure and fx.
- `references/review-checklist.md` — what to check before each render.
