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

// ── Phoneme pronunciation map ─────────────────────────────────────────────────
// Maps each GPC id to the text Alice should speak to produce the correct sound.
// Using real English words/syllables so TTS doesn't read letters individually.

const PHONEME_SPOKEN_AS = {
  ff:             "f",        // /f/  — as in off
  ll:             "l",        // /l/  — as in bell
  ss:             "s",        // /s/  — as in miss
  zz:             "z",        // /z/  — as in buzz
  ck:             "k",        // /k/  — as in back
  nk:             "nk",       // /ŋk/ — as in bank
  ai:             "ay",       // /eɪ/ — as in rain
  ee:             "ee",       // /iː/ — as in tree
  oa:             "oh",       // /əʊ/ — as in boat
  igh:            "eye",      // /aɪ/ — as in night
  oo_long:        "oo",       // /uː/ — as in moon
  oo_short:       "oo",       // /ʊ/  — as in book (shorter)
  ar:             "ar",       // /ɑː/ — as in car
  or:             "or",       // /ɔː/ — as in for
  ur:             "er",       // /ɜː/ — as in turn
  ea_long:        "ee",       // /iː/ — as in sea
  ea_short:       "eh",       // /ɛ/  — as in head
  er_stressed:    "er",       // /ɜː/ — as in her
  er_unstressed:  "er",       // /ə/  — as in butter
  ow_loud:        "ow",       // /aʊ/ — as in now
  ow_soft:        "oh",       // /əʊ/ — as in snow
  ie_long:        "eye",      // /aɪ/ — as in pie
  ie_short:       "ee",       // /iː/ — as in chief
  aw:             "aw",       // /ɔː/ — as in saw
  au:             "aw",       // /ɔː/ — as in author
  air:            "air",      // /ɛː/ — as in fair
  ear_near:       "ear",      // /ɪə/ — as in near
  ear_bear:       "air",      // /ɛː/ — as in bear
  are:            "air",      // /ɛː/ — as in care
  ue:             "oo",       // /uː/ — as in blue
  ew:             "oo",       // /uː/ — as in new
  oe:             "oh",       // /əʊ/ — as in toe
  tch:            "ch",       // /tʃ/ — as in catch
  dge:            "j",        // /dʒ/ — as in edge
  kn:             "n",        // /n/  — silent k, as in knee
  wr:             "r",        // /r/  — silent w, as in write
  ph:             "f",        // /f/  — as in phone
  wh:             "w",        // /w/  — as in when
  suffix_s:       "s",        // /s/  — as in cats
  suffix_ing:     "ing",      // /ɪŋ/ — as in jumping
  suffix_ed:      "ed",       // /d/  — as in jumped
  prefix_un:      "un",       // /ʌn/ — as in undo
  compound:       "compound", // descriptive
  ending_le:      "ul",       // /l/  — as in little
};

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
  const spoken = PHONEME_SPOKEN_AS[id] ?? grapheme;
  await generate(id, join(GPCS_DIR, `${id}.mp3`), spoken);
}

console.log("\n✨ Done! All audio saved to public/audio/\n");
