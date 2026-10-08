/**
 * Réalisations : un écran (fenêtre de navigateur) affiche un projet.
 * - On fait glisser l'écran (doigt ou souris) pour passer au projet suivant.
 * - Flèches précédent / suivant, et flèches du clavier quand l'écran a le focus.
 * - Les infos à gauche (nom, contexte, lien) changent avec le projet.
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from './env.js';

export function initWork() {
  const root = document.querySelector('[data-cases]');
  if (!root) return;

  const screen = root.querySelector('[data-screen]');
  const track = root.querySelector('[data-screen-track]');
  const slides = [...track.children];
  const infos = [...root.querySelectorAll('[data-case-info]')];
  const url = root.querySelector('[data-case-url]');
  const count = root.querySelector('[data-case-count]');
  const anim = !prefersReducedMotion();
  let index = 0;

  const go = (i, dir = 0) => {
    index = (i + slides.length) % slides.length;
    gsap.to(track, { xPercent: -100 * index, duration: anim ? 0.8 : 0, ease: 'expo.out' });
    infos.forEach((el, j) => { el.hidden = j !== index; el.classList.toggle('is-active', j === index); });
    if (anim) {
      gsap.fromTo(infos[index].children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
    }
    if (url) url.textContent = slides[index].dataset.url || '';
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  };

  root.querySelector('[data-case-prev]')?.addEventListener('click', () => go(index - 1, -1));
  root.querySelector('[data-case-next]')?.addEventListener('click', () => go(index + 1, 1));
  screen.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, -1); }
  });

  // --- Glisser (souris et tactile) --------------------------------------
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let decided = false;   // on sait si le geste est horizontal (swipe) ou vertical (scroll)
  let horizontal = false;
  const width = () => screen.querySelector('.screen__view').getBoundingClientRect().width;

  screen.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    decided = false;
    horizontal = false;
    startX = e.clientX;
    startY = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!decided && Math.hypot(dx, dy) > 8) {
      decided = true;
      horizontal = Math.abs(dx) > Math.abs(dy);
      if (horizontal) screen.classList.add('is-dragging');
    }
    if (horizontal) {
      // l'écran suit le doigt, avec résistance aux extrémités
      const edge = (index === 0 && dx > 0) || (index === slides.length - 1 && dx < 0);
      const offset = (dx / width()) * 100 * (edge ? 0.35 : 1);
      gsap.set(track, { xPercent: -100 * index + offset });
    }
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    screen.classList.remove('is-dragging');
    if (!horizontal) return;
    const dx = e.clientX - startX;
    if (dx < -50 && index < slides.length - 1) go(index + 1, 1);
    else if (dx > 50 && index > 0) go(index - 1, -1);
    else go(index);
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  screen.addEventListener('dragstart', (e) => e.preventDefault());

  go(0);
}
