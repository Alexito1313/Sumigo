/* ============================================================
   日本語 — Estudio. Controlador de UI.
   ============================================================ */

const STATE = {
  view: 'home',                       // home | study | stats | settings
  content: 'kanji',                   // kanji | vocab | both
  blocks: { kanji: [], vocab: [] },
  mode: 'flash',                      // flash | test | review
  cards: [],
  index: 0,
  flipped: false,
  testQuestion: null,                 // { options, correctIdx, answered, selected }
  sessionStats: { right: 0, wrong: 0 }
};

const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      node.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick(arr, n) {
  return shuffle(arr.slice()).slice(0, n);
}

function showToast(msg) {
  const t = el('div', { class: 'toast', text: msg });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function setActiveNav() {
  $$('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === STATE.view);
  });
}

/* ============================================================
   RENDER
   ============================================================ */

function render() {
  const app = $('#app');
  app.innerHTML = '';
  setActiveNav();
  const screen = el('div', { class: 'screen' });
  if (STATE.view === 'home')         renderHome(screen);
  else if (STATE.view === 'study')   renderStudy(screen);
  else if (STATE.view === 'stats')   renderStats(screen);
  else if (STATE.view === 'settings')renderSettings(screen);
  app.appendChild(screen);
}

/* ----- Home / selector ----- */

function renderHome(root) {
  root.appendChild(el('h1', { class: 'h1', text: '¿Qué quieres estudiar?' }));

  // Contenido
  const sec1 = el('div', { class: 'section' });
  sec1.appendChild(el('h2', { class: 'section-title', text: 'Contenido' }));
  const c1 = el('div', { class: 'chip-group' });
  [['kanji', 'Kanji'], ['vocab', 'Vocabulario'], ['both', 'Ambos']].forEach(([id, label]) => {
    c1.appendChild(el('button', {
      class: 'chip' + (STATE.content === id ? ' active' : ''),
      onclick: () => { STATE.content = id; render(); }
    }, label));
  });
  sec1.appendChild(c1);
  root.appendChild(sec1);

  const inclK = STATE.content === 'kanji' || STATE.content === 'both';
  const inclV = STATE.content === 'vocab' || STATE.content === 'both';

  if (inclK) root.appendChild(blockSection('Bloques de Kanji (J3)', 'kanji'));
  if (inclV) root.appendChild(blockSection('Lecciones de Vocabulario (MNN)', 'vocab'));

  // Modo
  const sec3 = el('div', { class: 'section' });
  sec3.appendChild(el('h2', { class: 'section-title', text: 'Modo' }));
  const c3 = el('div', { class: 'chip-group' });
  [
    ['flash', 'Flashcards'],
    ['test',  'Test'],
    ['review','Repaso (peores)']
  ].forEach(([m, label]) => {
    c3.appendChild(el('button', {
      class: 'chip' + (STATE.mode === m ? ' active' : ''),
      onclick: () => { STATE.mode = m; render(); }
    }, label));
  });
  sec3.appendChild(c3);
  root.appendChild(sec3);

  // Empezar
  const totalSel = (inclK ? STATE.blocks.kanji.length : 0) + (inclV ? STATE.blocks.vocab.length : 0);
  root.appendChild(el('button', {
    class: 'btn btn-block',
    onclick: startStudy,
    disabled: totalSel === 0 ? 'disabled' : null
  }, totalSel === 0 ? 'Selecciona al menos un bloque' : 'Empezar'));
}

function blockSection(title, type) {
  const sec = el('div', { class: 'section' });
  sec.appendChild(el('h2', { class: 'section-title', text: title }));
  const chips = el('div', { class: 'chip-group' });
  DATA.available[type].forEach(id => {
    const active = STATE.blocks[type].includes(id);
    chips.appendChild(el('button', {
      class: 'chip' + (active ? ' active' : ''),
      onclick: () => { toggleBlock(type, id); render(); }
    }, id));
  });
  const allSel = STATE.blocks[type].length === DATA.available[type].length && DATA.available[type].length > 0;
  chips.appendChild(el('button', {
    class: 'chip ghost',
    onclick: () => {
      STATE.blocks[type] = allSel ? [] : [...DATA.available[type]];
      render();
    }
  }, allSel ? 'Ninguno' : 'Todos'));
  sec.appendChild(chips);
  return sec;
}

