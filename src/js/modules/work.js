/**
 * Réalisations : sur desktop, les projets sont des panneaux « sticky » qui
 * s'empilent ; celui du dessous recule légèrement quand le suivant arrive.
 * Sur mobile ou en reduced-motion : simple pile verticale.
 */
import { gsap } from 'gsap';
import { MQ } from './env.js';

export function initWork() {
  const cases = [...document.querySelectorAll('[data-case]')];
  if (cases.length < 2) return;

  gsap.matchMedia().add(`${MQ.desktop} and (prefers-reduced-motion: no-preference)`, () => {
    cases.slice(0, -1).forEach((c, i) => {
      gsap.to(c, {
        scale: 0.92,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: cases[i + 1],
          start: 'top bottom',
          end: 'top top+=120',
          scrub: true,
        },
      });
    });
  });
}
