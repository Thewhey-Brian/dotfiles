// Sound effects and music beds from ElevenLabs.
//
//   node scripts/sound.mjs                  sfx + the film's bed (sized to its narration)
//   node scripts/sound.mjs --social         the social cut's brighter bed
//   node scripts/sound.mjs --hype 44        a beat-driven hype track of 44 s (then run beats.py)
//   add --force to regenerate what exists
//
// Reads ELEVENLABS_API_KEY from video/.env, then ../.env.local.
// Edit SFX and the PROMPTS below for the product.

import fs from "node:fs";
import path from "node:path";
import { SCRIPTS, VOICE_DIR } from "../src/script.ts";

const PRODUCT = "a premium mobile app"; // used in the music prompts

const SFX = {
  whoosh: ["Soft, airy cinematic whoosh for a scene transition, gentle and clean, no impact", 1.3],
  tap: ["Subtle soft UI tap, a clean glassy click", 0.5],
  pop: ["Soft satisfying confirmation pop, warm and rounded", 0.6],
  shimmer: ["Gentle magical shimmer, soft sparkle reveal, airy", 1.6],
  shutter: ["Soft modern camera shutter click", 0.6],
  impact: ["Massive cinematic trailer impact boom with deep sub drop and short reverb tail", 2.2],
  whip: ["Very fast sharp whip swoosh transition", 0.5],
  typing: ["Fast crisp keyboard typing burst on a phone, soft clicks", 1.4],
  bubble: ["Bright soft chat message bubble pop", 0.5],
  riser: ["Tense cinematic riser building up, rising white noise and pitch", 3.5],
};

const PROMPTS = {
  full:
    `Elegant, warm, modern instrumental for ${PRODUCT} film. Soft felt piano, airy pads, a gentle pulse of ` +
    "light percussion that slowly builds, optimistic and calm, spacious, no vocals. Ends with a soft resolved chord.",
  social:
    `Upbeat, bright, modern instrumental for a one-minute social ad for ${PRODUCT}. Crisp light drums at about ` +
    "110 BPM, warm plucked synths and piano, confident and uplifting, no vocals. Builds gently, ends on a clean hit.",
  hype:
    `High-energy cinematic trailer-pop instrumental for a vertical social ad for ${PRODUCT}, 124 BPM, four on the ` +
    "floor. Opens with 3 seconds of rising tension, a huge drop with punchy kick, deep sub bass and bright synth " +
    "stabs, a short breakdown two thirds in, a euphoric climax, then one massive final hit and a clean stop. No vocals.",
};

const root = path.resolve(import.meta.dirname, "..");
for (const f of [path.join(root, ".env"), path.join(root, "..", ".env.local")]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("ELEVENLABS_API_KEY is not set.");
  process.exit(1);
}
const args = process.argv.slice(2);
const force = args.includes("--force");
// A fresh template ships tiny silent placeholders (sfx ~2 KB, music ~4 KB);
// files that small are replaced, anything real is kept unless --force.
// (A real 0.5 s effect is ~8 KB, a real bed hundreds of KB.)
const needed = (f, min) => force || !fs.existsSync(f) || fs.statSync(f).size < min;

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

fs.mkdirSync(path.join(root, "public", "sfx"), { recursive: true });
fs.mkdirSync(path.join(root, "public", "music"), { recursive: true });
for (const [name, [text, duration_seconds]] of Object.entries(SFX)) {
  const out = path.join(root, "public", "sfx", `${name}.mp3`);
  if (!needed(out, 4000)) continue;
  fs.writeFileSync(out, await post("https://api.elevenlabs.io/v1/sound-generation", { text, duration_seconds, prompt_influence: 0.65 }));
  console.log(`sfx ${name}`);
}

let variant = "full";
let seconds = 0;
if (args.includes("--hype")) {
  variant = "hype";
  seconds = Number(args[args.indexOf("--hype") + 1]) || 44;
} else {
  variant = args.includes("--social") ? "social" : "full";
  for (const line of SCRIPTS[variant]) {
    const f = path.join(root, "public", VOICE_DIR[variant], `${line.id}.json`);
    const dur = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).duration : 10;
    seconds += 0.35 + dur + line.tail;
  }
  seconds += 4;
}
const bed = path.join(root, "public", "music", { full: "bed.mp3", social: "bed-social.mp3", hype: "hype.mp3" }[variant]);
if (needed(bed, 20000)) {
  fs.writeFileSync(bed, await post("https://api.elevenlabs.io/v1/music", { prompt: PROMPTS[variant], music_length_ms: Math.min(300000, Math.ceil(seconds * 1000)) }));
  console.log(`music ${variant} ${Math.round(seconds)}s → ${path.relative(root, bed)}`);
}
