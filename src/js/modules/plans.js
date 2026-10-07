/**
 * Offres : sélecteur de formule (onglets accessibles).
 * Sans JavaScript, les trois formules restent visibles l'une sous l'autre.
 * Clavier : ← → (ou ↑ ↓) pour changer de formule, Début / Fin.
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from './env.js';

export function initPlans() {
  const root = document.querySelector('[data-plans]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

  const select = (i, { focus = false, animate = true } = {}) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
    if (animate && !prefersReducedMotion()) {
      gsap.fromTo(panels[i].children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
    }
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let n = null;
      if (e.key in keys) n = (i + keys[e.key] + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); select(n, { focus: true }); }
    });
  });

  const start = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
  select(start, { animate: false });
}
