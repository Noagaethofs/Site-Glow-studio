/**
 * Vidéos [data-autoplay] : elles ne se chargent et ne jouent que lorsqu'elles
 * sont visibles à l'écran (économie de données sur mobile), et se mettent en
 * pause dès qu'elles sortent. En reduced-motion, on garde l'image fixe (poster).
 */
import { prefersReducedMotion } from './env.js';

export function initVideos() {
  const videos = document.querySelectorAll('video[data-autoplay]');
  if (!videos.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          v.play().catch(() => {}); // lecture refusée : le poster reste affiché
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.25 },
  );

  videos.forEach((v) => io.observe(v));
}
