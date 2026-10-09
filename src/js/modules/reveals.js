/**
 * Animations au scroll communes à toutes les pages.
 *   [data-split]        titres révélés ligne par ligne (masque)
 *   [data-reveal]       blocs qui apparaissent en montant légèrement
 *   [data-mask]         images révélées par masque + léger zoom arrière
 *   [data-parallax=x]   parallaxe vertical léger de l'image intérieure
 *   [data-scrub-words]  texte qui s'allume mot à mot au rythme du scroll
 * Les états initiaux ne sont posés qu'ici : sans JS ou en reduced-motion,
 * tout le contenu reste visible.
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { isDesktop } from './env.js';

export function initReveals(scope = document) {
  // Titres : lignes masquées qui montent (desktop).
  // Sur mobile, simple apparition du bloc : moins de calculs de mise en page.
  const desktop = isDesktop();
  scope.querySelectorAll('[data-split]').forEach((el) => {
    // Mobile, ou titre contenant du texte en dégradé (incompatible avec la découpe) :
    // simple apparition du bloc
    if (!desktop || el.querySelector('.glow-text')) {
      gsap.from(el, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
      return;
    }
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });

  // Blocs
  scope.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Images par masque
  scope.querySelectorAll('[data-mask]').forEach((el) => {
    const inner = el.firstElementChild;
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' },
    );
    if (inner) tl.from(inner, { scale: 1.25, duration: 1.6, ease: 'expo.out' }, 0.1);
  });

  // Parallaxe
  scope.querySelectorAll('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.08;
    const inner = el.firstElementChild;
    gsap.fromTo(
      inner,
      { yPercent: -speed * 100 },
      {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Hero de page : léger zoom arrière à l'arrivée puis parallaxe
  scope.querySelectorAll('[data-hero-zoom]').forEach((el) => {
    gsap.fromTo(el, { scale: 1.15 }, { scale: 1, duration: 2.2, ease: 'expo.out' });
    gsap.to(el, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  // Texte mot à mot
  scope.querySelectorAll('[data-scrub-words]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      wordsClass: 'w',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
          },
        ),
    });
  });
}
