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

function speakText(text, onEnd) {
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voiceIdx = document.getElementById("voiceSelect").value;
  if (englishVoices[voiceIdx]) utter.voice = englishVoices[voiceIdx];
  utter.rate = parseFloat(rateSlider.value);
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

// ===== Flashcards + Quiz tab =====
const XP_KEY = "englishFarm_xp";
let xp = parseInt(localStorage.getItem(XP_KEY) || "0", 10);

const xpValueEl = document.getElementById("xpValue");
const xpFillEl = document.getElementById("xpFill");

function renderXp() {
  xpValueEl.textContent = xp;
  xpFillEl.style.width = `${xp % 100}%`;
}
renderXp();

function addXp(amount) {
  xp += amount;
  localStorage.setItem(XP_KEY, String(xp));
  renderXp();
}

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

// --- Quiz mode ---
const quizTermEl = document.getElementById("quizTerm");
const quizAnswerEl = document.getElementById("quizAnswer");
const quizCheckBtn = document.getElementById("quizCheckBtn");
const quizSkipBtn = document.getElementById("quizSkipBtn");
const quizFeedbackEl = document.getElementById("quizFeedback");
let currentQuizCard = null;

function newQuizQuestion() {
  currentQuizCard = FLASHCARDS_DATA[Math.floor(Math.random() * FLASHCARDS_DATA.length)];
  quizTermEl.textContent = currentQuizCard.term;
  quizAnswerEl.value = "";
  quizFeedbackEl.style.display = "none";
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

quizCheckBtn.addEventListener("click", () => {
  if (!currentQuizCard) return;
  const userAnswer = normalize(quizAnswerEl.value);
  const correctAnswer = normalize(currentQuizCard.translation);
  quizFeedbackEl.style.display = "block";

  if (userAnswer && correctAnswer.includes(userAnswer) && userAnswer.length > 2) {
    quizFeedbackEl.textContent = "✅ Acertou! +10 XP";
    quizFeedbackEl.className = "result-box good";
    addXp(10);
    setTimeout(newQuizQuestion, 1200);
  } else {
    quizFeedbackEl.textContent = `❌ Quase! A resposta era: "${currentQuizCard.translation}"`;
    quizFeedbackEl.className = "result-box bad";
  }
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
    card.querySelector(".academic-speak-btn").addEventListener("click", () => speakText(phrase.en));
    academicPhrasesList.appendChild(card);
  });
}
sectionSelect.addEventListener("change", renderAcademicPhrases);
renderAcademicPhrases();

// ===== PWA: register service worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
