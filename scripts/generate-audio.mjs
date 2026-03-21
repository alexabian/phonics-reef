// generate-audio.mjs
// Generates MP3 audio files for all words and GPC sounds in Phonics Reef
// Uses ElevenLabs TTS — Alice (British educator, voice ID: Xb7hH8MSUJpSbSDYk0k2)
// Run: node scripts/generate-audio.mjs

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GPCS } from "../src/data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_KEY = "262123fd45c655cab07a57b2e9483bbf7c4ddf812e809662d9c6ddcb22635abe";
const VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"; // Alice — British, Clear, Educational

const WORDS_DIR = join(__dirname, "../public/audio/words");
const GPCS_DIR  = join(__dirname, "../public/audio/gpcs");

mkdirSync(WORDS_DIR, { recursive: true });
mkdirSync(GPCS_DIR,  { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function tts(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.80,
        style: 0,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generate(label, outPath, text) {
  if (existsSync(outPath)) {
    console.log(`  ⏭  skip   ${label}`);
    return;
  }
  try {
    const buf = await tts(text);
    writeFileSync(outPath, buf);
    console.log(`  ✅ saved  ${label}`);
  } catch (e) {
    console.error(`  ❌ error  ${label}: ${e.message}`);
  }
  await sleep(350); // stay within rate limits
}

// ── Collect everything we need ───────────────────────────────────────────────

const wordSet  = new Set();
const gpcList  = []; // { id, grapheme, hint }

for (const [id, gpc] of Object.entries(GPCS)) {
  for (const w of gpc.words) wordSet.add(w.word);
  gpcList.push({ id, grapheme: gpc.grapheme, hint: gpc.hint });
}

const words = [...wordSet].sort();
console.log(`\n🐠 Phonics Reef — Audio Generator`);
console.log(`   ${words.length} words + ${gpcList.length} GPC sounds = ${words.length + gpcList.length} clips\n`);

// ── Generate word clips ───────────────────────────────────────────────────────

console.log("── Words ──────────────────────────────────────────");
let i = 0;
for (const word of words) {
  process.stdout.write(`[${String(++i).padStart(3)}/${words.length}] `);
  await generate(word, join(WORDS_DIR, `${word}.mp3`), word);
}

// ── Generate GPC phoneme clips ────────────────────────────────────────────────

console.log("\n── GPC sounds ─────────────────────────────────────");
let j = 0;
for (const { id, grapheme, hint } of gpcList) {
  process.stdout.write(`[${String(++j).padStart(3)}/${gpcList.length}] `);
  const spoken = grapheme;
  await generate(id, join(GPCS_DIR, `${id}.mp3`), spoken);
}

console.log("\n✨ Done! All audio saved to public/audio/\n");
