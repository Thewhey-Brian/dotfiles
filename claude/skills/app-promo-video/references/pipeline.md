# Pipeline, in order

## 1. Inventory the product (before any script)

- Read the app's source for every fact you'll say: feature names as they
  appear in the UI, counts (bundled catalogs), which features are free vs
  paid (paywall/billing code), whether there are ads/tracking (ad SDKs,
  `PrivacyInfo.xcprivacy`), what each AI feature actually does (its code
  comments/prompts).
- Write those as comments at the top of `src/script.ts` next to the claim.
- Avoid numbers that will drift (catalog counts from a server) — show
  diversity instead of a count.
- Check the marketing site/store copy for claims you'll contradict; flag them.

## 2. Scaffold

```sh
cp -R ~/.claude/skills/app-promo-video/templates <project>/video
cd <project>/video && npm install
```
Set `src/theme.ts` (Google fonts via `@remotion/google-fonts`, palette).
Put `ELEVENLABS_API_KEY=…` in `video/.env` (git-ignored) or reuse a repo
`.env.local` (the scripts read both).

## 3. Script

- `LINES` in `src/script.ts`: `{ id, text, tail }` per scene. Scene length =
  lead (0.35 s) + spoken duration + tail.
- Full film: calm narrator, complete sentences, ~2.6 words/s.
- Social cut: `LINES_SOCIAL`, same scene ids, lines cut to their bones,
  lists written as phrases ("light and curves and colour"), drop scenes the
  outro recaps. Target ~60 s.
- Every scene cues on words — make sure each line contains the words its
  scene cues on (`cue`) or shows (`said`).

## 4. Footage

- Simulator: see `simulator-capture.md`. Record one clip per flow; log mark
  timestamps (`marks` dict) when a flow has distinct rooms/steps so spans
  can be cut precisely.
- Encode: `ffmpeg -i raw/x.mov -vf "crop=1320:2678:0:190,scale=720:-2,fps=30" -an -c:v libx264 -crf 19 -pix_fmt yuv420p public/footage/sim-x.mp4`
  (the crop removes the status bar and any notification banner).
- Screenshots from a real device: convert PNG → JPG q90 (PNGs are 5 MB each).
- Photos: Openverse API, `license=cc0,pdm&category=photograph&size=large`;
  build numbered contact sheets, pick visually, record credits in
  `public/photos/CREDITS.json`. Choose photos *per purpose* (e.g. a real
  spiral for a golden-spiral guide, a road for leading lines).
- Real product results (renders, auto-edits): capture stills by cropping a
  simulator screenshot to the image element's accessibility frame; wait for
  transitions to settle (≥5 s) before snapping.

## 5. Audio

- `node scripts/voice.mjs [--social]` → `public/voice*/<id>.mp3 + .json` (word
  timings). `node scripts/sound.mjs [--social]` → `public/sfx/*`,
  `public/music/bed*.mp3` sized to the narration.
- Music ducks under the voice (`bedVolume` in `Root.tsx`): film 0.10/0.20,
  social 0.16/0.32.

## 6. Scenes → 7. Review → 8. Render

```sh
npx remotion still src/index.ts Film out/stills/x.png --frame=N   # review
scripts/contact-sheet.sh out/stills/*.png                           # tile
npx remotion render src/index.ts Film out/film.mp4
scripts/finalize.sh out/film.mp4 out/film-final.mp4 -16
```
Long renders: run in the background and wait with an until-loop.
