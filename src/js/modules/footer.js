/**
 * Footer : le grand logo se dessine quand il entre à l'écran.
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from './env.js';

export function initFooterLogo() {
  const wrap = document.querySelector('[data-footer-logo]');
  if (!wrap || prefersReducedMotion()) return;

  const paths = [...wrap.querySelectorAll('path')];
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = len;
  });
  gsap.to(paths, {
    strokeDashoffset: 0,
    duration: 1.4,
    ease: 'power2.inOut',
    stagger: 0.08,
    scrollTrigger: { trigger: wrap, start: 'top 90%', once: true },
  });
}
