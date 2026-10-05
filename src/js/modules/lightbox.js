/**
 * Lightbox de la galerie photo.
 * - Ouverture depuis n'importe quel [data-gallery-item] (bouton).
 * - Clavier : ← → pour naviguer, Échap pour fermer, focus piégé.
 * - Tactile : swipe horizontal pour changer, swipe vers le bas pour fermer.
 * Le contenu affiché est le clone de l'image (ou de l'emplacement) cliqué.
 */
import { gsap } from 'gsap';
import { stopScroll, startScroll } from './smooth.js';
import { prefersReducedMotion } from './env.js';

export function initLightbox() {
  const items = [...document.querySelectorAll('[data-gallery-item]')];
  const box = document.querySelector('[data-lightbox]');
  if (!items.length || !box) return;

  const stageEl = box.querySelector('[data-lightbox-stage]');
  const counter = box.querySelector('[data-lightbox-counter]');
  const caption = box.querySelector('[data-lightbox-caption]');
  const btnPrev = box.querySelector('[data-lightbox-prev]');
  const btnNext = box.querySelector('[data-lightbox-next]');
  const btnClose = box.querySelector('[data-lightbox-close]');
  let index = 0;
  let opener = null;
  const anim = !prefersReducedMotion();

  const render = (dir = 0) => {
    const item = items[index];
    const source = item.querySelector('img, picture, video, .ph');
    const clone = source.cloneNode(true);
    if (clone.tagName === 'IMG') {
      // version haute définition si fournie
      if (item.dataset.full) { clone.src = item.dataset.full; clone.removeAttribute('srcset'); }
      clone.loading = 'eager';
    }
    const frame = document.createElement('div');
    frame.className = 'lightbox__frame';
    frame.appendChild(clone);

    const old = stageEl.firstElementChild;
    stageEl.appendChild(frame);
    if (anim && old) {
      gsap.fromTo(frame, { xPercent: dir * 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
      gsap.to(old, { xPercent: -dir * 12, opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: () => old.remove() });
    } else old?.remove();

    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    caption.textContent = item.dataset.caption || item.getAttribute('aria-label') || '';
  };

  const go = (step) => {
    index = (index + step + items.length) % items.length;
    render(step);
  };

  const open = (i, trigger) => {
    index = i;
    opener = trigger;
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    stopScroll();
    stageEl.innerHTML = '';
    render();
    if (anim) gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    btnClose.focus();
  };

  const close = () => {
    const done = () => {
      box.hidden = true;
      stageEl.innerHTML = '';
      document.body.classList.remove('lightbox-open');
      startScroll();
      opener?.focus();
    };
    if (anim) gsap.to(box, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
    else done();
  };

  items.forEach((item, i) => item.addEventListener('click', () => open(i, item)));
  btnPrev.addEventListener('click', () => go(-1));
  btnNext.addEventListener('click', () => go(1));
  btnClose.addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box || e.target === stageEl) close(); });

  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Tab') {
      // piège à focus entre les contrôles de la lightbox
      const focusables = [btnClose, btnPrev, btnNext];
      const pos = focusables.indexOf(document.activeElement);
      e.preventDefault();
      focusables[(pos + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
    }
  });

  // Swipe
  let sx = 0, sy = 0, tracking = false;
  stageEl.addEventListener('touchstart', (e) => {
    tracking = true;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive: true });
  stageEl.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90) close();
  }, { passive: true });
}
