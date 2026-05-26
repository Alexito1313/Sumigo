const PROGRESS_KEY = 'japones_progress_v1';
const SETTINGS_KEY = 'japones_settings_v1';

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function getCardStats(cardId) {
  const p = loadProgress();
  return p[cardId] || { seen: 0, correct: 0, wrong: 0, lastSeen: 0 };
}

function recordAnswer(cardId, correct) {
  const p = loadProgress();
  const s = p[cardId] || { seen: 0, correct: 0, wrong: 0, lastSeen: 0 };
  s.seen += 1;
  if (correct) s.correct += 1; else s.wrong += 1;
  s.lastSeen = Date.now();
  p[cardId] = s;
  saveProgress(p);
  return s;
}

function failRate(stats) {
  if (!stats || stats.seen === 0) return 0;
  return stats.wrong / stats.seen;
}

function getMostFailed(cards, limit = 50) {
  const p = loadProgress();
  return cards
    .map(c => ({ card: c, stats: p[c._id] }))
    .filter(x => x.stats && x.stats.wrong > 0)
    .sort((a, b) => {
      const fa = failRate(a.stats);
      const fb = failRate(b.stats);
      if (fb !== fa) return fb - fa;
      return b.stats.wrong - a.stats.wrong;
    })
    .slice(0, limit)
    .map(x => x.card);
}

function exportProgress() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: loadProgress(),
    settings: loadSettings()
  };
  return JSON.stringify(data, null, 2);
}

function importProgress(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (!data || typeof data !== 'object') throw new Error('JSON inválido');
  if (data.version && data.progress) {
    saveProgress(data.progress);
    if (data.settings) saveSettings(data.settings);
  } else {
    saveProgress(data);
  }
}

function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { theme: 'auto' };
  } catch { return { theme: 'auto' }; }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function applyTheme(theme) {
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}
