/**
 * Intro de chargement.
 *  1. Une lumière douce aux couleurs du logo apparaît.
 *  2. Le logo GLOW se dessine trait par trait, puis « STUDIO ».
 *  3. Le compteur suit le chargement réel de la page (polices + images).
 *  4. Le site apparaît à travers une ouverture circulaire qui part du O.
 * Version courte (≈ 1 s) si l'intro a déjà été vue pendant la session.
 * La classe `is-loading` est posée par un script inline dans le header.
 */
import { gsap } from 'gsap';
import { isDesktop } from './env.js';
import { prepareLogo } from './logo-draw.js';

const pageLoaded = () => new Promise((resolve) => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', resolve, { once: true });
});

export function runLoader() {
  const root = document.documentElement;
  const loader = document.querySelector('[data-loader]');
  if (!loader || !root.classList.contains('is-loading')) return Promise.resolve();

  const short = root.dataset.intro === 'short';
  const light = loader.querySelector('.loader__light');
  const logo = loader.querySelector('.loader__logo');
  const glyphs = prepareLogo([...loader.querySelectorAll('.logo__glow path')], 1.8);
  const studio = prepareLogo([...loader.querySelectorAll('.logo__studio path')], 0.8);
  const ring = loader.querySelector('.logo__o');
  const count = loader.querySelector('[data-loader-count]');
  const tag = loader.querySelector('.loader__tag');
  const counter = { v: 0 };
  loader.classList.add('is-drawing');
  const speed = short ? 0.45 : 1;

  return new Promise((resolve) => {
    const intro = gsap.timeline();
    intro
      .to(light, { opacity: 1, duration: 1.2 * speed, ease: 'power2.out' }, 0)
      .fromTo(light, { rotate: -8, scale: 0.9 }, { rotate: 8, scale: 1.05, duration: 3, ease: 'sine.inOut' }, 0)
      // contour qui se trace, puis remplissage : le logo reste celui du fichier d'origine
      .to(glyphs, { strokeDashoffset: 0, duration: 0.9 * speed, ease: 'power2.inOut', stagger: 0.12 * speed }, 0.1)
      .to(glyphs, { fillOpacity: 1, duration: 0.5 * speed, ease: 'power1.out', stagger: 0.12 * speed }, 0.75 * speed)
      .to(studio, { strokeDashoffset: 0, duration: 0.5 * speed, ease: 'power1.inOut', stagger: 0.05 * speed }, 0.8 * speed)
      .to(studio, { fillOpacity: 1, duration: 0.4 * speed, stagger: 0.05 * speed }, 1.1 * speed)
      .set([...glyphs, ...studio], { strokeWidth: 0 })
      .from(tag, { opacity: 0, y: 12, duration: 0.6, ease: 'expo.out' }, 0.6 * speed)
      .to(counter, {
        v: 90, duration: 1.4 * speed, ease: 'power1.inOut',
        onUpdate: () => { count.textContent = Math.round(counter.v); },
      }, 0);

    // On attend la fin du dessin ET le chargement de la page (max 3,5 s)
    const ready = Promise.race([pageLoaded(), new Promise((r) => setTimeout(r, 3500))]);
    Promise.all([ready, new Promise((r) => intro.eventCallback('onComplete', r))]).then(() => {
      // centre de l'ouverture = centre du O du logo, à l'écran
      const o = ring.getBoundingClientRect();
      const cx = o.left + o.width / 2;
      const cy = o.top + o.height / 2;
      const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      loader.style.setProperty('--hx', `${cx}px`);
      loader.style.setProperty('--hy', `${cy}px`);
      const hole = { r: 0 };
      const desktop = isDesktop();

      // Mobile : sortie plus légère (fondu), sans masque animé
      if (!desktop) {
        gsap.timeline({ onComplete: () => { root.classList.remove('is-loading'); loader.remove(); } })
          .to(counter, { v: 100, duration: 0.25, ease: 'none', onUpdate: () => { count.textContent = Math.round(counter.v); } })
          .to(logo, { scale: 1.15, opacity: 0, duration: 0.6, ease: 'expo.in' })
          .to(loader, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.15')
          .call(resolve, null, '<');
        return;
      }
      loader.classList.add('is-opening');

      gsap.timeline({
        onComplete: () => {
          root.classList.remove('is-loading');
          loader.remove();
        },
      })
        .to(counter, { v: 100, duration: 0.3, ease: 'none', onUpdate: () => { count.textContent = Math.round(counter.v); } })
        .to(ring, { scale: 0.86, svgOrigin: '649 292', duration: 0.35, ease: 'power2.in' })
        .to(hole, {
          r: far + 40,
          duration: 1.1 * (short ? 0.75 : 1),
          ease: 'expo.inOut',
          onUpdate: () => loader.style.setProperty('--hole', `${hole.r}px`),
        })
        .to(logo, { scale: 1.6, opacity: 0, duration: 0.9, ease: 'expo.in' }, '<')
        .to([count, tag], { opacity: 0, duration: 0.3 }, '<')
        // la page démarre son intro pendant que l'ouverture s'agrandit
        .call(resolve, null, '<0.35');
    });
  });
}
