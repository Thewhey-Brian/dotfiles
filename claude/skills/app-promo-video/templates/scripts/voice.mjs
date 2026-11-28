// Generates the narration with ElevenLabs, one file per scene, plus the word
// timings the captions follow.
//
//   ELEVENLABS_API_KEY=… node scripts/voice.mjs            all scenes
//   node scripts/voice.mjs looks toolbox                   just these
//
// The key and an optional ELEVENLABS_VOICE_ID are read from video/.env when
// they are not in the environment. Output: public/voice/<id>.mp3 and
// public/voice/<id>.json ({ duration, words: [{ text, start, end }] }).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { SCRIPTS, VOICE_DIR } from "../src/script.ts";

const root = path.resolve(import.meta.dirname, "..");
// The key lives in the repo's .env.local (next to the site's other keys);
// video/.env can override it.
for (const envFile of [path.join(root, ".env"), path.join(root, "..", ".env.local")]) {
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("ELEVENLABS_API_KEY is not set (environment or video/.env).");
  process.exit(1);
}
// `--social` voices the social cut. It reads in "Hale – Smooth, Confident and
// Persuasive", the most-added English advertising voice in ElevenLabs'
// library, a touch brisker; the full film keeps its calm narrator.
const variant = process.argv.includes("--social") ? "social" : "full";
const LINES = SCRIPTS[variant];
const VOICE =
  process.env.ELEVENLABS_VOICE_ID ||
  (variant === "social" ? "dXtC3XhB9GtPusIpNtQx" : "21m00Tcm4TlvDq8ikWAM");
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const SPEED = variant === "social" ? 1.15 : 1.0;

const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--")));
const out = path.join(root, "public", VOICE_DIR[variant]);
fs.mkdirSync(out, { recursive: true });

// Characters → words, keeping each word's first start and last end.
function words(alignment) {
  const list = [];
  let cur = null;
  alignment.characters.forEach((ch, i) => {
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];
    if (/\s/.test(ch)) {
      if (cur) list.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { text: "", start, end };
    cur.text += ch;
    cur.end = end;
  });
  if (cur) list.push(cur);
  return list;
}

for (const [i, line] of LINES.entries()) {
  if (only.size && !only.has(line.id)) continue;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({
        text: line.text,
        model_id: MODEL,
        // Neighbouring lines, so each file is read as part of one narration
        // rather than eleven separate announcements.
        previous_text: LINES[i - 1]?.text,
        next_text: LINES[i + 1]?.text,
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, speed: SPEED },
      }),
    },
  );
  if (!res.ok) {
    console.error(`${line.id}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const body = await res.json();
  const mp3 = path.join(out, `${line.id}.mp3`);
  fs.writeFileSync(mp3, Buffer.from(body.audio_base64, "base64"));
  const duration = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3])
      .toString()
      .trim(),
  );
  fs.writeFileSync(
    path.join(out, `${line.id}.json`),
    JSON.stringify({ duration, words: words(body.alignment) }, null, 1),
  );
  console.log(`${line.id}: ${duration.toFixed(2)}s`);
}