function toggleBlock(type, id) {
  const arr = STATE.blocks[type];
  const i = arr.indexOf(id);
  if (i === -1) arr.push(id);
  else arr.splice(i, 1);
}

/* ----- Iniciar sesión de estudio ----- */

async function startStudy() {
  const sel = {};
  if (STATE.content === 'kanji' || STATE.content === 'both') sel.kanji = STATE.blocks.kanji;
  if (STATE.content === 'vocab' || STATE.content === 'both') sel.vocab = STATE.blocks.vocab;
  let cards = [];
  try {
    cards = await loadSelection(sel);
  } catch (e) {
    showToast('Error cargando los datos');
    return;
  }
  if (STATE.mode === 'review') {
    cards = getMostFailed(cards);
    if (!cards.length) { showToast('Aún no tienes cartas falladas en estos bloques'); return; }
  }
  if (!cards.length) { showToast('No hay cartas en la selección'); return; }
  STATE.cards = shuffle(cards.slice());
  STATE.index = 0;
  STATE.flipped = false;
  STATE.sessionStats = { right: 0, wrong: 0 };
  if (STATE.mode === 'test') prepareTestQuestion();
  STATE.view = 'study';
  render();
}

function prepareTestQuestion() {
  const card = STATE.cards[STATE.index];
  const sameType = STATE.cards.filter(c => c.type === card.type && c._id !== card._id);
  let distractors = pick(sameType, 3);
  if (distractors.length < 3) {
    const used = new Set(distractors.map(c => c._id));
    used.add(card._id);
    const others = STATE.cards.filter(c => !used.has(c._id));
    distractors = distractors.concat(pick(others, 3 - distractors.length));
  }
  const options = shuffle([card, ...distractors]);
  STATE.testQuestion = {
    options,
    correctIdx: options.findIndex(o => o._id === card._id),
    answered: false,
    selected: -1
  };
}

/* ----- Vista de estudio ----- */

function renderStudy(root) {
  if (STATE.index >= STATE.cards.length) return renderFinished(root);

  const total = STATE.cards.length;
  const card = STATE.cards[STATE.index];

  const progress = el('div', { class: 'progress-bar-container' });
  progress.appendChild(el('span', { text: `${STATE.index + 1}/${total}` }));
  const bar = el('div', { class: 'progress-bar' });
  bar.appendChild(el('div', {
    class: 'progress-bar-fill',
    style: `width: ${(STATE.index / total) * 100}%`
  }));
  progress.appendChild(bar);
  progress.appendChild(el('span', { text: `✓ ${STATE.sessionStats.right} · ✗ ${STATE.sessionStats.wrong}` }));
  root.appendChild(progress);

  if (STATE.mode === 'test') renderTestCard(root, card);
  else                       renderFlashcard(root, card);

  root.appendChild(el('div', { style: 'margin-top: 1.5rem; text-align: center;' }, [
    el('button', { class: 'btn btn-ghost', onclick: () => { STATE.view = 'home'; render(); } }, 'Salir')
  ]));
}

