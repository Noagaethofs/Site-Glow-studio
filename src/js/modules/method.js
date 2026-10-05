/**
 * GLOW Method : sur desktop, la piste des 5 étapes défile horizontalement
 * pendant que la section est pinnée. Sur mobile / reduced-motion,
 * les étapes restent en pile verticale (une ligne par étape).
 */
import { gsap } from 'gsap';
import { MQ } from './env.js';

export function initMethod() {
  const section = document.querySelector('[data-method]');
  if (!section) return;

  const pin = section.querySelector('[data-method-pin]');
  const track = section.querySelector('[data-method-track]');
  const bar = section.querySelector('[data-method-bar]');

  gsap.matchMedia().add(`${MQ.desktop} and (prefers-reduced-motion: no-preference)`, () => {
    section.classList.add('is-horizontal');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin,
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
    tl.to(track, { x: () => -distance() }, 0)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1 }, 0);

    // Les noms d'étapes glissent légèrement plus vite que la piste
    track.querySelectorAll('.step__name').forEach((name) => {
      gsap.fromTo(name, { xPercent: 12 }, {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: name.parentElement,
          containerAnimation: tl,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      });
    });

    return () => section.classList.remove('is-horizontal');
  });
}
