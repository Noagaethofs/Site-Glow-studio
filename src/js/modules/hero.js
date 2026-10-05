/**
 * Hero « L'ouverture ».
 * Le O de GLOW est un anneau ; la couche vidéo est découpée en ellipse
 * exactement dans son ouverture (clip-path). Sur desktop, la section est
 * pinnée et le cercle s'ouvre au scroll jusqu'à remplir l'écran.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MQ, prefersReducedMotion } from './env.js';

export function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return { intro: () => {} };

  const stage = hero.querySelector('[data-hero-stage]');
  const media = hero.querySelector('[data-hero-media]');
  const ring = hero.querySelector('[data-hero-o]');
  const gl = hero.querySelector('[data-hero-gl]');
  const w = hero.querySelector('[data-hero-w]');
  const title = hero.querySelector('[data-hero-title]');
  const fades = hero.querySelectorAll('[data-hero-fade]');

  // --- Géométrie de l'ouverture ---------------------------------------
  // L'ouverture est une ellipse (le O de General Sans est plus fin en haut/bas)
  const geo = { x: 0, y: 0, rx: 0, ry: 0, kMax: 1 };
  const state = { k: 1 }; // facteur d'agrandissement de l'ouverture

  // Mesure par offsets (insensible aux transformations GSAP en cours).
  // L'offsetParent de l'anneau est .hero__inner, calé en haut à gauche du stage.
  const measure = () => {
    const w0 = stage.clientWidth;
    const h0 = stage.clientHeight;
    geo.x = ring.offsetLeft + ring.offsetWidth / 2;
    geo.y = ring.offsetTop + ring.offsetHeight / 2;
    geo.rx = Math.max(1, ring.offsetWidth / 2 - ring.clientLeft + 1);
    geo.ry = Math.max(1, ring.offsetHeight / 2 - ring.clientTop + 1);
    const far = Math.hypot(Math.max(geo.x, w0 - geo.x), Math.max(geo.y, h0 - geo.y));
    geo.kMax = (far / Math.min(geo.rx, geo.ry)) * 1.05;
  };
  const applyClip = () => {
    const rx = (geo.rx * state.k).toFixed(1);
    const ry = (geo.ry * state.k).toFixed(1);
    media.style.clipPath = `ellipse(${rx}px ${ry}px at ${geo.x.toFixed(1)}px ${geo.y.toFixed(1)}px)`;
  };
  let scrollTl = null;
  const sync = () => {
    measure();
    // hors animation de scroll (ou tout en haut), le cercle épouse l'anneau
    if (!scrollTl || scrollTl.scrollTrigger.progress === 0) state.k = 1;
    applyClip();
  };
  sync();
  ScrollTrigger.addEventListener('refresh', sync);
  window.addEventListener('resize', sync);
  document.fonts?.ready.then(sync);

  // --- Scroll : ouverture (desktop, mouvement autorisé) ---------------
  const mm = gsap.matchMedia();
  mm.add(`${MQ.desktop} and (prefers-reduced-motion: no-preference)`, () => {
    scrollTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=120%',
        pin: stage,
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    });
    scrollTl
      .fromTo(state, { k: 1 }, { k: () => geo.kMax, duration: 1, ease: 'power2.in', onUpdate: applyClip }, 0)
      .to(ring, { scale: 2.4, opacity: 0, duration: 0.45, ease: 'power1.in' }, 0)
      .to(gl, { xPercent: -70, opacity: 0, duration: 0.6 }, 0)
      .to(w, { xPercent: 90, opacity: 0, duration: 0.6 }, 0)
      .to(fades, { yPercent: -40, opacity: 0, duration: 0.45, stagger: 0.04 }, 0)
      .to({}, { duration: 0.2 }); // courte tenue en plein cadre

    return () => { scrollTl = null; sync(); };
  });

  // --- Curseur : légère réaction de la composition --------------------
  mm.add(`${MQ.desktop} and ${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
    const tx = gsap.quickTo(title, 'x', { duration: 1.2, ease: 'power3.out' });
    const glx = gsap.quickTo(gl, 'x', { duration: 1.4, ease: 'power3.out' });
    const wx = gsap.quickTo(w, 'x', { duration: 1.4, ease: 'power3.out' });
    const onMove = (e) => {
      if (window.scrollY > window.innerHeight * 0.2) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      tx(nx * -24);
      glx(nx * 14);
      wx(nx * -14);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  });

  // --- Intro d'entrée (après le loader) --------------------------------
  const intro = () => {
    if (prefersReducedMotion()) return;
    const split = SplitText.create(title, { type: 'words', mask: 'words' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(split.words, { yPercent: 110, duration: 1.2, stagger: 0.08 }, 0)
      .from([gl, w], { yPercent: 100, duration: 1.3, stagger: 0.06 }, 0.1)
      .from(ring, { scale: 0, duration: 1.3, ease: 'expo.inOut', onUpdate: applyClip }, 0.15)
      .fromTo(state, { k: 0 }, { k: 1, duration: 1.3, ease: 'expo.inOut', onUpdate: applyClip }, 0.15)
      .from(fades[0], { opacity: 0, y: 12, duration: 0.8 }, 0.5)
      .from(fades[2], { opacity: 0, y: 20, duration: 1 }, 0.6)
      .add(() => split.revert());
  };

  return { intro };
}
