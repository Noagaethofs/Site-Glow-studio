/**
 * Liens d'ancrage : défilement fluide vers les sections de la page courante,
 * y compris les liens « /#section » quand on est déjà sur l'accueil.
 * Gère aussi l'arrivée sur une page avec un #hash (après création des pins).
 */
import { scrollToTarget } from './smooth.js';

export function initAnchors({ onNavigate } = {}) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey) return;

    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;

    const target = url.hash === '#top' ? 0 : document.querySelector(decodeURIComponent(url.hash));
    if (target === null) return;

    e.preventDefault();
    onNavigate?.(link);
    scrollToTarget(target);
    history.replaceState(null, '', url.hash === '#top' ? location.pathname : url.hash);

    // Accessibilité : on déplace le focus dans la section visée
    if (target instanceof HTMLElement) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
}

/** À appeler une fois les ScrollTrigger créés : recale sur le hash d'arrivée. */
export function scrollToInitialHash() {
  if (!location.hash) return;
  const el = document.querySelector(decodeURIComponent(location.hash));
  if (el) requestAnimationFrame(() => scrollToTarget(el, { immediate: true }));
}
