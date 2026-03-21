import { useState, useEffect, useCallback } from "react";
import { LEVELS, GPCS, INITIAL_PROGRESS } from "./data";

// ─── Utility ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadProgress() {
  try {
    const saved = localStorage.getItem("phonicsReefProgress");
    if (!saved) return INITIAL_PROGRESS;
    // Merge saved data with INITIAL_PROGRESS so new levels are never undefined
    const parsed = JSON.parse(saved);
    return { ...INITIAL_PROGRESS, ...parsed };
  } catch {
    return INITIAL_PROGRESS;
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem("phonicsReefProgress", JSON.stringify(progress));
  } catch {}
}

// currentAudio is module-level so we can stop the previous clip before playing a new one
let currentAudio = null;

function speak(text, type = "word") {
  const src = type === "gpc"
    ? `/audio/gpcs/${text}.mp3`
    : `/audio/words/${text}.mp3`;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(src);
  currentAudio.play().catch(() => {
    // Fallback to browser TTS if the file is missing
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-GB";
      utt.rate = 0.85;
      window.speechSynthesis.speak(utt);
    }
  });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a1628 0%, #0d3b6e 30%, #0a5f8a 60%, #0891b2 100%)",
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 16px 32px",
    overflowX: "hidden",
  },
  header: {
    width: "100%",
    maxWidth: 760,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 0 8px",
  },
  logo: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: "#fff",
    textShadow: "0 2px 12px rgba(0,180,255,0.5)",
  },
  logoSub: { fontSize: 13, fontWeight: 600, color: "#7dd3fc", marginTop: -4 },
  main: {
    width: "100%",
    maxWidth: 760,
    flex: 1,
  },
  card: {
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "28px 24px",
    marginBottom: 16,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 28px",
    borderRadius: 16,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 17,
    transition: "transform 0.1s, box-shadow 0.1s",
    userSelect: "none",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #f97316, #ef4444)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  btnCorrect: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(16,185,129,0.5)",
  },
  btnWrong: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
  },
  h1: { fontSize: 26, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.2 },
  h2: { fontSize: 21, fontWeight: 800, margin: "0 0 6px" },
  p: { fontSize: 15, color: "#bae6fd", margin: "0 0 16px", lineHeight: 1.5 },
  tag: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    background: "rgba(255,255,255,0.12)",
    color: "#e0f2fe",
    marginBottom: 12,
  },
  stars: { fontSize: 24, letterSpacing: 2 },
};

// ─── Animated bubbles background ─────────────────────────────────────────────

