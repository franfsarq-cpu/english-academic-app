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

// ===== PWA: register service worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
