/**
 * Projets : un écran (fenêtre de navigateur) affiche un projet.
 * On change de projet à l'HORIZONTALE, ce qui ne gêne jamais le défilement
 * de la page (vertical) :
 *   - tactile ou souris : glisser l'écran vers la gauche / la droite,
 *   - trackpad : balayage horizontal à deux doigts sur l'écran,
 *   - flèches ‹ › sous le texte, ou les petits traits (un par projet),
 *   - clavier : ← → quand l'écran a le focus.
 * La molette et le glissé vertical font défiler la page normalement.
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from './env.js';

export function initWork() {
  const root = document.querySelector('[data-cases]');
  if (!root) return;

  const screen = root.querySelector('[data-screen]');
  const view = screen.querySelector('.screen__view');
  const track = root.querySelector('[data-screen-track]');
  const slides = [...track.children];
  const infos = [...root.querySelectorAll('[data-case-info]')];
  const steps = [...root.querySelectorAll('[data-case-step]')];
  const prev = root.querySelector('[data-case-prev]');
  const next = root.querySelector('[data-case-next]');
  const url = root.querySelector('[data-case-url]');
  const count = root.querySelector('[data-case-count]');
  const n = slides.length;
  const anim = !prefersReducedMotion();
  let index = -1;

  const slideTo = (i, duration = anim ? 0.8 : 0) =>
    gsap.to(track, { xPercent: -100 * i, duration, ease: 'expo.out', overwrite: true });

  const show = (i, dir = 1) => {
    i = Math.max(0, Math.min(n - 1, i));
    slideTo(i);
    if (i === index) return;
    index = i;
    infos.forEach((el, j) => {
      el.hidden = j !== index;
      el.classList.toggle('is-active', j === index);
    });
    if (anim) {
      gsap.fromTo(
        infos[index].children,
        { x: 24 * dir, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05 },
      );
    }
    steps.forEach((b, j) => b.setAttribute('aria-selected', String(j === index)));
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === n - 1;
    if (url) url.textContent = slides[index].dataset.url || '';
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  };
  const go = (dir) => show(index + dir, dir);

  show(0);
  steps.forEach((b, j) => b.addEventListener('click', () => show(j, j > index ? 1 : -1)));
  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));

  // --- Glisser (doigt ou souris) : l'écran suit, puis se cale -------------
  // `touch-action: pan-y` sur l'écran : le navigateur garde le défilement
  // vertical de la page, on ne reçoit que les gestes horizontaux.
  let drag = null;
  screen.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, active: false, id: e.pointerId };
  });
  screen.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag = null; // geste vertical : c'est la page qui défile
        return;
      }
      drag.active = true;
      screen.setPointerCapture(e.pointerId);
      screen.classList.add('is-dragging');
    }
    drag.dx = dx;
    // résistance aux deux extrémités
    const atEdge = (index === 0 && dx > 0) || (index === n - 1 && dx < 0);
    const offset = ((atEdge ? dx / 3 : dx) / view.offsetWidth) * 100;
    gsap.set(track, { xPercent: -100 * index + offset });
  });
  const release = () => {
    if (!drag) return;
    const { dx, active, t } = drag;
    drag = null;
    if (!active) return;
    screen.classList.remove('is-dragging');
    screen.classList.add('was-dragged');
    setTimeout(() => screen.classList.remove('was-dragged'));
    const fast = Math.abs(dx) / (performance.now() - t) > 0.4; // petit geste rapide
    const far = Math.abs(dx) > view.offsetWidth * 0.18;
    if (far || (fast && Math.abs(dx) > 30)) go(dx < 0 ? 1 : -1);
    else slideTo(index, 0.5);
  };
  screen.addEventListener('pointerup', release);
  screen.addEventListener('pointercancel', release);
  // après un glisser à la souris, le clic qui suit ne doit rien déclencher
  screen.addEventListener(
    'click',
    (e) => {
      if (screen.classList.contains('was-dragged')) e.preventDefault();
    },
    true,
  );

  // --- Trackpad : balayage horizontal à deux doigts -----------------------
  let wheelAcc = 0;
  let wheelLock = 0;
  screen.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical : la page défile
      e.preventDefault();
      if (performance.now() < wheelLock) return;
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) > 60) {
        go(wheelAcc > 0 ? 1 : -1);
        wheelAcc = 0;
        wheelLock = performance.now() + 700;
      }
    },
    { passive: false },
  );

  // --- Clavier -------------------------------------------------------------
  screen.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  });

  // le carrousel se recale si la fenêtre change de taille pendant un glisser
  window.addEventListener('resize', () => slideTo(index, 0));
}
