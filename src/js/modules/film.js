/**
 * Teaser photo : deux bandes de photos qui glissent en sens opposés
 * au rythme du scroll. Désactivé en reduced-motion.
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from './env.js';

export function initFilm() {
  const section = document.querySelector('[data-film]');
  if (!section || prefersReducedMotion()) return;

  section.querySelectorAll('[data-film-row]').forEach((row) => {
    const dir = Number(row.dataset.filmRow) || 1;
    gsap.fromTo(row, { xPercent: dir > 0 ? -18 : 0 }, {
      xPercent: dir > 0 ? 0 : -18,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
