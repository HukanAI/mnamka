// Tlačítko „Nainstalovat“: na Androidu/desktopu systémový dialog (beforeinstallprompt),
// jinde (iPhone, Firefox…) návod, jak appku přidat na plochu ručně.
import { esc, icons, openSheet, sheetHead, toast } from './views/common.js';

const btn = document.getElementById('install-btn');
let deferredPrompt = null;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS se hlásí jako Mac

function update() {
  btn.hidden = isStandalone();
}

function step(icon, text) {
  return `<li><span class="install-step-icon">${icon}</span><span>${text}</span></li>`;
}

function openGuide() {
  const plusBox = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const dots = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>';
  const steps = isIos()
    ? [
        step(icons.share, 'Dole (nebo nahoře) klepni na tlačítko <b>Sdílet</b>.'),
        step(plusBox, 'Sjeď níž a zvol <b>Přidat na plochu</b>.'),
        step(icons.plus, 'Potvrď tlačítkem <b>Přidat</b>.'),
      ]
    : [
        step(dots, 'Otevři menu prohlížeče <b>⋮</b> (vpravo nahoře).'),
        step(plusBox, 'Zvol <b>Nainstalovat aplikaci</b> nebo <b>Přidat na plochu</b>.'),
        step(icons.plus, 'Potvrď tlačítkem <b>Nainstalovat</b> / <b>Přidat</b>.'),
      ];
  const hint = isIos()
    ? 'Na iPhonu to funguje v Safari (od iOS 16.4 i v Chrome).'
    : 'Nejlépe to funguje v Chrome.';
  openSheet(`${sheetHead('Nainstalovat Mňamku')}
    <p class="install-lead">Appka se pak spouští z ikony na ploše jako běžná aplikace a funguje i bez internetu.</p>
    <ol class="install-steps">${steps.join('')}</ol>
    <p class="install-hint">${esc(hint)}</p>
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
    btn.hidden = true;
    toast('Mňamka je nainstalovaná');
  });

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', update);

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) { openGuide(); return; }
    const prompt = deferredPrompt;
    deferredPrompt = null; // prompt jde použít jen jednou
    prompt.prompt();
    try {
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') btn.hidden = true;
    } catch { /* ignore */ }
  });
}
