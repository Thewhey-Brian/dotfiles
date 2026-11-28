# The hype cut (portrait, ~45 s, cut to the beat)

## 1. Music first, then measure it

Generate the track (ElevenLabs music, ~120–125 BPM, with a build, a drop, a
breakdown, a final hit). Then:

```sh
python3 scripts/beats.py public/music/hype.mp3     # tempo, beat grid, energy map, big onsets
```
The tracker may lose the beat in quiet parts — fit a regular grid from the
steady median gap (`B0 + k * PERIOD`) and read the *real* drop / breakdown /
final hit off the energy map. In `src/beats.ts` set `B0`, `PERIOD`; `bf(k)`
gives the frame of beat k (fractions for off-beats).

## 2. Structure (by beat numbers — adapt to the measured track)

| Beats | Section | Idea |
|---|---|---|
| 0 → drop | build | photos strobing per beat (two per beat just before the drop) under a line of slammed words |
| drop | the mark | bloom + shockwave + logo; voice says the name |
| +4 … | feature hits | each feature 4–8 beats: one headline word per 2 beats, the product proving it (real footage/renders) |
| breakdown | breath | near-black, 2–3 slow words ("Now… watch it") |
| second drop | the peak | before → after reveals, one per 2 beats, the effect named on each |
| final hit | end card | logo, name reveal, tagline, badge + QR, hold ≥5 s |

## 3. Voice

One short phrase per beat that matters, generated separately (see
elevenlabs.md), silence-trimmed, placed by a `VO` list of `{name, k, len}`.
Music ducks under each (`musicVolume`). Phrases ≤ the gap to the next cue
(2 beats ≈ 0.97 s at 124 BPM).

## 4. Effects — elegant, not loud (`src/fx.tsx`)

- `Flash` = radial gold **bloom** from centre (edges stay dark). Never full-frame
  white — on a dark stage it washes the frame milky grey.
- `LitImg` = cut arrives slightly bright and soft, settles in 10 frames (no RGB split).
- `SweepReveal` = before → after along a slanted edge of warm light (12 frames).
- `Slam` = words settle from 1.35× with light blur; out = drift + fade.
- `Shock` ring on the 2–3 biggest hits only; `shake()` amplitude ≤7 px.
- `Stage` night backdrop with drifting warm/cool light; `Finish` grain + vignette.
- Sounds: impact on drops, soft whip on section changes, shimmer on reveals.

## 5. Pitfalls

- A section's `L(k)` is local to its Sequence; phones inside get the scene's
  full `frames`.
- A slammed word still exiting ghosts behind the next — exit it ≥8 frames
  before the next slam.
- Low-res photos (≤1000 px) go soft full-bleed; use large cards (~900–1000 px
  wide) instead of full screen.
