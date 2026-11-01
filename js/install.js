// Tlačítko „Nainstalovat“: ukáže se jen tam, kde prohlížeč umí instalaci spustit sám
// (beforeinstallprompt – Chrome, Edge, Samsung Internet), a rovnou ji spustí.
import { toast } from './views/common.js';

const btn = document.getElementById('install-btn');
let deferredPrompt = null;

export function initInstall() {
  if (!btn) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // místo automatického banneru vlastní tlačítko
    deferredPrompt = e;
    btn.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    btn.hidden = true;
    toast('Mňamka je nainstalovaná');
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) { btn.hidden = true; return; }
    const prompt = deferredPrompt;
    deferredPrompt = null; // prompt jde použít jen jednou
    btn.hidden = true;
    prompt.prompt();
    try {
      await prompt.userChoice;
    } catch { /* ignore */ }
    // Při odmítnutí Chrome později pošle nový beforeinstallprompt a tlačítko se vrátí.
  });
}
