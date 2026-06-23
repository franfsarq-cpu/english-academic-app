// ===== Pixel click sound =====
let audioCtx = null;
function playClickSound() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

document.addEventListener("click", (event) => {
  if (event.target.closest("button")) playClickSound();
});

// ===== Tabs =====
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ===== Speech Synthesis (leitura em voz alta) =====
const synth = window.speechSynthesis;
let englishVoices = [];

function loadVoices() {
  englishVoices = synth.getVoices().filter(v => v.lang.startsWith("en"));
  const select = document.getElementById("voiceSelect");
  select.innerHTML = "";
  englishVoices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${v.name} (${v.lang})`;
    select.appendChild(opt);
  });
}
loadVoices();
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices;
}

const readerText = document.getElementById("readerText");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const rateSlider = document.getElementById("rateSlider");
const rateValue = document.getElementById("rateValue");

rateSlider.addEventListener("input", () => {
  rateValue.textContent = rateSlider.value;
});

function speakText(text, onEnd, rateOverride) {
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voiceIdx = document.getElementById("voiceSelect").value;
  if (englishVoices[voiceIdx]) utter.voice = englishVoices[voiceIdx];
  utter.rate = rateOverride || parseFloat(rateSlider.value);
  utter.lang = "en-US";
  if (onEnd) utter.onend = onEnd;
  synth.speak(utter);
  return utter;
}

playBtn.addEventListener("click", () => {
  const text = readerText.value.trim();
  if (!text) return;
  speakText(text, () => {
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
  });
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
});

pauseBtn.addEventListener("click", () => {
  if (synth.speaking && !synth.paused) {
    synth.pause();
    pauseBtn.textContent = "▶️ Continuar";
  } else if (synth.paused) {
    synth.resume();
    pauseBtn.textContent = "⏸️ Pausar";
  }
});

stopBtn.addEventListener("click", () => {
  synth.cancel();
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  pauseBtn.textContent = "⏸️ Pausar";
});

// ===== Speak tab (pronúncia) =====
const phraseSelect = document.getElementById("phraseSelect");
const targetPhraseEl = document.getElementById("targetPhrase");
const hearTargetBtn = document.getElementById("hearTargetBtn");
const micBtn = document.getElementById("micBtn");
const speakResult = document.getElementById("speakResult");
const heardTextEl = document.getElementById("heardText");
const matchResultEl = document.getElementById("matchResult");

PHRASES_DATA.forEach((p, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = p.length > 50 ? p.slice(0, 50) + "..." : p;
  phraseSelect.appendChild(opt);
});

function updateTargetPhrase() {
  targetPhraseEl.textContent = PHRASES_DATA[phraseSelect.value];
  speakResult.style.display = "none";
}
phraseSelect.addEventListener("change", updateTargetPhrase);
updateTargetPhrase();

hearTargetBtn.addEventListener("click", () => {
  speakText(targetPhraseEl.textContent);
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const heard = event.results[0][0].transcript;
    heardTextEl.textContent = heard;

    const target = targetPhraseEl.textContent.toLowerCase().replace(/[.,!?]/g, "").trim();
    const said = heard.toLowerCase().replace(/[.,!?]/g, "").trim();

    speakResult.style.display = "block";
    if (said === target) {
      matchResultEl.textContent = "✅ Perfeito!";
      matchResultEl.className = "good";
    } else {
      const targetWords = target.split(" ");
      const saidWords = said.split(" ");
      const matches = targetWords.filter(w => saidWords.includes(w)).length;
      const ratio = matches / targetWords.length;
      if (ratio > 0.7) {
        matchResultEl.textContent = "👍 Muito perto! Continue praticando.";
        matchResultEl.className = "good";
      } else {
        matchResultEl.textContent = "🔁 Tente novamente.";
        matchResultEl.className = "bad";
      }
    }
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
    micBtn.textContent = "🎤 Falar";
  };

  recognition.onerror = () => {
    micBtn.classList.remove("listening");
    micBtn.textContent = "🎤 Falar";
  };

  micBtn.addEventListener("click", () => {
    speakResult.style.display = "none";
    micBtn.classList.add("listening");
    micBtn.textContent = "🎙️ Ouvindo...";
    recognition.start();
  });
} else {
  micBtn.disabled = true;
  micBtn.textContent = "Reconhecimento de voz não suportado neste navegador";
}

// ===== Vocab tab =====
const vocabList = document.getElementById("vocabList");
const vocabSearch = document.getElementById("vocabSearch");

function renderVocab(filter = "") {
  vocabList.innerHTML = "";
  const f = filter.toLowerCase();
  VOCAB_DATA
    .filter(v => v.term.toLowerCase().includes(f) || v.translation.toLowerCase().includes(f))
    .forEach(v => {
      const item = document.createElement("div");
      item.className = "vocab-item";
      item.innerHTML = `
        <div class="vocab-term">${v.term}<small>${v.translation}</small></div>
        <button class="vocab-speak-btn">🔊</button>
      `;
      item.querySelector(".vocab-speak-btn").addEventListener("click", () => speakText(v.term));
      vocabList.appendChild(item);
    });
}
renderVocab();
vocabSearch.addEventListener("input", () => renderVocab(vocabSearch.value));

// ===== XP / Level system (shared by flashcards + cloze) =====
const xpValueEl = document.getElementById("xpValue");
const xpFillEl = document.getElementById("xpFill");
const levelUpBanner = document.getElementById("levelUpBanner");
const levelUpText = document.getElementById("levelUpText");

function getXp() { return getStat(PROGRESS_KEYS.xp); }
function getLevel() { return parseInt(localStorage.getItem(PROGRESS_KEYS.level) || "1", 10); }

function renderXp() {
  const xp = getXp();
  if (xpValueEl) xpValueEl.textContent = xp;
  if (xpFillEl) xpFillEl.style.width = `${xp % 100}%`;
}
renderXp();

function addXp(amount) {
  let xp = Math.max(0, getXp() + amount);
  localStorage.setItem(PROGRESS_KEYS.xp, String(xp));

  const oldLevel = getLevel();
  const newLevel = Math.floor(xp / 100) + 1;
  if (newLevel > oldLevel) {
    localStorage.setItem(PROGRESS_KEYS.level, String(newLevel));
    showLevelUp(newLevel);
  }
  renderXp();
}

function showLevelUp(level) {
  if (!levelUpBanner) return;
  levelUpText.textContent = `Você alcançou o nível ${level}!`;
  levelUpBanner.style.display = "block";
  levelUpBanner.style.animation = "none";
  requestAnimationFrame(() => { levelUpBanner.style.animation = ""; });
  setTimeout(() => { levelUpBanner.style.display = "none"; }, 1800);
}

// ===== Flashcards + Quiz tab (spaced repetition) =====
const studyModeBtn = document.getElementById("studyModeBtn");
const quizModeBtn = document.getElementById("quizModeBtn");
const studyModeEl = document.getElementById("studyMode");
const quizModeEl = document.getElementById("quizMode");

studyModeBtn.addEventListener("click", () => {
  studyModeEl.style.display = "block";
  quizModeEl.style.display = "none";
});
quizModeBtn.addEventListener("click", () => {
  studyModeEl.style.display = "none";
  quizModeEl.style.display = "block";
  newQuizQuestion();
});

// --- Study mode ---
let cardIndex = 0;
const flashcardEl = document.getElementById("flashcard");
const cardTermEl = document.getElementById("cardTerm");
const cardTranslationEl = document.getElementById("cardTranslation");
const cardExampleEl = document.getElementById("cardExample");
const prevCardBtn = document.getElementById("prevCardBtn");
const nextCardBtn = document.getElementById("nextCardBtn");

function renderCard() {
  const card = FLASHCARDS_DATA[cardIndex];
  flashcardEl.classList.remove("flipped");
  cardTermEl.textContent = card.term;
  cardTranslationEl.textContent = card.translation;
  cardExampleEl.textContent = card.example;
}
renderCard();

flashcardEl.addEventListener("click", () => {
  flashcardEl.classList.toggle("flipped");
});

prevCardBtn.addEventListener("click", () => {
  cardIndex = (cardIndex - 1 + FLASHCARDS_DATA.length) % FLASHCARDS_DATA.length;
  renderCard();
});
nextCardBtn.addEventListener("click", () => {
  cardIndex = (cardIndex + 1) % FLASHCARDS_DATA.length;
  renderCard();
});

// --- Quiz mode with spaced repetition ---
const quizTermEl = document.getElementById("quizTerm");
const quizAnswerEl = document.getElementById("quizAnswer");
const quizCheckBtn = document.getElementById("quizCheckBtn");
const quizSkipBtn = document.getElementById("quizSkipBtn");
const quizFeedbackEl = document.getElementById("quizFeedback");

const MASTERY_KEY = "englishFarm_mastery";
const MASTERED_KEY = "englishFarm_masteredTerms";

function getMastery() { return JSON.parse(localStorage.getItem(MASTERY_KEY) || "{}"); }
function setMastery(m) { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)); }
function getMasteredTerms() { return JSON.parse(localStorage.getItem(MASTERED_KEY) || "[]"); }
function setMasteredTerms(arr) { localStorage.setItem(MASTERED_KEY, JSON.stringify(arr)); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let quizQueue = [];
let currentQuizCard = null;

function buildQuizQueue() {
  const mastered = getMasteredTerms();
  const remaining = FLASHCARDS_DATA.filter((c) => !mastered.includes(c.term));
  quizQueue = shuffle(remaining.length ? remaining : FLASHCARDS_DATA);
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function newQuizQuestion() {
  if (quizQueue.length === 0) buildQuizQueue();
  currentQuizCard = quizQueue.shift();
  quizTermEl.textContent = currentQuizCard.term;
  quizAnswerEl.value = "";
  quizFeedbackEl.style.display = "none";
}
buildQuizQueue();

quizCheckBtn.addEventListener("click", () => {
  if (!currentQuizCard) return;
  const userAnswer = normalize(quizAnswerEl.value);
  const correctAnswer = normalize(currentQuizCard.translation);
  quizFeedbackEl.style.display = "block";

  const mastery = getMastery();
  const term = currentQuizCard.term;
  const isCorrect = userAnswer && correctAnswer.includes(userAnswer) && userAnswer.length > 2;

  if (isCorrect) {
    quizFeedbackEl.textContent = "✅ Acertou! +10 XP";
    quizFeedbackEl.className = "result-box good";
    addXp(10);
    mastery[term] = (mastery[term] || 0) + 1;

    if (mastery[term] >= 3) {
      const mastered = getMasteredTerms();
      if (!mastered.includes(term)) {
        mastered.push(term);
        setMasteredTerms(mastered);
        incrementStat(PROGRESS_KEYS.flashcardsMastered);
      }
    } else {
      quizQueue.splice(Math.min(5, quizQueue.length), 0, currentQuizCard);
    }
  } else {
    quizFeedbackEl.textContent = `❌ Quase! A resposta era: "${currentQuizCard.translation}"`;
    quizFeedbackEl.className = "result-box bad";
    addXp(-5);
    mastery[term] = 0;
    quizQueue.splice(Math.min(2, quizQueue.length), 0, currentQuizCard);
  }
  setMastery(mastery);

  setTimeout(newQuizQuestion, isCorrect ? 1200 : 1800);
});

quizSkipBtn.addEventListener("click", newQuizQuestion);

// ===== Academic phrases tab =====
const sectionSelect = document.getElementById("sectionSelect");
const academicPhrasesList = document.getElementById("academicPhrasesList");

Object.keys(ACADEMIC_PHRASES_DATA).forEach((section) => {
  const opt = document.createElement("option");
  opt.value = section;
  opt.textContent = section;
  sectionSelect.appendChild(opt);
});

function renderAcademicPhrases() {
  const section = sectionSelect.value;
  academicPhrasesList.innerHTML = "";
  ACADEMIC_PHRASES_DATA[section].forEach((phrase) => {
    const card = document.createElement("div");
    card.className = "academic-card";
    card.innerHTML = `
      <p class="academic-en">${phrase.en}</p>
      <p class="academic-pt">${phrase.pt}</p>
      <button class="academic-speak-btn">🔊 Ouvir</button>
    `;
    card.querySelector(".academic-speak-btn").addEventListener("click", () => {
      speakText(phrase.en, null, 0.85);
      incrementStat(PROGRESS_KEYS.phrasesHeard);
    });
    academicPhrasesList.appendChild(card);
  });
}
sectionSelect.addEventListener("change", renderAcademicPhrases);
renderAcademicPhrases();

// ===== Cloze tab =====
const clozeSentenceEl = document.getElementById("clozeSentence");
const clozeAnswerEl = document.getElementById("clozeAnswer");
const clozeCheckBtn = document.getElementById("clozeCheckBtn");
const clozeSkipBtn = document.getElementById("clozeSkipBtn");
const clozeFeedbackEl = document.getElementById("clozeFeedback");
let clozeQueue = shuffle(CLOZE_DATA);
let currentCloze = null;

function newClozeQuestion() {
  if (clozeQueue.length === 0) clozeQueue = shuffle(CLOZE_DATA);
  currentCloze = clozeQueue.shift();
  clozeSentenceEl.innerHTML = currentCloze.sentence.replace("___", "<strong>___</strong>");
  clozeAnswerEl.value = "";
  clozeFeedbackEl.style.display = "none";
}
newClozeQuestion();

clozeCheckBtn.addEventListener("click", () => {
  if (!currentCloze) return;
  const userAnswer = normalize(clozeAnswerEl.value);
  const correctAnswer = normalize(currentCloze.blank);
  clozeFeedbackEl.style.display = "block";

  if (userAnswer === correctAnswer) {
    clozeFeedbackEl.textContent = "✅ Correto! +10 XP";
    clozeFeedbackEl.className = "result-box good";
    addXp(10);
    incrementStat(PROGRESS_KEYS.clozeCompleted);
    setTimeout(newClozeQuestion, 1200);
  } else {
    clozeFeedbackEl.textContent = `❌ Errado! A resposta era: "${currentCloze.blank}"`;
    clozeFeedbackEl.className = "result-box bad";
    addXp(-5);
  }
});

clozeSkipBtn.addEventListener("click", newClozeQuestion);

// ===== Progress tab =====
function renderProgressTab() {
  document.getElementById("statLevel").textContent = getLevel();
  document.getElementById("statXp").textContent = getXp();
  document.getElementById("statStreak").textContent = getStat(PROGRESS_KEYS.streak);
  document.getElementById("statBestStreak").textContent = getStat(PROGRESS_KEYS.bestStreak);
  document.getElementById("levelFill").style.width = `${getXp() % 100}%`;
  document.getElementById("statMastered").textContent = getStat(PROGRESS_KEYS.flashcardsMastered);
  document.getElementById("statCloze").textContent = getStat(PROGRESS_KEYS.clozeCompleted);
  document.getElementById("statPhrases").textContent = getStat(PROGRESS_KEYS.phrasesHeard);

  const calendarGrid = document.getElementById("calendarGrid");
  calendarGrid.innerHTML = "";
  const visitDays = getVisitDays();
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const cell = document.createElement("div");
    cell.className = "calendar-day" + (visitDays.includes(dayStr) ? " studied" : "");
    cell.title = dayStr;
    calendarGrid.appendChild(cell);
  }
}

document.querySelector('.tab-btn[data-tab="progress"]').addEventListener("click", renderProgressTab);
renderProgressTab();

// ===== Daily streak registration =====
registerDailyVisit();

// ===== PWA: register service worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
