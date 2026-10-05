/**
 * Curseur personnalisé discret : point en mix-blend « difference »,
 * qui grossit sur les liens et affiche un libellé sur les projets.
 * Desktop avec souris uniquement, jamais en reduced-motion.
 */
import { gsap } from 'gsap';
import { hasFinePointer, prefersReducedMotion } from './env.js';

export function initCursor() {
  const cursor = document.querySelector('[data-cursor]');
  if (!cursor || !hasFinePointer() || prefersReducedMotion()) return;

  const label = cursor.querySelector('[data-cursor-label]');
  document.documentElement.classList.add('has-cursor');

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

  let moved = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    moved = true;
    xTo(e.clientX);
    yTo(e.clientY);
    cursor.classList.remove('is-hidden');
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const textTarget = e.target.closest('[data-cursor-text]');
    const linkTarget = e.target.closest('a, button, summary, label, [role="button"]');
    const field = e.target.closest('input, textarea, select');
    cursor.classList.toggle('is-text', !!textTarget);
    cursor.classList.toggle('is-link', !textTarget && !!linkTarget);
    cursor.classList.toggle('is-hidden', !moved || !!field);
    label.textContent = textTarget ? textTarget.dataset.cursorText : '';
  });

  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
}
