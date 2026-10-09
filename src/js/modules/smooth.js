/**
 * Smooth scroll (Lenis) synchronisé avec GSAP ScrollTrigger.
 * Désactivé si l'utilisateur préfère réduire les animations : on garde
 * alors le scroll natif du navigateur. Sur écran tactile, Lenis laisse
 * le scroll natif (syncTouch: false) : plus fiable sur iOS.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env.js';

let lenis = null;

export function initSmoothScroll() {
  if (prefersReducedMotion()) return null;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Défilement vers une cible (élément, sélecteur ou position). */
export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (lenis) {
    lenis.scrollTo(el ?? target, { duration: 1.4, immediate, force: true });
    return;
  }
  const behavior = immediate || prefersReducedMotion() ? 'auto' : 'smooth';
  if (typeof target === 'number') window.scrollTo({ top: target, behavior });
  else el?.scrollIntoView({ behavior, block: 'start' });
}

export const stopScroll = () =>
  lenis ? lenis.stop() : document.documentElement.style.setProperty('overflow', 'hidden');
export const startScroll = () =>
  lenis ? lenis.start() : document.documentElement.style.removeProperty('overflow');
