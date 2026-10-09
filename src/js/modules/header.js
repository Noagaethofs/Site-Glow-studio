/**
 * Header : se rétracte au scroll vers le bas, réapparaît au scroll vers le haut.
 * CTA mobile « Devis » : masqué quand le formulaire de contact est à l'écran.
 */
export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    header.classList.toggle('is-compact', y > 40);
    if (Math.abs(delta) > 4) {
      header.classList.toggle(
        'is-hidden',
        delta > 0 && y > 160 && !document.body.classList.contains('menu-open'),
      );
      lastY = y;
    }
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  // Le header réapparaît dès qu'un élément y reçoit le focus clavier
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const cta = document.querySelector('[data-sticky-cta]');
  const contact = document.querySelector('#contact, #reserver');
  if (cta && 'IntersectionObserver' in window) {
    // masqué tant que le hero (qui a son propre CTA) ou le formulaire est visible
    const hidden = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? hidden.add(e.target) : hidden.delete(e.target)));
        cta.classList.toggle('is-hidden', hidden.size > 0);
      },
      { rootMargin: '0px 0px -30% 0px' },
    );
    [document.querySelector('[data-hero], .page-hero'), contact]
      .filter(Boolean)
      .forEach((el) => io.observe(el));
  }
}