function Bubbles() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(100vh) scale(0.8); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-120px) scale(1); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .btn-bounce:active { transform: scale(0.95) !important; }
        * { box-sizing: border-box; }
      `}</style>
      {[
        { size: 8,  left: 10, delay: 0,   dur: 8  },
        { size: 5,  left: 20, delay: 1.5, dur: 6  },
        { size: 12, left: 35, delay: 3,   dur: 10 },
        { size: 6,  left: 55, delay: 0.8, dur: 7  },
        { size: 9,  left: 70, delay: 2.2, dur: 9  },
        { size: 4,  left: 82, delay: 4,   dur: 6  },
        { size: 7,  left: 90, delay: 1,   dur: 8  },
      ].map((b, i) => (
        <div key={i} style={{
          position: "absolute", bottom: -80, left: `${b.left}%`,
          width: b.size, height: b.size, borderRadius: "50%",
          border: "1.5px solid rgba(125,211,252,0.5)",
          background: "rgba(125,211,252,0.08)",
          animation: `rise ${b.dur}s ${b.delay}s infinite ease-in`,
        }} />
      ))}
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ count, max = 3 }) {
  return (
    <span style={S.stars}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ opacity: i < count ? 1 : 0.25 }}>⭐</span>
      ))}
    </span>
  );
}

// ─── Screen: Home ─────────────────────────────────────────────────────────────

function HomeScreen({ onStart, audioEnabled, onToggleAudio }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 20 }}>
      <div style={{ fontSize: 96, marginBottom: 8, animation: "float 3s ease-in-out infinite", display: "inline-block" }}>
        🐠
      </div>
      <h1 style={{ ...S.h1, fontSize: 40, marginBottom: 4 }}>Phonics Reef</h1>
      <p style={{ ...S.p, fontSize: 18, marginBottom: 32 }}>
        Dive in and discover the sounds of the sea!
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", marginBottom: 32 }}>
        <button
          className="btn-bounce"
          style={{ ...S.btn, ...S.btnPrimary, fontSize: 20, padding: "18px 48px" }}
          onClick={onStart}
        >
          🌊 Dive In!
        </button>
        <button
          className="btn-bounce"
          style={{ ...S.btn, ...S.btnSecondary, fontSize: 15 }}
          onClick={onToggleAudio}
        >
          {audioEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
        </button>
      </div>
      <div style={{ ...S.card, textAlign: "left", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ ...S.p, margin: 0, fontSize: 14, color: "#e0f2fe" }}>
          🪸 9 ocean zones to explore<br />
          🌟 Earn stars by spotting sounds<br />
          🔓 Unlock deeper waters as you improve<br />
          🎯 5 quick questions per session
        </p>
      </div>
    </div>
  );
}

// ─── Screen: Level Map ────────────────────────────────────────────────────────

function LevelMap({ progress, onSelectLevel, onBack }) {
  const creatures = ["🐚", "🐠", "🌾", "🐡", "🪸", "🌿", "🌊", "⚓", "💎"];

  return (
    <div>
      <button className="btn-bounce" style={{ ...S.btn, ...S.btnSecondary, fontSize: 14, marginBottom: 20 }} onClick={onBack}>
        ← Home
      </button>
      <h2 style={{ ...S.h2, marginBottom: 4 }}>Choose your zone</h2>
      <p style={{ ...S.p, marginBottom: 20 }}>Earn 2+ stars to unlock the next zone!</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LEVELS.map((level, i) => {
          const lvl = progress[level.id];
          const isUnlocked = lvl.unlocked;
          const gpcs = level.gpcs;
          const done = gpcs.filter(id => (lvl.stars[id] || 0) >= 1).length;
          const avgStars = gpcs.length > 0
            ? Math.round(gpcs.reduce((s, id) => s + (lvl.stars[id] || 0), 0) / gpcs.length)
            : 0;

          return (
            <button
              key={level.id}
              className="btn-bounce"
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectLevel(level.id)}
              style={{
                background: isUnlocked ? `linear-gradient(135deg, ${level.color}22, ${level.color}44)` : "rgba(255,255,255,0.04)",
                border: `2px solid ${isUnlocked ? level.color : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20,
                padding: "16px 20px",
                cursor: isUnlocked ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: isUnlocked ? 1 : 0.4,
                fontFamily: "inherit",
                color: "#fff",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontSize: 40 }}>{isUnlocked ? creatures[i] : "🔒"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{level.emoji} Level {level.id} — {level.name}</div>
                <div style={{ fontSize: 13, color: "#bae6fd", marginTop: 2 }}>{level.description}</div>
                {isUnlocked && (
                  <div style={{ marginTop: 6 }}>
                    <Stars count={avgStars} />
                    <span style={{ fontSize: 12, color: "#7dd3fc", marginLeft: 8 }}>
                      {done}/{gpcs.length} patterns tried
                    </span>
                  </div>
                )}
              </div>
              {isUnlocked && <span style={{ fontSize: 24 }}>›</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screen: GPC Picker ───────────────────────────────────────────────────────

const GPC_LABELS = {
  oo_long: "oo (long)", oo_short: "oo (short)",
  ea_long: "ea (long E)", ea_short: "ea (short E)",
  er_stressed: "er (stressed)", er_unstressed: "er (soft)",
  ow_loud: "ow (OW!)", ow_soft: "ow (soft)",
  ie_long: "ie (long I)", ie_short: "ie (long E)",
  ear_near: "ear (near)", ear_bear: "ear (bear)",
  suffix_s: "-s / -es", suffix_ing: "-ing", suffix_ed: "-ed",
  prefix_un: "un-", compound: "compound words", ending_le: "-le",
};

function GpcPicker({ levelId, progress, onSelectGpc, onBack }) {
  const level = LEVELS.find(l => l.id === levelId);
  const lvl = progress[levelId];

  return (
    <div>
      <button className="btn-bounce" style={{ ...S.btn, ...S.btnSecondary, fontSize: 14, marginBottom: 20 }} onClick={onBack}>
        ← Zones
      </button>
      <h2 style={{ ...S.h2, marginBottom: 2 }}>{level.emoji} {level.name}</h2>
      <p style={{ ...S.p, marginBottom: 20 }}>Pick a pattern to practise!</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {level.gpcs.map(gpcId => {
          const gpc = GPCS[gpcId];
          const stars = lvl.stars[gpcId] || 0;
          const label = GPC_LABELS[gpcId] || gpc.grapheme;
          return (
            <button
              key={gpcId}
              className="btn-bounce"
              onClick={() => onSelectGpc(gpcId)}
              style={{
                background: stars > 0 ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.07)",
                border: `2px solid ${stars > 0 ? "#10b981" : "rgba(255,255,255,0.15)"}`,
                borderRadius: 16,
                padding: "14px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#fff",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#bae6fd", marginBottom: 6 }}>{gpc.sound}</div>
              <Stars count={stars} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Game: Missing Grapheme ───────────────────────────────────────────────────

const TOTAL_Q = 5;

function MissingGraphemeGame({ gpcId, audioEnabled, onComplete, onBack }) {
  const gpc = GPCS[gpcId];
  const [questions] = useState(() => shuffle(gpc.words).slice(0, TOTAL_Q));
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const q = questions[qIndex];
  const [shuffledOptions, setShuffledOptions] = useState(() => shuffle([q.answer, ...q.distractors]));

  useEffect(() => {
    setShuffledOptions(shuffle([q.answer, ...q.distractors]));
  }, [qIndex]);

  const handleAnswer = (choice) => {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    const correct = choice === q.answer;
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
    if (audioEnabled) speak(q.word);
  };

  const handleNext = () => {
    if (qIndex + 1 >= TOTAL_Q) {
      setShowResult(true);
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const starsEarned = score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;

  if (showResult) {
    return (
      <ResultScreen
        gpcId={gpcId}
        score={score}
        total={TOTAL_Q}
        stars={starsEarned}
        onPlayAgain={() => {
          setQIndex(0);
          setSelected(null);
          setAnswered(false);
          setScore(0);
          setStreak(0);
          setShowResult(false);
        }}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  const wordParts = q.display.split(/_+/);

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button className="btn-bounce" style={{ ...S.btn, ...S.btnSecondary, fontSize: 13, padding: "8px 16px" }} onClick={onBack}>
          ← Back
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: TOTAL_Q }).map((_, i) => (
            <div key={i} style={{
              width: 28, height: 8, borderRadius: 4,
              background: i < qIndex ? "#10b981" : i === qIndex ? "#f97316" : "rgba(255,255,255,0.2)"
            }} />
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#7dd3fc" }}>{score} ⭐</div>
      </div>

      {/* GPC info card */}
      <div style={{ ...S.card, textAlign: "center", marginBottom: 16 }}>
        <div style={S.tag}>Find the sound</div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>
          {GPC_LABELS[gpcId] || gpc.grapheme}
        </div>
        <div style={{ fontSize: 15, color: "#bae6fd" }}>{gpc.sound} · {gpc.hint}</div>
        {audioEnabled && (
          <button
            className="btn-bounce"
            style={{ ...S.btn, ...S.btnSecondary, fontSize: 13, padding: "8px 16px", marginTop: 12 }}
            onClick={() => speak(GPCS[gpcId].words[0].word, "word")}
          >
            🔊 Hear it
          </button>
        )}
      </div>

      {/* Word with gap */}
      <div style={{ ...S.card, textAlign: "center", marginBottom: 16 }}>
        <p style={{ ...S.p, fontSize: 13, margin: "0 0 12px" }}>
          Question {qIndex + 1} of {TOTAL_Q}
        </p>
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 3, marginBottom: 8, lineHeight: 1.4 }}>
          {wordParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < wordParts.length - 1 && (
                <span style={{
                  color: answered ? (selected === q.answer ? "#10b981" : "#ef4444") : "#f97316",
                  borderBottom: `3px solid ${answered ? (selected === q.answer ? "#10b981" : "#ef4444") : "#f97316"}`,
                  minWidth: 44,
                  display: "inline-block",
                  textAlign: "center",
                  transition: "color 0.2s",
                }}>
                  {answered ? q.answer : "?"}
                </span>
              )}
            </span>
          ))}
        </div>
        {audioEnabled && answered && (
          <button
            className="btn-bounce"
            style={{ ...S.btn, ...S.btnSecondary, fontSize: 13, padding: "8px 16px" }}
            onClick={() => speak(q.word)}
          >
            🔊 {q.word}
          </button>
        )}
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {shuffledOptions.map(opt => {
          let extra = {};
          if (answered) {
            if (opt === q.answer) extra = S.btnCorrect;
            else if (opt === selected) extra = S.btnWrong;
          }
          return (
            <button
              key={opt}
              className="btn-bounce"
              style={{
                ...S.btn,
                ...(answered ? extra : S.btnSecondary),
                width: "100%",
                fontSize: 22,
                fontWeight: 900,
                padding: "18px 8px",
                letterSpacing: 1,
              }}
              onClick={() => handleAnswer(opt)}
              disabled={answered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: selected === q.answer ? "#10b981" : "#f87171" }}>
            {selected === q.answer
              ? streak > 1 ? `🔥 ${streak} in a row!` : "✅ Brilliant!"
              : `❌ It was "${q.answer}" — in "${q.word}"`}
          </div>
          <button className="btn-bounce" style={{ ...S.btn, ...S.btnPrimary }} onClick={handleNext}>
            {qIndex + 1 >= TOTAL_Q ? "See results 🎉" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Result ───────────────────────────────────────────────────────────

function ResultScreen({ gpcId, score, total, stars, onPlayAgain, onComplete, onBack }) {
  const gpc = GPCS[gpcId];
  const label = GPC_LABELS[gpcId] || gpc.grapheme;

  const [emoji, msg, color] = score === 0
    ? ["😢", "Keep trying — you can do it!", "#f87171"]
    : score <= 2
    ? ["🐠", "Good try! Practise makes perfect.", "#fb923c"]
    : score === 3
    ? ["🐡", "Nice work! You're getting there!", "#facc15"]
    : score === 4
    ? ["🐙", "Brilliant! You're a reef explorer!", "#34d399"]
    : ["🎉", "PERFECT! You're a phonics superstar!", "#a78bfa"];

  useEffect(() => { onComplete(gpcId, stars); }, []);

  return (
    <div style={{ textAlign: "center", paddingTop: 20 }}>
      <div style={{ fontSize: 80, marginBottom: 12, animation: "float 2s ease-in-out infinite", display: "inline-block" }}>
        {emoji}
      </div>
      <h2 style={{ ...S.h2, fontSize: 26, color, marginBottom: 8 }}>{msg}</h2>
      <p style={{ ...S.p, marginBottom: 20 }}>
        You got <strong style={{ color: "#fff" }}>{score} out of {total}</strong> for{" "}
        <strong style={{ color: "#fff" }}>{label}</strong>
      </p>
      <div style={{ marginBottom: 28 }}>
        <Stars count={stars} />
        <div style={{ fontSize: 14, color: "#7dd3fc", marginTop: 8 }}>
          {stars === 3 ? "3 stars — nailed it!" : stars === 2 ? "2 stars — great effort!" : stars === 1 ? "1 star — keep going!" : "No stars yet — try again!"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <button className="btn-bounce" style={{ ...S.btn, ...S.btnPrimary, fontSize: 18, padding: "16px 40px" }} onClick={onPlayAgain}>
          🔄 Play again
        </button>
        <button className="btn-bounce" style={{ ...S.btn, ...S.btnSecondary }} onClick={onBack}>
          ← Choose another pattern
        </button>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedGpc, setSelectedGpc] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => { saveProgress(progress); }, [progress]);

  const handleComplete = useCallback((gpcId, stars) => {
    setProgress(prev => {
      const level = LEVELS.find(l => l.gpcs.includes(gpcId));
      if (!level) return prev;
      const lvlId = level.id;
      const updated = { ...prev };
      const lvl = { ...updated[lvlId] };
      lvl.stars = { ...lvl.stars, [gpcId]: Math.max(lvl.stars[gpcId] || 0, stars) };
      updated[lvlId] = lvl;

      // Unlock next level if avg stars >= 2
      const avg = level.gpcs.reduce((s, id) => s + (lvl.stars[id] || 0), 0) / level.gpcs.length;
      if (avg >= 2 && lvlId < LEVELS.length) {
        updated[lvlId + 1] = { ...updated[lvlId + 1], unlocked: true };
      }
      return updated;
    });
  }, []);

  return (
    <div style={S.app}>
      <Bubbles />

      {/* Header */}
      <div style={{ ...S.header, position: "relative", zIndex: 1 }}>
        <div>
          <div style={S.logo}>🐠 Phonics Reef</div>
          <div style={S.logoSub}>Year 1 Phonics Explorer</div>
        </div>
        <button
          className="btn-bounce"
          style={{ ...S.btn, ...S.btnSecondary, fontSize: 18, padding: "8px 14px" }}
          onClick={() => setAudioEnabled(a => !a)}
          title={audioEnabled ? "Turn sound off" : "Turn sound on"}
        >
          {audioEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      {/* Main content */}
      <div style={{ ...S.main, position: "relative", zIndex: 1 }}>
        {screen === "home" && (
          <HomeScreen
            onStart={() => setScreen("levels")}
            audioEnabled={audioEnabled}
            onToggleAudio={() => setAudioEnabled(a => !a)}
          />
        )}
        {screen === "levels" && (
          <LevelMap
            progress={progress}
            onSelectLevel={id => { setSelectedLevel(id); setScreen("gpcs"); }}
            onBack={() => setScreen("home")}
          />
        )}
        {screen === "gpcs" && selectedLevel && (
          <GpcPicker
            levelId={selectedLevel}
            progress={progress}
            onSelectGpc={id => { setSelectedGpc(id); setScreen("game"); }}
            onBack={() => setScreen("levels")}
          />
        )}
        {screen === "game" && selectedGpc && (
          <MissingGraphemeGame
            key={selectedGpc}
            gpcId={selectedGpc}
            audioEnabled={audioEnabled}
            onComplete={handleComplete}
            onBack={() => setScreen("gpcs")}
          />
        )}
      </div>
    </div>
  );
}
