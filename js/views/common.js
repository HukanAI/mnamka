// Sdílené pomocníky pro obrazovky: escapování, normalizace, ikony, karty, dialogy, galerie.
import * as store from '../store.js';

export const DAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
export const DAYS_LONG = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
export const MEALS = [
  { key: 'snidane', label: 'Snídaně' },
  { key: 'svacina1', label: 'Svačina' },
  { key: 'obed', label: 'Oběd' },
  { key: 'svacina2', label: 'Svačina' },
  { key: 'vecere', label: 'Večeře' },
];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Malá písmena bez diakritiky, zkrácené mezery – pro hledání a slučování. */
export const fold = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();

export const ageLabel = (age) => (age == null ? '' : `${age}m+`);
export const authorLabel = (source) => {
  if (!source?.author) return '';
  const a = String(source.author).replace(/^@/, '');
  return `@${a}${source.platform ? ` · ${source.platform}` : ''}`;
};

/** Index dne v týdnu, 0 = pondělí. */
export const todayIndex = () => (new Date().getDay() + 6) % 7;

// ---------- Ikony (inline SVG) ----------
const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
export const icons = {
  heart: svg('<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.4 4c2 0 3.4 1.1 4.6 2.7C13.2 5.1 14.6 4 16.6 4c3.5 0 5.8 3.6 4.6 7.1-1.7 4.8-9.2 9.4-9.2 9.4z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  left: svg('<path d="M15 5l-7 7 7 7"/>'),
  right: svg('<path d="M9 5l7 7-7 7"/>'),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  play: svg('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  bowl: svg('<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  steps: svg('<path d="M4 6h4v4H4zM4 14h4v4H4z"/><path d="M12 8h8M12 16h8"/>'),
  bulb: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  people: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.4 0 4 1.5 4.5 4"/>'),
  note: svg('<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h6"/>'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  cart: svg('<path d="M3 4h2.2l2.3 11h11l2-8H6.4"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>'),
};

export function heartButton(id, extraClass = '') {
  const on = store.isFavorite(id);
  return `<button type="button" class="icon-btn heart-btn ${extraClass}" data-fav="${esc(id)}"
    aria-pressed="${on}" aria-label="${on ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}">${icons.heart}</button>`;
}

/** Klik na srdíčko kdekoli v kontejneru. */
export function bindHearts(root, onChange) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn || !root.contains(btn)) return;
    e.preventDefault();
    const on = store.toggleFavorite(btn.dataset.fav);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Odebrat z oblíbených' : 'Přidat do oblíbených');
    toast(on ? 'Přidáno do oblíbených' : 'Odebráno z oblíbených');
    onChange?.(btn.dataset.fav, on);
  });
}

export function recipeCard(r) {
  const thumb = r.images?.[0]
    ? `<img class="card-thumb" src="${esc(r.images[0])}" alt="" loading="lazy" decoding="async">`
    : `<span class="card-thumb placeholder">${icons.bowl}</span>`;
  const meta = [
    r.ageFrom != null ? `<span class="tag tag-age">${esc(ageLabel(r.ageFrom))}</span>` : '',
    ...(r.categories || []).slice(0, 2).map((c) => `<span class="tag">${esc(c)}</span>`),
    r.incomplete ? '<span class="tag tag-warn">neúplný</span>' : '',
  ].join('');
  const author = authorLabel(r.source);
  return `<article class="card">
    <a class="card-link" href="#/recept/${encodeURIComponent(r.id)}">
      ${thumb}
      <div class="card-body">
        <h3 class="card-title">${esc(r.title)}</h3>
        <div class="card-meta">${meta}</div>
        ${author ? `<div class="card-meta">${esc(author)}</div>` : ''}
      </div>
    </a>
    ${heartButton(r.id)}
  </article>`;
}

export function emptyState(icon, title, text = '') {
  return `<div class="empty">${icon}<p><strong>${esc(title)}</strong></p>${text ? `<p>${text}</p>` : ''}</div>`;
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- Dialog (spodní panel) ----------
export function openSheet(html, setup) {
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet';
  dlg.innerHTML = `<div class="sheet-inner">${html}</div>`;
  document.body.append(dlg);
  const close = () => dlg.close();
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close(); // klik na pozadí
    if (e.target.closest('[data-close]')) close();
  });
  // Zavřít při změně obrazovky (tlačítko zpět apod.)
  window.addEventListener('hashchange', close, { once: true });
  setup?.(dlg, close);
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  return dlg;
}

export const sheetHead = (title) => `<div class="sheet-head"><h2>${esc(title)}</h2>
  <button type="button" class="icon-btn" data-close aria-label="Zavřít">${icons.close}</button></div>`;

