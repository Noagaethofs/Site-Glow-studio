/**
 * Hero « L'ouverture ».
 * Le O du grand logo SVG est un anneau ; la couche vidéo est découpée en
 * cercle exactement dans son ouverture (clip-path). Sur desktop, la section
 * est pinnée et le cercle s'ouvre au scroll jusqu'à remplir l'écran.
 * Une lumière douce (couleurs du logo) suit lentement le curseur.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MQ, prefersReducedMotion } from './env.js';

// Géométrie du O dans le repère du logo (voir partials/logo.html)
const O = { cx: 649, cy: 292, hole: 69 }; // centre et rayon de l'ouverture du O

export function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return { intro: () => {} };

  const stage = hero.querySelector('[data-hero-stage]');
  const media = hero.querySelector('[data-hero-media]');
  const mark = hero.querySelector('[data-hero-mark]');
  const ring = hero.querySelector('[data-hero-o]');
  const gl = hero.querySelector('[data-hero-gl]');
  const w = hero.querySelector('[data-hero-w]');
  const studio = hero.querySelector('[data-hero-studio]');
  const title = hero.querySelector('[data-hero-title]');
  const light = hero.querySelector('[data-hero-light]');
  const fades = hero.querySelectorAll('[data-hero-fade]');

  // --- Géométrie de l'ouverture ---------------------------------------
  const geo = { x: 0, y: 0, r: 0, max: 0 };
  const state = { k: 1 }; // facteur d'agrandissement de l'ouverture
  let scrollTl = null;

  // Mesure à partir de la boîte du SVG (jamais transformé) : insensible
  // aux animations en cours sur les lettres.
  const measure = () => {
    const s = stage.getBoundingClientRect();
    const m = mark.getBoundingClientRect();
    const vb = mark.viewBox.baseVal;
    const scale = m.width / vb.width;
    geo.x = m.left - s.left + (O.cx - vb.x) * scale;
    geo.y = m.top - s.top + (O.cy - vb.y) * scale;
    geo.r = O.hole * scale + 1;
    geo.max = Math.hypot(Math.max(geo.x, s.width - geo.x), Math.max(geo.y, s.height - geo.y)) + 4;
  };
  const applyClip = () => {
    media.style.clipPath = `circle(${(geo.r * state.k).toFixed(1)}px at ${geo.x.toFixed(1)}px ${geo.y.toFixed(1)}px)`;
  };
  const sync = () => {
    measure();
    if (!scrollTl || scrollTl.scrollTrigger.progress === 0) state.k = Math.min(state.k, 1);
    applyClip();
    gsap.set(light, { x: geo.x, y: geo.y });
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
      .fromTo(state, { k: 1 }, { k: () => geo.max / geo.r, duration: 1, ease: 'power2.in', onUpdate: applyClip }, 0)
      .to(ring, { scale: 2.6, opacity: 0, svgOrigin: `${O.cx} ${O.cy}`, duration: 0.45, ease: 'power1.in' }, 0)
      .to(gl, { x: -520, opacity: 0, duration: 0.6 }, 0)
      .to(w, { x: 560, opacity: 0, duration: 0.6 }, 0)
      .to(studio, { y: 60, opacity: 0, duration: 0.35 }, 0)
      .to(fades, { yPercent: -40, opacity: 0, duration: 0.45, stagger: 0.04 }, 0)
      .to(light, { opacity: 0, duration: 0.5 }, 0)
      .to({}, { duration: 0.2 }); // courte tenue en plein cadre

    return () => { scrollTl = null; sync(); };
  });

  // --- Curseur : la lumière suit, la composition réagit à peine --------
  mm.add(`${MQ.desktop} and ${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
    const lx = gsap.quickTo(light, 'x', { duration: 2.2, ease: 'power3.out' });
    const ly = gsap.quickTo(light, 'y', { duration: 2.2, ease: 'power3.out' });
    const tx = gsap.quickTo(title, 'x', { duration: 1.2, ease: 'power3.out' });
    const onMove = (e) => {
      if (window.scrollY > window.innerHeight * 0.2) return;
      const s = stage.getBoundingClientRect();
      // la lumière reste attirée par le O : mélange position du O / curseur
      lx(geo.x + (e.clientX - s.left - geo.x) * 0.45);
      ly(geo.y + (e.clientY - s.top - geo.y) * 0.45);
      tx((e.clientX / window.innerWidth - 0.5) * -18);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  });

  // Respiration lente de la lumière (desktop uniquement, très subtile)
  mm.add(`${MQ.desktop} and (prefers-reduced-motion: no-preference)`, () => {
    gsap.to(light, { scale: 1.12, rotate: 25, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });

  // --- Intro d'entrée -------------------------------------------------
  // Construite tout de suite (en pause) pour que l'état de départ soit posé
  // sous le loader, puis jouée quand l'ouverture du loader commence.
  let introTl = null;
  if (!prefersReducedMotion()) {
    // Pas de découpe en mots : elle casse le texte en dégradé (« Shine »)
    introTl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    introTl.from([gl, w], { y: 140, opacity: 0, duration: 1.3, stagger: 0.08 }, 0)
      .from(studio, { opacity: 0, y: 20, duration: 1 }, 0.4)
      .from(ring, { scale: 0.4, opacity: 0, svgOrigin: `${O.cx} ${O.cy}`, duration: 1.3 }, 0.05)
      .fromTo(state, { k: 0 }, { k: 1, duration: 1.3, ease: 'expo.inOut', onUpdate: applyClip, immediateRender: false }, 0.1)
      .from(title, { y: 60, opacity: 0, duration: 1.1 }, 0.3)
      .from(fades[0], { opacity: 0, y: 12, duration: 0.8 }, 0.5)
      .from(hero.querySelectorAll('.hero__side > *'), { opacity: 0, y: 20, duration: 1, stagger: 0.08 }, 0.55)
  }
  const intro = () => introTl?.play();

  return { intro };
}
