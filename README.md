# Phonics Reef

React + Vite app for the Phonics Reef game.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Audio generation

The audio generation script uses ElevenLabs and now requires secrets to come from the environment rather than source control.

1. Copy the example file if you want a local reference:

```bash
cp .env.example .env.local
```

2. Export your key before running the script:

```bash
export ELEVENLABS_API_KEY="your_key_here"
# optional override
export ELEVENLABS_VOICE_ID="Xb7hH8MSUJpSbSDYk0k2"
node scripts/generate-audio.mjs
```

Do **not** commit real `.env` files or credentials.
