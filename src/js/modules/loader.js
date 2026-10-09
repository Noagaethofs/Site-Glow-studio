/**
 * Intro de chargement.
 *  1. Une lumière douce aux couleurs du logo apparaît.
 *  2. Les contours de tout le logo GLOW STUDIO se tracent lentement…
 *  3. …puis le noir arrive d'un coup, sur tout le logo.
 *  4. Le visiteur fait défiler (molette, glissé du doigt, flèche, clic) :
 *     tout l'écran de chargement s'efface en fondu et le site apparaît.
 * Première visite de la session : on attend le geste du visiteur.
 * Visites suivantes : version courte, le fondu se fait tout seul.
 * La classe `is-loading` est posée par un script inline dans le header.
 */
import { gsap } from 'gsap';
import { prepareLogo } from './logo-draw.js';
import { stopScroll, startScroll } from './smooth.js';

const pageLoaded = () => new Promise((resolve) => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', resolve, { once: true });
});

/** Attend un geste « je veux descendre » : molette, glissé, touche ou clic. */
const waitForScrollIntent = (target) => new Promise((resolve) => {
  let touchY = null;
  const done = () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKey);
    target.removeEventListener('click', done);
    resolve();
  };
  // n'importe quel sens : molette, glissé du doigt vers le haut ou le bas
  const onWheel = (e) => { if (Math.abs(e.deltaY) > 4) done(); };
  const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
  const onTouchMove = (e) => { if (touchY !== null && Math.abs(touchY - e.touches[0].clientY) > 20) done(); };
  const onTouchEnd = (e) => { if (touchY !== null && Math.abs(touchY - e.changedTouches[0].clientY) > 20) done(); };
  const onKey = (e) => { if (['ArrowDown', 'PageDown', ' ', 'Enter', 'Spacebar'].includes(e.key)) { e.preventDefault(); done(); } };
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);
  target.addEventListener('click', done);
});

export function runLoader() {
  const root = document.documentElement;
  const loader = document.querySelector('[data-loader]');
  if (!loader || !root.classList.contains('is-loading')) return Promise.resolve();

  // Le JavaScript a démarré : on annule le filet de sécurité du header
  clearTimeout(window.__glowIntroSafety);
  stopScroll();
  window.scrollTo(0, 0);

  const short = root.dataset.intro === 'short';
  const speed = short ? 0.45 : 1;
  const light = loader.querySelector('.loader__light');
  const logo = loader.querySelector('.loader__logo');
  const glyphs = prepareLogo([...loader.querySelectorAll('.logo__glow path')], 1.8);
  const studio = prepareLogo([...loader.querySelectorAll('.logo__studio path')], 0.8);
  const all = [...glyphs, ...studio];
  const count = loader.querySelector('[data-loader-count]');
  const countBox = count.parentElement; // contient aussi le signe %
  const tag = loader.querySelector('.loader__tag');
  const hint = loader.querySelector('[data-loader-hint]');
  const counter = { v: 0 };
  loader.classList.add('is-drawing');

  return new Promise((resolve) => {
    const intro = gsap.timeline();
    intro
      .to(light, { opacity: 1, duration: 1.2 * speed, ease: 'power2.out' }, 0)
      .fromTo(light, { rotate: -8, scale: 0.9 }, { rotate: 8, scale: 1.05, duration: 3.2 * speed, ease: 'sine.inOut' }, 0)
      // 1. les contours se tracent, lentement, lettre après lettre
      .to(glyphs, { strokeDashoffset: 0, duration: 2 * speed, ease: 'power1.inOut', stagger: 0.22 * speed }, 0.2)
      .to(studio, { strokeDashoffset: 0, duration: 1.1 * speed, ease: 'power1.inOut', stagger: 0.08 * speed }, 1.3 * speed)
      // 2. puis le noir arrive d'un coup, sur tout le logo en même temps
      .to(all, { fillOpacity: 1, duration: 0.12, ease: 'none' }, 3.1 * speed)
      .set(all, { strokeWidth: 0 }, '>')
      .from(tag, { opacity: 0, y: 12, duration: 0.6, ease: 'expo.out' }, 2 * speed)
      .to(counter, {
        v: 100, duration: 3.1 * speed, ease: 'power1.inOut',
        onUpdate: () => { count.textContent = Math.round(counter.v); },
      }, 0);

    const exit = () => {
      gsap.killTweensOf(hint);
      window.scrollTo(0, 0);
      gsap.timeline({
        onComplete: () => {
          root.classList.remove('is-loading');
          loader.remove();
          startScroll();
        },
      })
        // tout l'écran s'efface d'un seul bloc, sans mouvement : fondu doux
        .to(loader, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
        // le hero démarre son entrée pendant le fondu
        .call(resolve, null, 0.25);
    };

    // On attend la fin du dessin ET le chargement de la page (max 3,5 s)
    const ready = Promise.race([pageLoaded(), new Promise((r) => setTimeout(r, 3500))]);
    const drawn = new Promise((r) => intro.eventCallback('onComplete', r));

    if (short) {
      Promise.all([ready, drawn]).then(exit);
      return;
    }

    // Première visite : on entre au premier geste (swipe, molette, clic, clavier),
    // même pendant le dessin du logo — il se termine alors en accéléré.
    loader.classList.add('is-waiting');
    let left = false;
    const leave = () => { if (!left) { left = true; exit(); } };
    waitForScrollIntent(loader).then(() => {
      if (intro.progress() < 1) {
        intro.timeScale(6);
        drawn.then(leave);
      } else leave();
    });
    // dessin terminé sans geste : on affiche l'invitation à défiler
    Promise.all([ready, drawn]).then(() => {
      if (left) return;
      gsap.to(countBox, { opacity: 0, duration: 0.4 });
      gsap.fromTo(hint, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' });
    });
  });
}
