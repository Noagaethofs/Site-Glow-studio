/**
 * GLOW — point d'entrée JavaScript.
 * Chaque module est autonome et ne s'active que si ses éléments sont
 * présents dans la page : le même fichier sert toutes les pages.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { prefersReducedMotion } from './modules/env.js';
import { initSmoothScroll } from './modules/smooth.js';
import { initAnchors, scrollToInitialHash } from './modules/anchors.js';
import { runLoader } from './modules/loader.js';
import { initHeader } from './modules/header.js';
import { initMenu } from './modules/menu.js';
import { initCursor } from './modules/cursor.js';
import { initReveals } from './modules/reveals.js';
import { initHero } from './modules/hero.js';
import { initMethod } from './modules/method.js';
import { initWork } from './modules/work.js';
import { initForms } from './modules/form.js';
import { initLightbox } from './modules/lightbox.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
history.scrollRestoration = 'manual';

async function boot() {
  const reduced = prefersReducedMotion();

  initSmoothScroll();
  initHeader();
  const menu = initMenu();
  initAnchors({ onNavigate: () => menu.close() });
  initCursor();
  initForms();
  initLightbox();

  // Lien de navigation de la page courante
  document.querySelectorAll('.header__nav a, .menu__list a').forEach((a) => {
    const url = new URL(a.href);
    if (!url.hash && url.pathname === location.pathname) a.setAttribute('aria-current', 'page');
  });

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Les découpes de lignes dépendent des polices : on attend qu'elles soient prêtes
  await document.fonts?.ready;

  const hero = initHero();
  initMethod();
  initWork();
  if (!reduced) initReveals();

  await runLoader();
  hero.intro();

  ScrollTrigger.refresh();
  scrollToInitialHash();

  // Les images chargées tard peuvent décaler les déclencheurs
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // Repère les contenus encore à compléter (utile avant la mise en ligne)
  const todos = document.querySelectorAll('.todo').length;
  if (todos && import.meta.env.DEV) console.info(`[GLOW] ${todos} contenu(s) à compléter sur cette page (.todo)`);
}

boot();
