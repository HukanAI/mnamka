// Oblíbené recepty.
import * as store from '../store.js';
import { icons, recipeCard, bindHearts, emptyState } from './common.js';

export function render(el, { byId }) {
  const draw = () => {
    const favs = store.getFavorites().map((id) => byId.get(id)).filter(Boolean);
    el.innerHTML = favs.length
      ? `<p class="result-count">${favs.length} ${favs.length === 1 ? 'oblíbený recept' : favs.length < 5 ? 'oblíbené recepty' : 'oblíbených receptů'}</p>
         <div class="cards">${favs.map(recipeCard).join('')}</div>`
      : emptyState(icons.heart, 'Zatím žádné oblíbené', 'Klepněte na srdíčko u receptu a najdete ho tady.<br><a href="#/">Procházet recepty</a>');
  };
  bindHearts(el, (id, on) => { if (!on) draw(); });
  draw();
}
