// Travelling de la page d'accueil : une suite d'images affichée au rythme du défilement.
// Plus fluide qu'une vidéo, car le navigateur n'a jamais besoin de « chercher » dans un fichier.
(() => {
  const section = document.getElementById('accueil');
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const intro = document.getElementById('intro');
  const scrim = section.querySelector('.scrim');
  const hint = document.getElementById('hint');
  const rail = document.getElementById('rail');
  const base = canvas.dataset.frames; // ex. « assets/travelling-frames »
  const caps = [...section.querySelectorAll('.cap')].map(el => ({
    el, start: parseFloat(el.dataset.start), end: parseFloat(el.dataset.end)
  }));

  rail.innerHTML = '<span></span>'.repeat(caps.length + 1);
  const dots = [...rail.children];

  let meta = null;          // fps, nombre d'images, positions dans le fichier
  let blobs = [];           // image compressée par numéro
  const bitmaps = new Map(); // images décodées (cache limité)
  const decoding = new Set();
  const MAX_DECODED = 40;
  let target = 0, current = 0, drawn = -1, dirty = true;

  // --- Dessin « cover » dans le canvas ---
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    dirty = true;
  };
  const draw = bmp => {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / bmp.width, ch / bmp.height);
    const w = bmp.width * s, h = bmp.height * s;
    ctx.drawImage(bmp, (cw - w) / 2, (ch - h) / 2, w, h);
  };

  // --- Décodage à la demande, avec un petit cache ---
  const decode = i => {
    if (!blobs[i] || bitmaps.has(i) || decoding.has(i)) return;
    decoding.add(i);
    createImageBitmap(blobs[i]).then(bmp => {
      decoding.delete(i);
      bitmaps.set(i, bmp);
      if (bitmaps.size > MAX_DECODED) {
        // libère les images les plus éloignées de la position actuelle
        const pos = current * (meta.count - 1);
        const far = [...bitmaps.keys()].sort((a, b) => Math.abs(b - pos) - Math.abs(a - pos));
        for (const k of far.slice(0, bitmaps.size - MAX_DECODED)) { bitmaps.get(k).close?.(); bitmaps.delete(k); }
      }
      dirty = true;
    }).catch(() => decoding.delete(i));
  };
  const nearestLoaded = i => {
    for (let d = 0; d < meta.count; d++) {
      if (blobs[i - d]) return i - d;
      if (blobs[i + d]) return i + d;
    }
    return -1;
  };

  // --- Chargement progressif : on lit le fichier au fil de l'eau ---
  const load = async () => {
    const indexUrl = new URL(base + '.json', location.href);
    meta = await (await fetch(indexUrl)).json();
    blobs = new Array(meta.count);
    // une image sur huit d'abord, puis les autres : le défilement marche vite, puis s'affine
    const queue = meta.order.slice();
    const worker = async () => {
      while (queue.length) {
        const i = queue.shift();
        try {
          const res = await fetch(new URL(meta.dir + meta.files[i], indexUrl));
          blobs[i] = await res.blob();
          dirty = true;
        } catch (e) { /* image manquante : on garde la plus proche */ }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  };

  const readScroll = () => {
    const r = section.getBoundingClientRect();
    const span = r.height - innerHeight;
    target = Math.min(1, Math.max(0, -r.top / span));
  };

  const frame = () => {
    current += (target - current) * 0.2;
    if (meta) {
      const want = Math.round(current * (meta.count - 1));
      const i = blobs[want] ? want : nearestLoaded(want);
      if (i >= 0) {
        decode(i);
        decode(Math.min(meta.count - 1, i + 1));
        decode(Math.max(0, i - 1));
        if (bitmaps.has(i) && (drawn !== i || dirty)) { draw(bitmaps.get(i)); drawn = i; dirty = false; canvas.classList.add('ready'); }
        else if (!bitmaps.has(i) && dirty) {
          // en attendant le décodage, affiche l'image décodée la plus proche
          let best = -1;
          for (const k of bitmaps.keys()) if (best < 0 || Math.abs(k - want) < Math.abs(best - want)) best = k;
          if (best >= 0) { draw(bitmaps.get(best)); drawn = best; dirty = false; canvas.classList.add('ready'); }
        }
      }
    }
    const t = meta ? current * (meta.count - 1) / meta.fps : 0;
    const fade = Math.max(0, 1 - t / 1.4);
    intro.style.opacity = fade;
    scrim.style.opacity = fade;
    intro.style.transform = `translateY(${-t * 30}px)`;
    intro.style.pointerEvents = t < 0.6 ? 'auto' : 'none';
    hint.style.opacity = t < 0.4 ? 1 : 0;
    let active = 0;
    caps.forEach((c, n) => {
      const on = t >= c.start && t <= c.end;
      c.el.classList.toggle('on', on);
      if (on) active = n + 1;
    });
    dots.forEach((d, n) => d.classList.toggle('on', n === active));
    requestAnimationFrame(frame);
  };

  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { resize(); readScroll(); });
  resize();
  readScroll();
  load().catch(() => { /* l'image d'attente reste affichée */ });
  frame();

  window.__state = () => ({ drawn, want: meta ? Math.round(current * (meta.count - 1)) : -1, loaded: blobs.filter(Boolean).length, decoded: bitmaps.size });
  // Permet de sauter directement à un instant en secondes (aperçus, tests)
  window.__jumpTo = s => { if (meta) target = current = Math.min(1, s * meta.fps / (meta.count - 1)); };
})();
