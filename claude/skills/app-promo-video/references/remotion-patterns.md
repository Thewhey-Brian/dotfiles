# Remotion patterns (all in `templates/src`)

## Voice-driven timeline — `timeline.ts`

- `loadTimeline(variant)` runs in `calculateMetadata`: fetches
  `public/<voiceDir>/<id>.json` per line; scene frames = (LEAD + duration +
  tail) × fps; falls back to a words/2.6 estimate so drafts render pre-voice.
- `cue(t, word, nth)` → scene frame where the narration says `word` (normalised,
  punctuation stripped; hyphenated words normalise joined: "black-and-white").
- `said(t, word)` → whether the line says it. Scenes filter their item lists
  with it, so short cuts show fewer items with no code change.
- Pitfalls: a word that isn't spoken falls back to frame ~0 — anything keyed to
  it (a phone segment, a panel's end) fires at the start. Guard with `said()`.
  "draws" ≠ "draw"; "spirals" ≠ "spiral".

## Phones and footage — `components/ui.tsx`

- `Phone` draws the device; `media` is one `Media` or `Segment[]` (`{at, media}`)
  cutting at scene frames. Video media are **spans** `[a, b]` of source seconds
  fitted to their slot; rate capped at 2.5× — if the slot is too short it shows
  the *end* of the span (where the result is).
- Pass the scene's full `frames` to a phone; if its media starts later, use a
  segment `{ at: startFrame, media }` — never shorten `frames` (the clip ends
  early and the screen goes black).
- `RisingPhone` (in scenes) springs in and drifts; `Phone3D` (hype) turns in 3D.

## Layout — `components/layout.tsx`

- Scenes are authored on a 1920×1080 stage. For portrait, wrap everything but
  the phone in `<Pane region={{x,y,w,h}}>`: in portrait it re-fits that region
  into the top of a 1080×1920 frame; the phone moves under it
  (`PORTRAIT_PHONE`). Size the region to its widest element (titles!), or the
  title overflows. Scenes without a phone get their own portrait arrangement.
- `Vertical` context → `useVertical()` for any per-scene portrait tweaks.

## Scene craft

- `Title` (eyebrow + lead + italic accent, words rise), `Chip`, `Print` (matted
  photo), `Sky` (brand backdrop), `Sfx` (sound at a frame).
- Highlight exactly what the phone shows: drive a list's active item and the
  phone's segments from the *same* cue words.
- Transitions between scenes: a short fade (`SceneFade`) + a quiet whoosh.
- Outro: steps leave before the logo arrives (never share the frame); then
  logo, tagline, store badge, URL, QR on a white card ("Scan to download").
- Name reveal (e.g. "Doover" → "Do-over"): hyphen width animates 0→N px in the
  accent colour, second half turns italic/glow, caption below, then closes.

## Captions (only if asked)

Phrases break at sentence ends, at commas only after ≥4 words, max 8 words;
the old phrase fades before the new one lands; each word eases grey→ink over
its first ~0.2 s. Prefer no captions when the voice is good.

## Rendering

- Compositions: one per variant (`Film`, `Social`, `FilmVertical`,
  `SocialVertical`, `Hype`) sharing scenes.
- zsh: arrays for loops over stills (`L=(a:1 b:2); for p in $L`), and
  `${V}` not `$V[...]` inside filter strings.
- Don't change `public/` files while a render is running.
- `tsconfig` needs `lib: ES2023` for `findLastIndex`.