function renderFlashcard(root, card) {
  const cardEl = el('div', {
    class: 'card',
    onclick: flipCard
  });
  cardEl.appendChild(el('span', { class: 'block-badge', text: card._block }));
  cardEl.appendChild(el('span', { class: 'type-badge', text: TYPE_LABELS[card.type] || card.type }));

  const inner = el('div', { class: 'card-inner' });
  if (!STATE.flipped) {
    inner.appendChild(el('div', { class: card.jp.length <= 3 ? 'jp-big' : 'jp-medium', text: card.jp }));
    cardEl.appendChild(el('div', { class: 'hint', text: 'toca para girar · espacio' }));
  } else {
    inner.appendChild(el('div', { class: 'jp-medium', text: card.jp }));
    if (card.read) inner.appendChild(el('div', { class: 'reading', text: card.read }));
    inner.appendChild(el('div', { class: 'meaning', text: card.mean }));
    const extras = buildExtraSection(card);
    if (extras) inner.appendChild(extras);
  }
  cardEl.appendChild(inner);
  root.appendChild(el('div', { class: 'card-stage' }, [cardEl]));

  if (!STATE.flipped) {
    root.appendChild(el('div', { class: 'actions single' }, [
      el('button', { class: 'btn btn-ghost btn-block', onclick: flipCard }, 'Girar')
    ]));
  } else {
    root.appendChild(el('div', { class: 'actions' }, [
      el('button', { class: 'btn btn-success', onclick: () => answerFlash(true) }, 'Lo sabía ✓'),
      el('button', { class: 'btn',             onclick: () => answerFlash(false) }, 'Lo fallé ✗')
    ]));
  }
}

// Convierte el string `extra` (ej. "住所(じゅうしょ) — dirección · 住民(じゅうみん) — habitante")
// en un bloque con cada ejemplo en una línea, separando por "·".
function buildExtraSection(card) {
  if (!card.extra || typeof card.extra !== 'string') return null;
  const parts = card.extra.split('·').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  const ex = el('div', { class: 'card-extras' });
  ex.appendChild(el('h4', { text: 'Ejemplos' }));
  parts.forEach(p => ex.appendChild(el('div', { class: 'example', text: p })));
  return ex;
}

function flipCard() {
  STATE.flipped = !STATE.flipped;
  render();
}

function answerFlash(correct) {
  const card = STATE.cards[STATE.index];
  recordAnswer(card._id, correct);
  if (correct) STATE.sessionStats.right++; else STATE.sessionStats.wrong++;
  STATE.flipped = false;
  STATE.index++;
  render();
}

function renderTestCard(root, card) {
  const q = STATE.testQuestion;

  const cardEl = el('div', { class: 'card no-click' });
  cardEl.appendChild(el('span', { class: 'block-badge', text: card._block }));
  cardEl.appendChild(el('span', { class: 'type-badge', text: TYPE_LABELS[card.type] || card.type }));
  const inner = el('div', { class: 'card-inner' });
  inner.appendChild(el('div', { class: card.jp.length <= 3 ? 'jp-big' : 'jp-medium', text: card.jp }));
  if (card.read) inner.appendChild(el('div', { class: 'reading', text: card.read }));
  cardEl.appendChild(inner);
  root.appendChild(el('div', { class: 'card-stage' }, [cardEl]));

  root.appendChild(el('div', { class: 'test-question', text: '¿Qué significa?' }));

  const opts = el('div', { class: 'test-options' });
  q.options.forEach((opt, idx) => {
    let cls = 'test-option';
    if (q.answered) {
      if (idx === q.correctIdx)        cls += ' correct';
      else if (idx === q.selected)     cls += ' incorrect';
      else                             cls += ' dim';
    }
    const btn = el('button', {
      class: cls,
      disabled: q.answered ? 'disabled' : null,
      onclick: () => answerTest(idx)
    });
    btn.appendChild(el('span', { class: 'opt-letter', text: 'ABCD'[idx] }));
    btn.appendChild(el('span', { text: opt.mean }));
    opts.appendChild(btn);
  });
  root.appendChild(opts);

  if (q.answered) {
    const isLast = STATE.index + 1 >= STATE.cards.length;
    root.appendChild(el('div', { class: 'actions single', style: 'margin-top: 1rem;' }, [
      el('button', { class: 'btn btn-block', onclick: nextTest }, isLast ? 'Terminar' : 'Siguiente →')
    ]));
  }
}

