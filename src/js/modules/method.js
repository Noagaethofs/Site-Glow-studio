/**
 * GLOW Method — un fil conducteur relie les 5 étapes.
 * Desktop : la piste défile horizontalement pendant que la section est
 * pinnée ; le fil se remplit et chaque étape s'allume quand il atteint son point.
 * Mobile : fil vertical qui se remplit au scroll, mêmes étapes allumées.
 */
import { gsap } from 'gsap';
import { MQ, prefersReducedMotion } from './env.js';

export function initMethod() {
  const section = document.querySelector('[data-method]');
  if (!section) return;

  const pin = section.querySelector('[data-method-pin]');
  const rail = section.querySelector('[data-method-track]');
  const fill = section.querySelector('[data-method-fill]');
  const steps = [...section.querySelectorAll('.step')];
  const dots = steps.map((s) => s.querySelector('.step__dot'));

  // Allume les étapes dont le point est déjà atteint par l'avant du fil
  const syncDots = (axis) => {
    const f = fill.getBoundingClientRect();
    const front = axis === 'x' ? f.right : f.bottom;
    dots.forEach((d, i) => {
      const r = d.getBoundingClientRect();
      const pos = axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2;
      steps[i].classList.toggle('is-reached', front >= pos - 1);
    });
  };

  // Sans animation : tout est allumé, fil plein
  if (prefersReducedMotion()) {
    steps.forEach((s) => s.classList.add('is-reached'));
    gsap.set(fill, { scaleX: 1, scaleY: 1 });
    return;
  }

  const mm = gsap.matchMedia();

  mm.add(MQ.desktop, () => {
    section.classList.add('is-horizontal');
    const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: () => syncDots('x'),
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance() + window.innerHeight * 0.3}`,
        pin,
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
    tl.to(rail, { x: () => -distance(), duration: 1 }, 0)
      .fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1.1 }, 0);

    syncDots('x');

    return () => {
      section.classList.remove('is-horizontal');
      steps.forEach((s) => s.classList.remove('is-reached'));
      gsap.set(fill, { clearProps: 'transform' });
    };
  });

  mm.add(`not all and ${MQ.desktop}`, () => {
    const track = section.querySelector('.method__track');
    const fillTween = gsap.fromTo(fill, { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      onUpdate: () => syncDots('y'),
      scrollTrigger: { trigger: track, start: 'top 65%', end: 'bottom 65%', scrub: true },
    });
    syncDots('y');
    return () => {
      fillTween.scrollTrigger?.kill();
      fillTween.kill();
      steps.forEach((s) => s.classList.remove('is-reached'));
    };
  });
}
