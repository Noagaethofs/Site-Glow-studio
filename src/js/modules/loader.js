/**
 * Intro de chargement : logo GL / OW, < 1,2 s, une seule fois par session.
 * La classe `is-loading` est posée par un script inline dans le header
 * (avant le premier affichage) pour éviter tout flash.
 */
import { gsap } from 'gsap';

export function runLoader() {
  const root = document.documentElement;
  const loader = document.querySelector('[data-loader]');
  if (!loader || !root.classList.contains('is-loading')) return Promise.resolve();

  const parts = loader.querySelectorAll('.loader__mark span');
  return new Promise((resolve) => {
    gsap.timeline({
      onComplete: () => {
        root.classList.remove('is-loading');
        resolve();
      },
    })
      .from(parts, { yPercent: 100, duration: 0.55, ease: 'expo.out', stagger: 0.08 })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut' }, '+=0.12')
      // la page démarre son intro pendant que le rideau se lève
      .call(resolve, null, '-=0.35');
  });
}
