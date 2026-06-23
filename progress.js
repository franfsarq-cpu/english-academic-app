// ===== Progress tracking: streak, calendar, stats, XP/level =====
const PROGRESS_KEYS = {
  visits: "englishFarm_visitDays",
  streak: "englishFarm_streak",
  bestStreak: "englishFarm_bestStreak",
  xp: "englishFarm_xp",
  level: "englishFarm_level",
  flashcardsMastered: "englishFarm_flashcardsMastered",
  clozeCompleted: "englishFarm_clozeCompleted",
  phrasesHeard: "englishFarm_phrasesHeard",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getVisitDays() {
  return JSON.parse(localStorage.getItem(PROGRESS_KEYS.visits) || "[]");
}

function registerDailyVisit() {
  const days = getVisitDays();
  const today = todayStr();
  if (days.includes(today)) return;

  days.push(today);
  localStorage.setItem(PROGRESS_KEYS.visits, JSON.stringify(days));

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = parseInt(localStorage.getItem(PROGRESS_KEYS.streak) || "0", 10);
  streak = days.includes(yesterday) ? streak + 1 : 1;
  localStorage.setItem(PROGRESS_KEYS.streak, String(streak));

  const best = parseInt(localStorage.getItem(PROGRESS_KEYS.bestStreak) || "0", 10);
  if (streak > best) localStorage.setItem(PROGRESS_KEYS.bestStreak, String(streak));
}

function incrementStat(key) {
  const value = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(value));
  return value;
}

function getStat(key) {
  return parseInt(localStorage.getItem(key) || "0", 10);
}
