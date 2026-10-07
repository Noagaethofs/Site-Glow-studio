/**
 * Réalisations : rail horizontal.
 * - Tactile : défilement natif avec aimantation (scroll-snap).
 * - Souris : on peut attraper et faire glisser le rail ; flèches précédent / suivant.
 * - Clavier : les flèches sont des boutons, les cartes des liens.
 */
export function initWork() {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const prev = document.querySelector('[data-rail-prev]');
  const next = document.querySelector('[data-rail-next]');
  const step = () => (rail.querySelector('.project')?.getBoundingClientRect().width ?? 300) + 24;

  const update = () => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    if (prev) prev.disabled = rail.scrollLeft <= 2;
    if (next) next.disabled = rail.scrollLeft >= max;
  };
  prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  rail.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  // Glisser à la souris (le tactile garde le comportement natif)
  let startX = 0;
  let startLeft = 0;
  let moved = false;
  let down = false;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = rail.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 6) { moved = true; rail.classList.add('is-dragging'); }
    if (moved) rail.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (moved) {
      // on laisse l'aimantation reprendre la main après le relâchement
      requestAnimationFrame(() => rail.classList.remove('is-dragging'));
    }
  });
  // un glisser ne doit pas ouvrir le projet
  rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  rail.addEventListener('dragstart', (e) => e.preventDefault());
}
