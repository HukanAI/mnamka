// Inspirace: hotové jídelníčky z menus.json (karty po dnech, na širokém displeji tabulka).
import { esc, icons, MEALS, authorLabel, emptyState, openGallery } from './common.js';

const mealText = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'object') return Object.values(v).filter(Boolean).join(', ');
  return String(v);
};

export function render(el, { menus }) {
  if (!menus.length) {
    el.innerHTML = emptyState(icons.bulb, 'Zatím tu nic není', 'Až přibudou hotové jídelníčky, najdete je tady.');
    return;
  }
  el.innerHTML = menus.map((m, mi) => {
    const days = Array.isArray(m.days) ? m.days : [];
    const author = authorLabel(m.source);
    const cell = (d, key) => esc(mealText(d.meals?.[key]));
    // Jen jídla, která se v tomto jídelníčku vyskytují (některé mají třeba jen snídani a oběd).
    const meals = MEALS.filter((meal) => days.some((d) => cell(d, meal.key)));
    return `<article class="menu">
      <h2>${esc(m.title || 'Jídelníček')}</h2>
      ${author ? `<p class="source">${esc(author)}</p>` : ''}
      ${m.note ? `<p class="menu-note">${esc(m.note)}</p>` : ''}
      ${m.images?.length ? `<div class="btn-row"><button type="button" class="btn" data-menu="${mi}">${icons.image} Zobrazit originál${m.images.length > 1 ? ` (${m.images.length})` : ''}</button></div>` : ''}
      <div class="menu-days">
        ${days.map((d) => `<div class="menu-day"><h3>${esc(d.day)}</h3><dl>
          ${meals.filter((meal) => cell(d, meal.key)).map((meal) => `<dt>${esc(meal.label)}</dt><dd>${cell(d, meal.key)}</dd>`).join('')}
        </dl></div>`).join('')}
      </div>
      ${days.length ? `<div class="menu-table-wrap"><table class="menu-table">
        <thead><tr><th scope="col">Den</th>${meals.map((meal) => `<th scope="col">${esc(meal.label)}</th>`).join('')}</tr></thead>
        <tbody>${days.map((d) => `<tr><th scope="row">${esc(d.day)}</th>${meals.map((meal) => `<td>${cell(d, meal.key)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>` : ''}
    </article>`;
  }).join('');

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-menu]');
    if (b) openGallery(menus[Number(b.dataset.menu)].images, 0);
  });
}