/** Dialog „Přidat do jídelníčku“: výběr dne a jídla. */
export function openAddToPlan(recipe) {
  let day = todayIndex();
  let meal = 'obed';
  const html = `${sheetHead('Přidat do jídelníčku')}
    <p style="margin:0">${esc(recipe.title)}</p>
    <div><div class="label">Den</div><div class="seg" data-group="day">
      ${DAYS.map((d, i) => `<button type="button" data-v="${i}" aria-pressed="${i === day}">${d}</button>`).join('')}
    </div></div>
    <div><div class="label">Jídlo</div><div class="seg seg-meals" data-group="meal">
      ${MEALS.map((m) => `<button type="button" data-v="${m.key}" aria-pressed="${m.key === meal}">${m.label}</button>`).join('')}
    </div></div>
    <button type="button" class="btn btn-primary btn-block" data-ok>${icons.plus} Přidat</button>`;
  openSheet(html, (dlg, close) => {
    dlg.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      if (seg.dataset.group === 'day') day = Number(b.dataset.v); else meal = b.dataset.v;
    }));
    dlg.querySelector('[data-ok]').addEventListener('click', () => {
      store.addToPlan(String(day), meal, recipe.id);
      const m = MEALS.find((x) => x.key === meal);
      toast(`Přidáno: ${DAYS_LONG[day]} · ${m.label}`);
      close();
    });
  });
}

/** Výběr receptu (pro „+“ v jídelníčku). */
export function openRecipePicker(recipes, title, onPick) {
  const html = `${sheetHead(title)}
    <div class="search">${icons.search}<input type="search" placeholder="Hledat recept…" aria-label="Hledat recept" enterkeyhint="search" autofocus></div>
    <ul class="picker-list"></ul>`;
  openSheet(html, (dlg, close) => {
    const input = dlg.querySelector('input');
    const list = dlg.querySelector('.picker-list');
    const favs = new Set(store.getFavorites());
    const sorted = [...recipes].sort((a, b) => (favs.has(b.id) - favs.has(a.id)) || a.title.localeCompare(b.title, 'cs'));
    const render = () => {
      const q = fold(input.value);
      const hits = sorted.filter((r) => !q || recipeMatches(r, q));
      list.innerHTML = hits.length
        ? hits.map((r) => `<li><button type="button" data-id="${esc(r.id)}"><span>${favs.has(r.id) ? '♥ ' : ''}${esc(r.title)}</span>${r.ageFrom != null ? `<span class="tag tag-age">${esc(ageLabel(r.ageFrom))}</span>` : ''}</button></li>`).join('')
        : '<li class="empty">Nic nenalezeno</li>';
    };
    input.addEventListener('input', render);
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      onPick(b.dataset.id);
      close();
    });
    render();
  });
}

/** Hledání: všechna slova dotazu musí být v názvu nebo v surovinách. */
export function recipeMatches(r, foldedQuery) {
  const hay = r._search ??= fold([r.title, ...(r.ingredients || []).map((i) => i.name)].join(' | '));
  return foldedQuery.split(' ').every((w) => hay.includes(w));
}

// ---------- Galerie originálů ----------
export function openGallery(images, start = 0) {
  if (!images?.length) return;
  let i = Math.min(Math.max(start, 0), images.length - 1);
  const prevFocus = document.activeElement;
  const el = document.createElement('div');
  el.className = 'gallery';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Originál receptu');
  const multi = images.length > 1;
  el.innerHTML = `<div class="gallery-top">
      <span class="gallery-count" aria-live="polite"></span>
      <button type="button" class="icon-btn" data-g="close" aria-label="Zavřít">${icons.close}</button>
    </div>
    <div class="gallery-stage">
      <img alt="">
      ${multi ? `<button type="button" class="icon-btn gallery-nav prev" data-g="prev" aria-label="Předchozí">${icons.left}</button>
      <button type="button" class="icon-btn gallery-nav next" data-g="next" aria-label="Další">${icons.right}</button>` : ''}
    </div>
    <div class="gallery-dots">${multi ? images.map(() => '<span></span>').join('') : ''}</div>`;
  const img = el.querySelector('img');
  const count = el.querySelector('.gallery-count');
  const dots = [...el.querySelectorAll('.gallery-dots span')];
  const show = () => {
    img.src = images[i];
    img.alt = `Obrázek ${i + 1} z ${images.length}`;
    count.textContent = `${i + 1} / ${images.length}`;
    dots.forEach((d, n) => d.classList.toggle('on', n === i));
    // přednačíst sousední
    [images[i + 1], images[i - 1]].filter(Boolean).forEach((src) => { new Image().src = src; });
  };
  const go = (d) => { if (multi) { i = (i + d + images.length) % images.length; show(); } };
  const close = () => {
    el.remove();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('hashchange', close);
    document.body.style.overflow = '';
    prevFocus?.focus?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    if (b.dataset.g === 'close') close();
    else go(b.dataset.g === 'next' ? 1 : -1);
  });
  // swipe
  let x0 = null, y0 = 0;
  const stage = el.querySelector('.gallery-stage');
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (x0 == null || e.touches.length !== 1) return;
    img.style.transform = `translateX(${(e.touches[0].clientX - x0) * 0.6}px)`;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    img.style.transform = '';
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  });
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', close);
  document.body.style.overflow = 'hidden';
  document.body.append(el);
  show();
  el.querySelector('[data-g="close"]').focus();
}
