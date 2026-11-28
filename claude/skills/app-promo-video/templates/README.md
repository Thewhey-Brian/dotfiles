# Promo video (Remotion starter)

Copy into a project as `video/`, then:

```sh
npm install
npm run studio                      # preview; renders with placeholders out of the box
```

## Make it yours

1. `src/theme.ts` — fonts and palette.
2. `src/script.ts` — one narration line per scene (full + social); note the
   evidence for each claim next to it.
3. `public/brand/icon.png`, `public/brand/qr.png` (store QR), photos via
   `python3 scripts/openverse.py search "…"` then `… get "<query>" <n> <name>`.
4. Footage: add clips to `scripts/sim.py` (`python3 scripts/sim.py probe` lists
   on-screen labels), record, `scripts/encode-sim.sh raw/x.mov public/footage/sim-x.mp4`,
   then point `src/footage.ts` spans at them.
5. Scenes in `src/scenes.tsx` (register ids in `SCENES` and `SceneId`).

## Audio (ElevenLabs — key in `.env` or `../.env.local`)

```sh
node scripts/voice.mjs            # full narration + word timings
node scripts/voice.mjs --social   # social cut (ad voice, 1.15×)
node scripts/sound.mjs            # sfx + film bed        (--social / --hype 44)
python3 scripts/beats.py public/music/hype.mp3   # then set src/beats.ts
scripts/trim-voice.sh public/voice-hype          # per-beat phrases for the hype cut
```

## Render

```sh
npm run render            # Film (16:9)      → out/film.mp4
npm run render:social     # Social (16:9)
npm run render:vertical   # SocialVertical (9:16); FilmVertical also exists
npm run render:hype       # Hype (9:16, beat-synced)
scripts/finalize.sh out/film.mp4 out/film-final.mp4 -16     # -14 for social
python3 scripts/contact_sheet.py out/sheet.jpg out/film.mp4 # pacing review
```

Review stills before full renders:
`npx remotion still src/index.ts Film out/stills/a.png --frame=120`.

## Map

- `src/timeline.ts` — voice-driven scene lengths; `cue()`, `said()`.
- `src/components/ui.tsx` — Phone (spans, segments), Title, Chip, Print, Sky, SceneFade.
- `src/components/layout.tsx` — portrait `Pane` re-fit, phone position.
- `src/fx.tsx` — hype effects kit (bloom flash, sweep reveal, slam, shock, 3D phone, grain).
- `src/beats.ts` — beat grid `bf(k)`.
- `scripts/` — voice, sound, beats, sim (idb), openverse, encode, trim, finalize, contact sheet.
