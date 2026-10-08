/**
 * Réalisations : un écran (fenêtre de navigateur) affiche un projet.
 * On change de projet UNIQUEMENT en agissant sur l'écran :
 *   - tactile : glisser vers le haut / le bas sur l'écran,
 *   - souris : molette avec le pointeur sur l'écran,
 *   - clavier : ↑ ↓ quand l'écran a le focus,
 *   - ou en cliquant sur les petits traits sous le texte.
 * Ailleurs, la page défile normalement. Au premier / dernier projet, le
 * geste n'est pas retenu : la page continue de défiler (jamais bloquée).
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
  const steps = [...root.querySelectorAll('[data-case-step]')];
  const url = root.querySelector('[data-case-url]');
  const count = root.querySelector('[data-case-count]');
  const n = slides.length;
  const anim = !prefersReducedMotion();
  let index = -1;
  let lockedUntil = 0; // évite de sauter plusieurs projets d'un seul geste

  const show = (i, dir = 1) => {
    if (i === index || i < 0 || i >= n) return;
    index = i;
    gsap.to(track, { yPercent: -100 * index, duration: anim ? 0.8 : 0, ease: 'expo.inOut', overwrite: true });
    infos.forEach((el, j) => { el.hidden = j !== index; el.classList.toggle('is-active', j === index); });
    if (anim) {
      gsap.fromTo(infos[index].children,
        { y: 24 * dir, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05 });
    }
    steps.forEach((b, j) => b.setAttribute('aria-selected', String(j === index)));
    if (url) url.textContent = slides[index].dataset.url || '';
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  };

  /** Essaie de changer de projet ; renvoie false si on est déjà au bout. */
  const step = (dir) => {
    const next = index + dir;
    if (next < 0 || next >= n) return false;
    show(next, dir);
    lockedUntil = performance.now() + 750;
    return true;
  };
  const canStep = (dir) => index + dir >= 0 && index + dir < n;

  show(0);
  steps.forEach((b, j) => b.addEventListener('click', () => show(j, j > index ? 1 : -1)));

  // --- Molette sur l'écran (souris / trackpad) ---------------------------
  let wheelAcc = 0;
  screen.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    if (!canStep(dir)) { wheelAcc = 0; return; } // au bout : la page défile
    // le geste est pour l'écran : la page ne bouge pas (Lenis compris)
    e.preventDefault();
    e.stopPropagation();
    if (performance.now() < lockedUntil) return;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 40) { wheelAcc = 0; step(dir); }
  }, { passive: false });

  // --- Glisser au doigt sur l'écran --------------------------------------
  let startY = 0;
  let startX = 0;
  let lastY = 0;
  let mode = null; // 'screen' : le geste change le projet ; 'page' : il fait défiler la page
  screen.addEventListener('touchstart', (e) => {
    startY = lastY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
    mode = null;
  }, { passive: true });
  screen.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    const dy = y - startY;
    const dx = e.touches[0].clientX - startX;
    if (mode === null && Math.hypot(dx, dy) > 8) {
      const dir = dy < 0 ? 1 : -1; // doigt vers le haut = projet suivant
      mode = Math.abs(dy) > Math.abs(dx) && canStep(dir) ? 'screen' : 'page';
    }
    if (mode === 'screen') {
      e.preventDefault();
      if (Math.abs(dy) > 40 && performance.now() >= lockedUntil) {
        step(dy < 0 ? 1 : -1);
        startY = y; // un geste long peut enchaîner, après le verrou
      }
    } else if (mode === 'page') {
      // l'écran a `touch-action: none` : on fait défiler la page nous-mêmes
      window.scrollBy(0, lastY - y);
    }
    lastY = y;
  }, { passive: false });

  // --- Clavier -------------------------------------------------------------
  screen.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && canStep(1)) { e.preventDefault(); step(1); }
    if (e.key === 'ArrowUp' && canStep(-1)) { e.preventDefault(); step(-1); }
  });
}
