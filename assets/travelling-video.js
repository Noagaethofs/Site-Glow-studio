// Travelling vidéo de la page d'accueil : la vidéo avance avec le défilement
(() => {
  const section = document.getElementById('accueil');
  const video = document.getElementById('hero-video');
  const intro = document.getElementById('intro');
  const hint = document.getElementById('hint');
  const rail = document.getElementById('rail');
  const scrim = section.querySelector('.scrim');
  const caps = [...section.querySelectorAll('.cap')].map(el => ({
    el, start: parseFloat(el.dataset.start), end: parseFloat(el.dataset.end)
  }));

  // Un point par étape : l'intro, puis chaque animal
  rail.innerHTML = '<span></span>'.repeat(caps.length + 1);
  const dots = [...rail.children];

  let duration = 0, target = 0, current = 0, unlocked = false;

  const readScroll = () => {
    const r = section.getBoundingClientRect();
    const span = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / span));
    target = p * Math.max(0, duration - 0.05);
  };

  // iOS n'autorise le déplacement dans la vidéo qu'après une première lecture
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const pr = video.play();
    if (pr) pr.then(() => video.pause()).catch(() => { unlocked = false; });
  };
  ['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach(ev => addEventListener(ev, unlock, { passive: true, once: false }));

  video.addEventListener('loadedmetadata', () => { duration = video.duration || 0; readScroll(); });
  if (video.readyState >= 1) duration = video.duration || 0;
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);

  const frame = () => {
    current += (target - current) * 0.18;
    if (duration && !video.seeking && Math.abs(video.currentTime - current) > 1 / 60) {
      video.currentTime = current;
    }
    const t = current;
    const fade = Math.max(0, 1 - t / 1.4);
    intro.style.opacity = fade;
    scrim.style.opacity = fade;
    intro.style.transform = `translateY(${-t * 30}px)`;
    intro.style.pointerEvents = t < 0.6 ? 'auto' : 'none';
    hint.style.opacity = t < 0.4 ? 1 : 0;
    let active = 0;
    caps.forEach((c, i) => {
      const on = t >= c.start && t <= c.end;
      c.el.classList.toggle('on', on);
      if (on) active = i + 1;
    });
    dots.forEach((d, i) => d.classList.toggle('on', i === active));
    requestAnimationFrame(frame);
  };
  readScroll();
  frame();

  // Permet de sauter directement à un instant (aperçus, tests)
  window.__jumpTo = s => { target = current = s; };
})();
