// Seznam receptů: vyhledávání, filtr věku a kategorií.
import * as store from '../store.js';
import { esc, fold, icons, recipeCard, recipeMatches, bindHearts, emptyState } from './common.js';

const AGES = [6, 8, 10, 12];

/** Kategorie z dat, seřazené podle četnosti. */
function categoriesOf(recipes) {
  const counts = new Map();
  for (const r of recipes) for (const c of r.categories || []) counts.set(c, (counts.get(c) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'cs')).map(([c]) => c);
}

export function render(el, { recipes }) {
  const ui = store.getUi();
  const state = {
    q: typeof ui.q === 'string' ? ui.q : '',
    age: AGES.includes(ui.age) ? ui.age : null,
    cat: typeof ui.cat === 'string' ? ui.cat : null,
  };
  const cats = categoriesOf(recipes);
  if (state.cat && !cats.includes(state.cat)) state.cat = null;

  el.innerHTML = `
    <div class="search">${icons.search}
      <input type="search" id="q" placeholder="Hledat recept nebo surovinu…" aria-label="Hledat recept nebo surovinu"
        autocomplete="off" enterkeyhint="search" value="${esc(state.q)}">
      <button type="button" class="icon-btn clear" aria-label="Smazat hledání" ${state.q ? '' : 'hidden'}>${icons.close}</button>
    </div>
    <div class="chips" role="group" aria-label="Věk miminka" data-group="age">
      <button type="button" class="chip" data-v="" aria-pressed="${state.age == null}">Každý věk</button>
      ${AGES.map((a) => `<button type="button" class="chip" data-v="${a}" aria-pressed="${state.age === a}">${a}m+</button>`).join('')}
    </div>
    ${cats.length ? `<div class="chips chips-sage" role="group" aria-label="Kategorie" data-group="cat">
      <button type="button" class="chip" data-v="" aria-pressed="${state.cat == null}">Vše</button>
      ${cats.map((c) => `<button type="button" class="chip" data-v="${esc(c)}" aria-pressed="${state.cat === c}">${esc(c)}</button>`).join('')}
    </div>` : ''}
    <p class="result-count" aria-live="polite"></p>
    <div class="cards"></div>`;

  const input = el.querySelector('#q');
  const clearBtn = el.querySelector('.clear');
  const list = el.querySelector('.cards');
  const count = el.querySelector('.result-count');

  const update = () => {
    const q = fold(state.q);
    const hits = recipes.filter((r) =>
      (!q || recipeMatches(r, q))
      && (state.age == null || r.ageFrom == null || r.ageFrom <= state.age)
      && (!state.cat || (r.categories || []).includes(state.cat)));
    hits.sort((a, b) => a.title.localeCompare(b.title, 'cs'));
    count.textContent = hits.length === recipes.length ? `${hits.length} receptů` : `Nalezeno ${hits.length} z ${recipes.length}`;
    list.innerHTML = hits.length
      ? hits.map(recipeCard).join('')
      : emptyState(icons.search, 'Nic jsme nenašli', 'Zkuste jiné slovo nebo zrušte filtry.');
    store.setUi({ q: state.q, age: state.age, cat: state.cat });
  };

  input.addEventListener('input', () => {
    state.q = input.value;
    clearBtn.hidden = !state.q;
    update();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  clearBtn.addEventListener('click', () => {
    input.value = state.q = '';
    clearBtn.hidden = true;
    update();
    input.focus();
  });
  el.querySelectorAll('.chips').forEach((group) => group.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const v = b.dataset.v;
    if (group.dataset.group === 'age') state.age = v ? Number(v) : null;
    else state.cat = v || null;
    group.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b));
    update();
  }));
  bindHearts(list);
  update();
}
