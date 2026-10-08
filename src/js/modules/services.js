/**
 * Services (desktop) : l'image fixe à gauche change selon le service lu.
 * Le service au centre de l'écran est net, les autres restent en retrait.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MQ } from './env.js';

export function initServices() {
  const root = document.querySelector('[data-services]');
  if (!root) return;
  const items = [...root.querySelectorAll('[data-service]')];
  const imgs = [...root.querySelectorAll('[data-service-img]')];
  const count = root.querySelector('[data-service-count]');

  const activate = (i) => {
    items.forEach((el, j) => el.classList.toggle('is-active', i === j));
    imgs.forEach((el, j) => el.classList.toggle('is-active', i === j));
    if (count) count.textContent = String(i + 1).padStart(2, '0');
  };

  gsap.matchMedia().add(MQ.desktop, () => {
    activate(0);
    const triggers = items.map((el, i) => ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) activate(i); },
    }));
    return () => triggers.forEach((t) => t.kill());
  });
}