function answerTest(idx) {
  const q = STATE.testQuestion;
  if (q.answered) return;
  q.selected = idx;
  q.answered = true;
  const correct = idx === q.correctIdx;
  const card = STATE.cards[STATE.index];
  recordAnswer(card._id, correct);
  if (correct) STATE.sessionStats.right++; else STATE.sessionStats.wrong++;
  render();
}

function nextTest() {
  STATE.index++;
  if (STATE.index < STATE.cards.length) prepareTestQuestion();
  render();
}

function renderFinished(root) {
  const total = STATE.sessionStats.right + STATE.sessionStats.wrong;
  const pct = total > 0 ? Math.round((STATE.sessionStats.right / total) * 100) : 0;
  root.appendChild(el('h1', { class: 'h1', text: 'お疲れさま — sesión terminada' }));
  root.appendChild(el('div', { class: 'stats-grid' }, [
    statBox('Cartas', total),
    statBox('Aciertos', STATE.sessionStats.right, 'good'),
    statBox('Fallos', STATE.sessionStats.wrong, 'accent'),
    statBox('Acierto', pct + '%', 'good')
  ]));
  root.appendChild(el('div', { class: 'actions' }, [
    el('button', { class: 'btn',           onclick: () => { STATE.view = 'home'; render(); } }, 'Volver al inicio'),
    el('button', { class: 'btn btn-ghost', onclick: () => startStudy() }, 'Repetir sesión')
  ]));
}

function statBox(label, value, color = '') {
  const box = el('div', { class: 'stat-box' });
  box.appendChild(el('div', { class: 'stat-label', text: label }));
  box.appendChild(el('div', { class: 'stat-value ' + color, text: String(value) }));
  return box;
}

/* ----- Stats ----- */

function renderStats(root) {
  root.appendChild(el('h1', { class: 'h1', text: 'Estadísticas' }));
  const prog = loadProgress();
  const ids = Object.keys(prog);
  const total = ids.length;
  const seen  = ids.reduce((a, id) => a + (prog[id].seen   || 0), 0);
  const right = ids.reduce((a, id) => a + (prog[id].correct|| 0), 0);
  const wrong = ids.reduce((a, id) => a + (prog[id].wrong  || 0), 0);
  const pct = seen > 0 ? Math.round((right / seen) * 100) : 0;

  root.appendChild(el('div', { class: 'stats-grid' }, [
    statBox('Cartas vistas', total),
    statBox('Respuestas', seen),
    statBox('Aciertos', right, 'good'),
    statBox('Fallos', wrong, 'accent'),
    statBox('Acierto', pct + '%')
  ]));

  if (total === 0) {
    root.appendChild(el('div', { class: 'empty' }, [
      el('div', { class: 'empty-icon', text: '空' }),
      el('div', { text: 'Aún no has estudiado nada. Empieza una sesión desde Inicio.' })
    ]));
    return;
  }

  const worst = ids
    .map(id => ({ id, stats: prog[id] }))
    .filter(x => x.stats.wrong > 0)
    .sort((a, b) => failRate(b.stats) - failRate(a.stats) || b.stats.wrong - a.stats.wrong)
    .slice(0, 25);

  root.appendChild(el('h2', { class: 'section-title', text: 'Cartas con más fallos' }));
  if (!worst.length) {
    root.appendChild(el('div', { class: 'note', text: 'No has fallado ninguna carta todavía.' }));
  } else {
    const list = el('div');
    worst.forEach(x => {
      const parts = x.id.split(':');
      const contentType = parts[0], blockId = parts[1];
      const jp = parts.slice(2).join(':');
      const row = el('div', { class: 'card-row' });
      row.appendChild(el('div', { class: 'jp', text: jp }));
      const info = el('div', { class: 'info' });
      info.appendChild(el('div', { class: 'info-main', text: `${contentType} · ${blockId}` }));
      info.appendChild(el('div', { class: 'info-sub', text: `Visto ${x.stats.seen} · acertado ${x.stats.correct} · fallado ${x.stats.wrong}` }));
      row.appendChild(info);
      row.appendChild(el('div', { class: 'stats-mini', html: `<strong>${Math.round(failRate(x.stats) * 100)}%</strong> fallos` }));
      list.appendChild(row);
    });
    root.appendChild(list);
  }
}

