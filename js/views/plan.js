// Týdenní jídelníček: 7 dní × 5 jídel.
import * as store from '../store.js';
import {
  esc, icons, DAYS_LONG, MEALS, todayIndex, openRecipePicker, openSheet, toast,
} from './common.js';

export function render(el, { recipes, byId }) {
  const today = todayIndex();

  const draw = () => {
    const total = store.plannedEntries().length;
    el.innerHTML = `
      <div class="btn-row" style="margin-top:0">
        <a class="btn btn-sage" href="#/nakup">${icons.cart} Nákupní seznam</a>
        <button type="button" class="btn btn-ghost btn-danger" data-clear ${total ? '' : 'disabled'}>${icons.trash} Vyčistit týden</button>
      </div>
      ${DAYS_LONG.map((name, d) => {
        const n = MEALS.reduce((s, m) => s + store.getSlot(String(d), m.key).length, 0);
        return `<section class="day ${d === today ? 'today' : ''}" aria-label="${esc(name)}">
          <div class="day-head"><span>${esc(name)}${d === today ? ' · dnes' : ''}</span>
            <span class="count">${n ? `${n} ${n === 1 ? 'recept' : n < 5 ? 'recepty' : 'receptů'}` : ''}</span></div>
          ${MEALS.map((m) => {
            const ids = store.getSlot(String(d), m.key);
            const chips = ids.map((id, i) => {
              const r = byId.get(id);
              const title = r ? r.title : 'Smazaný recept';
              return `<span class="plan-chip">
                ${r ? `<a href="#/recept/${encodeURIComponent(id)}">${esc(title)}</a>` : `<span>${esc(title)}</span>`}
                <button type="button" data-remove="${d}|${m.key}|${i}" aria-label="Odebrat ${esc(title)}">${icons.close}</button>
              </span>`;
            }).join('');
            return `<div class="meal">
              <div class="meal-name">${esc(m.label)}</div>
              <div class="meal-items">${chips || '<span class="plan-empty">—</span>'}</div>
              <button type="button" class="icon-btn" data-add="${d}|${m.key}" aria-label="Přidat recept: ${esc(name)}, ${esc(m.label)}">${icons.plus}</button>
            </div>`;
          }).join('')}
        </section>`;
      }).join('')}`;
  };

  el.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const [d, meal, i] = rm.dataset.remove.split('|');
      store.removeFromPlan(d, meal, Number(i));
      draw();
      return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      const [d, meal] = add.dataset.add.split('|');
      const label = MEALS.find((m) => m.key === meal).label;
      openRecipePicker(recipes, `${DAYS_LONG[d]} · ${label}`, (id) => {
        store.addToPlan(d, meal, id);
        draw();
        toast('Recept přidán');
      });
      return;
    }
    if (e.target.closest('[data-clear]')) {
      openSheet(`<div class="sheet-head"><h2>Vyčistit týden?</h2></div>
        <p style="margin:0">Odeberou se všechny recepty z jídelníčku a vynuluje se nákupní seznam.</p>
        <div class="btn-row"><button type="button" class="btn" data-close>Zrušit</button>
        <button type="button" class="btn btn-primary" data-yes>Vyčistit</button></div>`, (dlg, close) => {
        dlg.querySelector('[data-yes]').addEventListener('click', () => {
          store.clearPlan();
          close();
          draw();
          toast('Týden je prázdný');
        });
      });
    }
  });
  draw();
}
