/**
 * Vidéos [data-autoplay] : elles ne se chargent et ne jouent que lorsqu'elles
 * sont visibles à l'écran (économie de données sur mobile), et se mettent en
 * pause dès qu'elles sortent. En reduced-motion, on garde l'image fixe (poster).
 *
 * Safari (iPhone) : la lecture automatique peut être refusée, par exemple en mode
 * économie d'énergie. Dans ce cas on réessaie au premier toucher de l'écran.
 */
import { prefersReducedMotion } from './env.js';

export function initVideos() {
  const videos = document.querySelectorAll('video[data-autoplay]');
  if (!videos.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const visible = new Set();
  const play = (v) => {
    if (v.preload === 'none') v.preload = 'auto';
    // lecture refusée : le poster reste affiché, on réessaie au prochain geste
    v.play().catch(() => document.addEventListener('touchend', retry, { once: true, passive: true }));
  };
  const retry = () => visible.forEach(play);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) {
          visible.add(v);
          play(v);
        } else {
          visible.delete(v);
          v.pause();
        }
      });
    },
    { threshold: 0.25 },
  );

  videos.forEach((v) => {
    // Safari exige ces deux réglages pour lire sans le son, dans la page
    v.muted = true;
    v.playsInline = true;
    io.observe(v);
  });
}
