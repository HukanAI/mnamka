// Nákupní seznam ze všech naplánovaných receptů.
import * as store from '../store.js';
import { esc, fold, icons, emptyState, toast } from './common.js';

/** Klíč suroviny: bez diakritiky, bez poznámek v závorkách a koncové interpunkce. */
const ingredientKey = (name) => fold(String(name || '').replace(/\([^)]*\)/g, ' '))
  .replace(/[.,;:!*–-]+$/g, '').trim();

/** [{ key, sig, name, uses: [{ id, title, amount, times }] }] */
function buildItems(byId) {
  const items = new Map();
  const perRecipe = new Map(); // kolikrát je recept naplánovaný
  for (const { id } of store.plannedEntries()) perRecipe.set(id, (perRecipe.get(id) || 0) + 1);
  for (const [id, times] of perRecipe) {
    const r = byId.get(id);
    if (!r) continue;
    for (const ing of r.ingredients || []) {
      const key = ingredientKey(ing?.name);
      if (!key) continue;
      let item = items.get(key);
      if (!item) {
        item = { key, name: String(ing.name).replace(/\s*\([^)]*\)\s*/g, ' ').trim() || ing.name, uses: [] };
        items.set(key, item);
      }
      item.uses.push({ id, title: r.title, amount: String(ing.amount || '').trim(), times });
    }
  }
  for (const item of items.values()) {
    item.sig = item.uses.map((u) => `${u.id}*${u.times}*${u.amount}`).sort().join('|');
  }
  return [...items.values()].sort((a, b) => a.key.localeCompare(b.key, 'cs'));
}

const amountText = (u) => `${u.amount}${u.times > 1 ? ` (${u.times}×)` : ''}`.trim();

function shareText(items) {
  const lines = items.map((it) => {
    const amounts = it.uses.map(amountText).filter(Boolean);
    return `• ${it.name}${amounts.length ? ` – ${amounts.join(' + ')}` : ''}`;
  });
  return `Nákupní seznam (Mňamka)\n${lines.join('\n')}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

const itemHtml = (it, checked, n) => `<li class="shop-item ${checked ? 'checked' : ''}">
  <input type="checkbox" id="shop-${n}" data-key="${esc(it.key)}" ${checked ? 'checked' : ''}>
  <label for="shop-${n}">
    <span class="shop-name">${esc(it.name)}</span>
    <ul class="shop-uses">${it.uses.map((u) => `<li>${amountText(u) ? `<b>${esc(amountText(u))}</b> · ` : ''}${esc(u.title)}</li>`).join('')}</ul>
  </label>
</li>`;

export function render(el, { byId }) {
  let items = [];

  const draw = () => {
    const all = buildItems(byId);
    items = all.filter((it) => !store.isHidden(it.key, it.sig));
    const hiddenCount = all.length - items.length;
    if (!all.length) {
      el.innerHTML = emptyState(icons.cart, 'Seznam je prázdný', 'Naplánujte recepty v jídelníčku a suroviny se sem samy sečtou.<br><a href="#/jidelnicek">Otevřít jídelníček</a>');
      return;
    }
    const open = items.filter((it) => !store.isChecked(it.key, it.sig));
    const done = items.filter((it) => store.isChecked(it.key, it.sig));
    el.innerHTML = `
      <div class="btn-row" style="margin-top:0">
        <button type="button" class="btn btn-primary" data-share ${open.length ? '' : 'disabled'}>${icons.share} Sdílet</button>
        <button type="button" class="btn btn-ghost btn-danger" data-clear-done ${done.length ? '' : 'disabled'}>${icons.trash} Smazat odškrtnuté</button>
      </div>
      <p class="result-count">${open.length ? `Zbývá koupit ${open.length} z ${items.length}` : 'Vše nakoupeno 🎉'}</p>
      <ul class="shop-list">${open.map((it, n) => itemHtml(it, false, n)).join('')}</ul>
      ${done.length ? `<h2 class="subhead">V košíku</h2><ul class="shop-list">${done.map((it, n) => itemHtml(it, true, open.length + n)).join('')}</ul>` : ''}
      ${hiddenCount ? `<p class="result-count">Smazáno ${hiddenCount} ${hiddenCount === 1 ? 'položka' : hiddenCount < 5 ? 'položky' : 'položek'} · <a href="#/nakup" data-unhide>obnovit</a></p>` : ''}`;
  };

  el.addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"][data-key]');
    if (!cb) return;
    const it = items.find((x) => x.key === cb.dataset.key);
    if (!it) return;
    store.setChecked(it.key, it.sig, cb.checked);
    draw();
  });

  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-unhide]')) {
      e.preventDefault();
      store.unhideAll();
      draw();
      return;
    }
    if (e.target.closest('[data-clear-done]')) {
      const done = items.filter((it) => store.isChecked(it.key, it.sig));
      store.hideItems(done);
      draw();
      toast(`Smazáno: ${done.length}`);
      return;
    }
    if (e.target.closest('[data-share]')) {
      const open = items.filter((it) => !store.isChecked(it.key, it.sig));
      const text = shareText(open);
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Nákupní seznam', text });
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return; // uživatel sdílení zavřel
        }
      }
      toast(await copyText(text) ? 'Seznam zkopírován do schránky' : 'Kopírování se nepovedlo');
    }
  });

  draw();
}
