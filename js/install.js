// Tlačítko „Nainstalovat“:
// - Chrome/Edge/Samsung Internet: rovnou spustí instalaci (beforeinstallprompt),
// - iPhone/iPad: Apple instalaci tlačítkem nedovoluje → krátký postup Sdílet → Přidat na plochu.
// V nainstalované appce (spuštěné z plochy) se neukazuje.
import { icons, openSheet, sheetHead, toast } from './views/common.js';

const btn = document.getElementById('install-btn');
let deferredPrompt = null;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1); // iPadOS se hlásí jako Mac

function update() {
  btn.hidden = isStandalone() || !(deferredPrompt || isIos());
}

function openIosSteps() {
  const plusBox = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  openSheet(`${sheetHead('Nainstalovat na iPhone')}
    <ol class="install-steps">
      <li><span class="install-step-icon">${icons.share}</span><span>Klepni na <b>Sdílet</b> v liště Safari.</span></li>
      <li><span class="install-step-icon">${plusBox}</span><span>Zvol <b>Přidat na plochu</b> a potvrď <b>Přidat</b>.</span></li>
    </ol>
    <p class="install-hint">Apple webům nedovoluje spustit instalaci tlačítkem, jde to jen takhle přes Sdílet.</p>
    <button type="button" class="btn btn-primary btn-block" data-close>Rozumím</button>`);
}

export function initInstall() {
  if (!btn) return;
  update();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // místo automatického banneru vlastní tlačítko
    deferredPrompt = e;
    update();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    update();
    btn.hidden = true;
    toast('Mňamka je nainstalovaná');
  });

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', update);

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      if (isIos()) openIosSteps();
      else update();
      return;
    }
    const prompt = deferredPrompt;
    deferredPrompt = null; // prompt jde použít jen jednou
    update();
    prompt.prompt();
    try {
      await prompt.userChoice;
    } catch { /* ignore */ }
    // Při odmítnutí Chrome později pošle nový beforeinstallprompt a tlačítko se vrátí.
  });
}
