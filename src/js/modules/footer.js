/**
 * Footer : le grand logo se dessine quand il entre à l'écran.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env.js';
import { prepareLogo, drawLogo } from './logo-draw.js';

export function initFooterLogo() {
  const wrap = document.querySelector('[data-footer-logo]');
  if (!wrap || prefersReducedMotion()) return;

  const paths = prepareLogo([...wrap.querySelectorAll('path')], 1.4);
  const tl = gsap.timeline({ paused: true });
  drawLogo(tl, paths, { draw: 1.2, stagger: 0.07 });
  ScrollTrigger.create({ trigger: wrap, start: 'top 90%', once: true, onEnter: () => tl.play() });
}
