// Lokální úložiště nad localStorage. Když localStorage nejde (soukromý režim,
// zakázané cookies…), drží se data jen v paměti a appka funguje dál.
const PREFIX = 'mnamka:';
const memory = new Map();

let storage = null;
try {
  const probe = PREFIX + '__probe';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
  storage = window.localStorage;
} catch {
  storage = null;
}

export const persistent = () => storage !== null;

function read(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  let value = fallback;
  try {
    const raw = storage?.getItem(PREFIX + key);
    if (raw != null) value = JSON.parse(raw);
  } catch { /* poškozená hodnota – použijeme výchozí */ }
  memory.set(key, value);
  return value;
}

function write(key, value) {
  memory.set(key, value);
  try {
    storage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch { /* plné úložiště – zůstane v paměti */ }
}

// ---------- Oblíbené ----------
export function getFavorites() {
  const v = read('favorites', []);
  return Array.isArray(v) ? v : [];
}
export function isFavorite(id) {
  return getFavorites().includes(id);
}
export function toggleFavorite(id) {
  const favs = getFavorites();
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  write('favorites', next);
  return next.includes(id);
}

// ---------- Jídelníček ----------
// plan: { "0": { snidane: [id, …], … }, … "6": {…} } – 0 = pondělí
export const MEAL_KEYS = ['snidane', 'svacina1', 'obed', 'svacina2', 'vecere'];

export function getPlan() {
  const v = read('plan', {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
export function getSlot(day, meal) {
  const ids = getPlan()[day]?.[meal];
  return Array.isArray(ids) ? ids : [];
}
export function addToPlan(day, meal, id) {
  const plan = structuredClone(getPlan());
  plan[day] ??= {};
  plan[day][meal] ??= [];
  plan[day][meal].push(id);
  write('plan', plan);
}
export function removeFromPlan(day, meal, index) {
  const plan = structuredClone(getPlan());
  const slot = plan[day]?.[meal];
  if (!Array.isArray(slot)) return;
  slot.splice(index, 1);
  write('plan', plan);
}
export function clearPlan() {
  write('plan', {});
  resetShopping();
}
/** Všechny naplánované výskyty receptů: [{day, meal, id}] */
export function plannedEntries() {
  const out = [];
  for (let d = 0; d < 7; d++) {
    for (const meal of MEAL_KEYS) {
      for (const id of getSlot(String(d), meal)) out.push({ day: d, meal, id });
    }
  }
  return out;
}

// ---------- Nákup ----------
// Odškrtnutí i smazání se ukládá s „podpisem“ položky (z čeho se skládá).
// Když se položka změní (přibude recept), stav se tím sám zruší.
function readMap(key) {
  const v = read(key, {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
export function isChecked(key, sig) {
  return readMap('checked')[key] === sig;
}
export function setChecked(key, sig, on) {
  const map = { ...readMap('checked') };
  if (on) map[key] = sig; else delete map[key];
  write('checked', map);
}
export function isHidden(key, sig) {
  return readMap('hidden')[key] === sig;
}
export function hideItems(items) {
  const hidden = { ...readMap('hidden') };
  const checked = { ...readMap('checked') };
  for (const { key, sig } of items) {
    hidden[key] = sig;
    delete checked[key];
  }
  write('hidden', hidden);
  write('checked', checked);
}
export function unhideAll() {
  write('hidden', {});
}
export function resetShopping() {
  write('hidden', {});
  write('checked', {});
}

// ---------- UI stav (filtry) ----------
export function getUi() {
  const v = read('ui', {});
  return v && typeof v === 'object' ? v : {};
}
export function setUi(patch) {
  write('ui', { ...getUi(), ...patch });
}
