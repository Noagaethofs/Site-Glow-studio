/**
 * Réalisations : un écran (fenêtre de navigateur) affiche un projet.
 * La section reste en place pendant qu'on fait défiler la page : chaque
 * « cran » de défilement (glisser vers le haut / le bas, molette) fait
 * passer au projet suivant ou précédent, qui arrive verticalement dans
 * l'écran. Les infos à gauche changent avec le projet.
 * Les petits traits sous le texte permettent aussi d'aller à un projet.
 * Sans animation (reduced-motion) : pas de section bloquée, les traits
 * suffisent pour changer de projet.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env.js';
import { scrollToTarget } from './smooth.js';

export function initWork() {
  const root = document.querySelector('[data-cases]');
  if (!root) return;

  const cases = root.querySelector('.cases');
  const track = root.querySelector('[data-screen-track]');
  const slides = [...track.children];
  const infos = [...root.querySelectorAll('[data-case-info]')];
  const steps = [...root.querySelectorAll('[data-case-step]')];
  const url = root.querySelector('[data-case-url]');
  const count = root.querySelector('[data-case-count]');
  const n = slides.length;
  const anim = !prefersReducedMotion();
  let index = -1;

  const show = (i, dir = 1) => {
    if (i === index) return;
    index = i;
    gsap.to(track, { yPercent: -100 * index, duration: anim ? 0.9 : 0, ease: 'expo.inOut', overwrite: true });
    infos.forEach((el, j) => { el.hidden = j !== index; el.classList.toggle('is-active', j === index); });
    if (anim) {
      gsap.fromTo(infos[index].children,
        { y: 24 * dir, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05 });
    }
    steps.forEach((b, j) => b.setAttribute('aria-selected', String(j === index)));
    if (url) url.textContent = slides[index].dataset.url || '';
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  };

  show(0);

  if (!anim || n < 2) {
    steps.forEach((b, j) => b.addEventListener('click', () => show(j, j > index ? 1 : -1)));
    return;
  }

  // La section reste en place le temps de parcourir les projets
  const st = ScrollTrigger.create({
    trigger: cases,
    start: 'center center',
    end: () => `+=${window.innerHeight * 0.75 * (n - 1)}`,
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
      if (i !== index) show(i, self.direction);
    },
  });

  // Les traits : aller directement à un projet
  steps.forEach((b, j) => b.addEventListener('click', () => {
    scrollToTarget(st.start + ((st.end - st.start) * j) / (n - 1) + 1);
  }));
}
