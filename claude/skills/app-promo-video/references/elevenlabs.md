# ElevenLabs: voice, sound effects, music

All three work with one API key (`xi-api-key`). A restricted key may 401 on
`/v1/user/subscription` yet work for TTS/SFX/music — test the endpoint you need.

## Choosing a voice

- Query the library for popularity instead of guessing:
  `GET /v1/shared-voices?page_size=8&use_cases=advertisement&sort=usage_character_count_1y`
  (also `sort=trending`, `category=professional`). Rank by `cloned_by_count`.
- Proven picks: **Hale – Smooth, Confident and Persuasive**
  (`dXtC3XhB9GtPusIpNtQx`, the most-added English ad voice) for ads/social;
  a calm premade (e.g. Rachel `21m00Tcm4TlvDq8ikWAM`, George, Sarah) for a
  long explainer. Library voices work directly by id for TTS.
- Settings: explainer `stability 0.5, style 0.15, speed 1.0`; social ad
  `speed 1.15`; hype `stability 0.32, style 0.55, speed 1.05`.

## TTS with timestamps (drives the whole edit)

`POST /v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128`
with `model_id: eleven_multilingual_v2`, `previous_text`/`next_text` (so lines
read as one narration). Returns `audio_base64` + character alignment →
`scripts/voice.mjs` folds characters into word `{text,start,end}`.

- Commas in lists produce ~1.5 s pauses — write lists as phrases.
- "…" produces long pauses — remove it if timing is tight.
- For per-beat phrases, generate each separately and trim silence:
  `ffmpeg -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse"`
  (`scripts/trim-voice.sh`).

## Sound effects

`POST /v1/sound-generation` `{text, duration_seconds (≥0.5), prompt_influence 0.6–0.7}`.
Useful set: soft airy whoosh (scene change), UI tap, confirmation pop, gentle
shimmer (reveals), photo print sliding (cards), camera shutter (guides),
cinematic impact (drops), fast whip, typing, chat bubble, riser.
Keep reveal sounds soft (shimmer) — glitch sounds read as cheap.

## Music

`POST /v1/music` `{prompt, music_length_ms}` (≤300000). Describe tempo,
instrumentation, structure ("riser for 3 s, drop at 3.5 s, breakdown at 20 s,
final hit and clean stop"), "no vocals". The generated structure won't match
the prompt exactly — **measure it** (`scripts/beats.py`) and edit to what's there.
Size the bed to the narration + ~4 s.

## Mix and loudness

- Duck the bed while speaking (see `bedVolume`/`musicVolume`).
- After rendering, normalise audio only: `scripts/finalize.sh in out -16`
  (YouTube/web) or `-14` (Reels/TikTok). Check with
  `ffmpeg -af ebur128=framelog=quiet -f null -`.
