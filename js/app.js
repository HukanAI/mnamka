// Mňamka – vstupní bod: načtení dat, hash router, service worker.
import { esc } from './views/common.js';
import * as recipesView from './views/recipes.js';
import * as detailView from './views/detail.js';
import * as favoritesView from './views/favorites.js';
import * as planView from './views/plan.js';
import * as shoppingView from './views/shopping.js';
import * as inspirationView from './views/inspiration.js';

const ROUTES = [
  { re: /^\/$/, view: recipesView, tab: 'recepty', title: 'Recepty' },
  { re: /^\/recept\/(.+)$/, view: detailView, tab: 'recepty', title: 'Recept', back: true },
  { re: /^\/oblibene$/, view: favoritesView, tab: 'oblibene', title: 'Oblíbené' },
  { re: /^\/jidelnicek$/, view: planView, tab: 'jidelnicek', title: 'Jídelníček' },
  { re: /^\/nakup$/, view: shoppingView, tab: 'nakup', title: 'Nákupní seznam' },
  { re: /^\/inspirace$/, view: inspirationView, tab: 'inspirace', title: 'Inspirace' },
];

const viewEl = document.getElementById('view');
const titleEl = document.getElementById('page-title');
const backBtn = document.getElementById('back-btn');
const scrollMemory = new Map();
let currentPath = null;
let ctx = null;

async function fetchJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadData() {
  const [recipes, menus] = await Promise.all([fetchJson('data/recipes.json'), fetchJson('data/menus.json')]);
  const missing = !Array.isArray(recipes);
  const list = (missing ? [] : recipes).filter((r) => r && r.id && r.title);
  return {
    recipes: list,
    byId: new Map(list.map((r) => [String(r.id), r])),
    menus: Array.isArray(menus) ? menus : [],
    missing,
  };
}

function setTitle(text) {
  titleEl.textContent = text;
  document.title = text && text !== 'Mňamka' ? `${text} · Mňamka` : 'Mňamka';
}

function render() {
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  if (currentPath != null) scrollMemory.set(currentPath, window.scrollY);
  const route = ROUTES.find((r) => r.re.test(path));
  if (!route) { location.replace('#/'); return; }
  const params = path.match(route.re).slice(1).map(decodeURIComponent);

  document.querySelectorAll('.tabbar a').forEach((a) => {
    const active = a.dataset.tab === route.tab;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  backBtn.hidden = !route.back;
  setTitle(route.title);

  viewEl.innerHTML = '';
  if (ctx.missing && route.tab === 'recepty' && !route.back) {
    viewEl.insertAdjacentHTML('beforeend', '<div class="banner">Recepty se nepodařilo načíst. Zkontrolujte připojení a zkuste stránku obnovit.</div>');
  }
  const container = document.createElement('div');
  viewEl.append(container);
  route.view.render(container, { ...ctx, params, setTitle, rerender: render });

  const restore = scrollMemory.get(path);
  window.scrollTo(0, route.back ? 0 : restore || 0);
  currentPath = path;
}

// Pokud jsme v appce už navigovali, zpět vrací předchozí obrazovku; jinak domů
// (např. při otevření odkazu přímo na detail).
let navigated = false;
backBtn.addEventListener('click', () => {
  if (navigated) history.back();
  else location.replace('#/');
});
window.addEventListener('hashchange', () => { navigated = true; render(); });

function precacheImages() {
  if (!('serviceWorker' in navigator)) return;
  const urls = new Set();
  for (const r of ctx.recipes) (r.images || []).forEach((u) => urls.add(u));
  for (const m of ctx.menus) (m.images || []).forEach((u) => urls.add(u));
  if (!urls.size) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: 'precache-images', urls: [...urls] });
  }).catch(() => {});
}

async function start() {
  try {
    ctx = await loadData();
  } catch (err) {
    viewEl.innerHTML = `<p class="empty">Nepodařilo se načíst recepty. ${esc(err?.message || '')}</p>`;
    return;
  }
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(precacheImages).catch(() => {});
  }
}

start();
