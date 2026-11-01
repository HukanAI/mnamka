// Detail receptu.
import {
  esc, icons, ageLabel, authorLabel, heartButton, bindHearts, emptyState,
  openAddToPlan, openGallery,
} from './common.js';

const list = (items, cls = 'bullets', tag = 'ul') =>
  `<${tag} class="${cls}">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</${tag}>`;

const section = (icon, title, body, extra = '') =>
  `<section class="section ${extra}"><h2>${icon}${esc(title)}</h2>${body}</section>`;

export function render(el, { byId, params, setTitle }) {
  const r = byId.get(params[0]);
  if (!r) {
    el.innerHTML = emptyState(icons.bowl, 'Recept nenalezen', '<a href="#/">Zpět na recepty</a>');
    return;
  }
  setTitle(r.title);
  const images = (r.images || []).filter(Boolean);
  const ingredients = (r.ingredients || []).filter((i) => i && (i.name || i.amount));
  const steps = (r.steps || []).filter(Boolean);
  const tips = (r.tips || []).filter(Boolean);
  const adults = (r.forAdults || []).filter(Boolean);
  const tags = [
    r.ageFrom != null ? `<span class="tag tag-age">od ${esc(ageLabel(r.ageFrom))}</span>` : '',
    ...(r.categories || []).map((c) => `<span class="tag">${esc(c)}</span>`),
    r.incomplete ? '<span class="tag tag-warn">neúplný recept</span>' : '',
  ].join('');
  const author = authorLabel(r.source);

  el.innerHTML = `
    ${images.length ? `<button type="button" class="detail-hero" data-gallery="0" aria-label="Zobrazit originál">
      <img src="${esc(images[0])}" alt="${esc(r.title)}" decoding="async"></button>` : ''}
    <div class="detail-head">
      <h2 class="detail-title">${esc(r.title)}</h2>
      ${heartButton(r.id)}
    </div>
    <div class="detail-tags">${tags}</div>
    ${author ? `<p class="source">Zdroj: ${esc(author)}</p>` : ''}
    ${r.incomplete ? '<div class="banner" style="margin-top:10px">Recept nemusí být úplný – originál zkontrolujte na obrázku nebo videu.</div>' : ''}

    <div class="btn-row">
      <button type="button" class="btn btn-primary" data-plan>${icons.calendar} Přidat do jídelníčku</button>
      ${images.length ? `<button type="button" class="btn" data-gallery="0">${icons.image} Zobrazit originál</button>` : ''}
      ${r.video ? `<button type="button" class="btn btn-sage" data-video>${icons.play} Přehrát video</button>` : ''}
    </div>
    ${r.video ? '<div class="video-wrap"></div>' : ''}

    ${ingredients.length ? section(icons.list, 'Suroviny', `<ul class="ingredients">${ingredients.map((i) =>
      `<li>${i.amount ? `<span class="amount">${esc(i.amount)}</span>` : ''}<span>${esc(i.name || '')}</span></li>`).join('')}</ul>`) : ''}
    ${section(icons.steps, 'Postup', steps.length ? list(steps, 'steps', 'ol')
      : `<p class="missing-steps">Postup v příspěvku chyběl – viz originál.</p>
        ${images.length || r.video ? `<div class="btn-row" style="margin-bottom:0">
          ${images.length ? `<button type="button" class="btn" data-gallery="0">${icons.image} Originál</button>` : ''}
          ${r.video ? `<button type="button" class="btn btn-sage" data-video>${icons.play} Video</button>` : ''}
        </div>` : ''}`)}
    ${tips.length ? section(icons.bulb, 'Tipy', list(tips), 'section-sage') : ''}
    ${adults.length ? section(icons.people, 'Pro dospělé', list(adults), 'section-sage') : ''}
    ${r.notes ? section(icons.note, 'Poznámky', `<p class="notes">${esc(r.notes)}</p>`) : ''}
  `;

  bindHearts(el);
  el.querySelector('[data-plan]').addEventListener('click', () => openAddToPlan(r));
  el.querySelectorAll('[data-gallery]').forEach((b) =>
    b.addEventListener('click', () => openGallery(images, Number(b.dataset.gallery))));

  el.querySelectorAll('[data-video]').forEach((b) => b.addEventListener('click', () => {
    const wrap = el.querySelector('.video-wrap');
    let video = wrap.querySelector('video');
    if (!video) {
      video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'none';
      video.src = r.video;
      wrap.append(video);
    }
    video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    video.play().catch(() => {});
  }));
}
