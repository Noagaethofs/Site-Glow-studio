/**
 * Réalisations : sur desktop, un grand visuel suit le curseur au survol
 * de chaque projet. Les visuels sont repris des <figure> de la liste
 * (affichées en grand sous chaque projet sur mobile).
 */
import { gsap } from 'gsap';
import { hasFinePointer, isDesktop, prefersReducedMotion } from './env.js';

export function initWork() {
  const list = document.querySelector('[data-work-list]');
  const follower = document.querySelector('[data-work-follower]');
  if (!list || !follower || !hasFinePointer() || prefersReducedMotion()) return;

  const items = [...list.querySelectorAll('[data-work]')];
  const clones = items.map((item) => {
    const fig = item.querySelector('.work-item__media').cloneNode(true);
    fig.className = '';
    follower.appendChild(fig);
    return fig;
  });

  gsap.set(follower, { xPercent: -50, yPercent: -50 });
  const xTo = gsap.quickTo(follower, 'x', { duration: 0.7, ease: 'power3.out' });
  const yTo = gsap.quickTo(follower, 'y', { duration: 0.7, ease: 'power3.out' });
  const rTo = gsap.quickTo(follower, 'rotation', { duration: 0.9, ease: 'power3.out' });
  let lastX = 0;

  list.addEventListener('pointermove', (e) => {
    if (!isDesktop()) return;
    xTo(e.clientX);
    yTo(e.clientY);
    rTo(gsap.utils.clamp(-6, 6, (e.clientX - lastX) * 0.4)); // légère inclinaison selon la vitesse
    lastX = e.clientX;
  });

  items.forEach((item, i) => {
    item.addEventListener('pointerenter', (e) => {
      if (!isDesktop()) return;
      if (!follower.classList.contains('is-active')) {
        gsap.set(follower, { x: e.clientX, y: e.clientY });
      }
      clones.forEach((c, j) => c.classList.toggle('is-current', i === j));
      follower.classList.add('is-active');
    });
  });
  list.addEventListener('pointerleave', () => {
    follower.classList.remove('is-active');
    rTo(0);
  });
}
