/**
 * Hero : introduction épurée.
 * À l'arrivée (après l'intro de chargement) :
 *   1. le petit libellé apparaît,
 *   2. le titre monte ligne par ligne,
 *   3. le texte, les boutons et les services suivent,
 *   4. le cadre vidéo se déploie doucement.
 * Au scroll (desktop) : léger parallaxe de la vidéo dans son cadre.
 * Pas de section bloquée, pas de découpe : simple et fiable partout.
 */
import { gsap } from 'gsap';
import { MQ, prefersReducedMotion } from './env.js';

export function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero || prefersReducedMotion()) return { intro: () => {} };

  const lines = hero.querySelectorAll('[data-hero-line]');
  const items = hero.querySelectorAll('[data-hero-item]');
  const media = hero.querySelector('[data-hero-media]');
  const inner = hero.querySelector('[data-hero-media-inner]');

  // Timeline construite tout de suite (en pause) : l'état de départ est posé
  // sous l'écran de chargement, puis jouée quand celui-ci se lève.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  tl.from(items[0], { y: 16, opacity: 0, duration: 0.9 }, 0)
    .from(lines, { yPercent: 110, duration: 1.2, stagger: 0.12 }, 0.1)
    .from([...items].slice(1), { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.45)
    .from(media, { y: 60, opacity: 0, clipPath: 'inset(8% 6% 0% 6% round 1.5rem)', duration: 1.4, ease: 'expo.out', clearProps: 'clipPath' }, 0.6)
    .from(inner, { scale: 1.15, duration: 1.8 }, 0.6);

  // Parallaxe léger de la vidéo dans son cadre (desktop uniquement)
  gsap.matchMedia().add(MQ.desktop, () => {
    gsap.fromTo(inner, { yPercent: -4 }, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  return { intro: () => tl.play() };
}
