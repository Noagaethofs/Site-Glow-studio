/**
 * Menu plein écran (mobile / tablette).
 * Accessible : aria-expanded, Échap pour fermer, focus géré.
 */
import { gsap } from 'gsap';
import { stopScroll, startScroll } from './smooth.js';
import { prefersReducedMotion } from './env.js';

export function initMenu() {
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-menu]');
  if (!burger || !menu) return { close() {} };

  const label = burger.querySelector('.header__burger-label');
  const links = menu.querySelectorAll('.menu__list a');
  let open = false;

  const set = (state) => {
    open = state;
    burger.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Fermer' : 'Menu';
    document.body.classList.toggle('menu-open', open);

    if (open) {
      menu.hidden = false;
      stopScroll();
      if (!prefersReducedMotion()) {
        gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.out' });
        gsap.fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.04, delay: 0.1 });
      }
      links[0]?.focus({ preventScroll: true });
    } else {
      startScroll();
      if (prefersReducedMotion()) { menu.hidden = true; return; }
      gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'expo.in', onComplete: () => { menu.hidden = true; } });
    }
  };

  burger.addEventListener('click', () => set(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { set(false); burger.focus(); }
  });
  links.forEach((a) => a.addEventListener('click', () => set(false)));

  // Repasse en desktop menu ouvert : on ferme proprement
  matchMedia('(min-width: 64em)').addEventListener('change', (e) => { if (e.matches && open) set(false); });

  return { close: () => open && set(false) };
}
