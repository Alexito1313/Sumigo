// Bloques disponibles. Añade aquí el ID cuando crees un nuevo JSON.
const DATA = {
  available: {
    kanji: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'],
    vocab: ['L26', 'L27', 'L28', 'L29', 'L30', 'L31', 'L32', 'L33', 'L34', 'L35', 'L36']
  },
  cache: {}
};

const TYPE_LABELS = {
  kanji: 'kanji',
  verbo: 'verbo',
  sustantivo: 'sustantivo',
  'adjetivo-i': 'adj. い',
  'adjetivo-na': 'adj. な',
  adverbio: 'adverbio',
  expresion: 'expresión'
};

async function loadBlock(contentType, blockId) {
  const key = `${contentType}/${blockId}`;
  if (DATA.cache[key]) return DATA.cache[key];
  const res = await fetch(`data/${contentType}/${blockId}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar ${key} (HTTP ${res.status})`);
  const json = await res.json();
  json.forEach(card => {
    card._id = `${contentType}:${blockId}:${card.jp}`;
    card._content = contentType;
    card._block = blockId;
  });
  DATA.cache[key] = json;
  return json;
}

async function loadSelection(selection) {
  const all = [];
  for (const t of Object.keys(selection)) {
    for (const id of selection[t]) {
      try {
        const cards = await loadBlock(t, id);
        all.push(...cards);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return all;
}