/* ----- Settings ----- */

function renderSettings(root) {
  root.appendChild(el('h1', { class: 'h1', text: 'Ajustes' }));
  const settings = loadSettings();

  const themeSec = el('div', { class: 'section' });
  themeSec.appendChild(el('h2', { class: 'section-title', text: 'Tema' }));
  const themeChips = el('div', { class: 'chip-group' });
  [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].forEach(([id, label]) => {
    themeChips.appendChild(el('button', {
      class: 'chip' + (settings.theme === id ? ' active' : ''),
      onclick: () => {
        settings.theme = id; saveSettings(settings); applyTheme(id); render();
      }
    }, label));
  });
  themeSec.appendChild(themeChips);
  root.appendChild(themeSec);

  const progSec = el('div', { class: 'section' });
  progSec.appendChild(el('h2', { class: 'section-title', text: 'Progreso' }));
  progSec.appendChild(el('div', { class: 'row' }, [
    el('button', { class: 'btn', onclick: doExport }, 'Exportar progreso'),
    el('button', { class: 'btn btn-ghost', onclick: triggerImport }, 'Importar progreso'),
    el('button', { class: 'btn btn-ghost', onclick: doReset }, 'Resetear progreso')
  ]));
  progSec.appendChild(el('input', {
    type: 'file', id: 'import-file', accept: '.json',
    style: 'display: none;',
    onchange: doImport
  }));
  progSec.appendChild(el('div', {
    class: 'note',
    text: 'El progreso se guarda en tu navegador (localStorage). Exporta a archivo para copia de seguridad o moverlo a otro dispositivo.'
  }));
  root.appendChild(progSec);
}

function doExport() {
  const blob = new Blob([exportProgress()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `japones-progreso-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Progreso exportado');
}

function triggerImport() { $('#import-file').click(); }

function doImport(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      importProgress(e.target.result);
      showToast('Progreso importado');
      render();
    } catch (err) {
      showToast('Archivo inválido');
    }
  };
  reader.readAsText(f);
}

function doReset() {
  if (confirm('¿Borrar todo el progreso? Esta acción no se puede deshacer.')) {
    resetProgress();
    showToast('Progreso reseteado');
    render();
  }
}

/* ----- Atajos de teclado ----- */

function onKey(ev) {
  if (STATE.view !== 'study' || STATE.index >= STATE.cards.length) return;
  if (STATE.mode === 'flash' || STATE.mode === 'review') {
    if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault();
      if (!STATE.flipped) flipCard();
    } else if (STATE.flipped) {
      if (ev.key === 'ArrowRight' || ev.key === '1' || ev.key.toLowerCase() === 'j') answerFlash(true);
      else if (ev.key === 'ArrowLeft' || ev.key === '2' || ev.key.toLowerCase() === 'f') answerFlash(false);
    }
  } else if (STATE.mode === 'test') {
    const q = STATE.testQuestion;
    if (!q) return;
    if (!q.answered) {
      const k = ev.key.toLowerCase();
      const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
      if (idx >= 0) answerTest(idx);
    } else {
      if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        nextTest();
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(loadSettings().theme || 'auto');
  $$('.nav-btn').forEach(b => {
    b.addEventListener('click', () => { STATE.view = b.dataset.nav; render(); });
  });
  $('#brand').addEventListener('click', () => { STATE.view = 'home'; render(); });
  document.addEventListener('keydown', onKey);
  render();
});
