// Avatars 3D « dessin animé » de chaque animal, affichés dans un badge rond sur sa carte.
// Un seul moteur 3D dessine l'animal de la carte visible, puis copie l'image dans son badge.
(async () => {
  const badges = [...document.querySelectorAll('.cap canvas.avatar')];
  if (!badges.length) return;
  let THREE;
  try {
    THREE = window.THREE || await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (e) { return; }

  const SIZE = 256;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
  catch (e) { return; }
  renderer.setSize(SIZE, SIZE, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const grad = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const mats = {};
  const toon = c => mats[c] ||= new THREE.MeshToonMaterial({ color: c, gradientMap: grad });
  const lineMat = new THREE.MeshBasicMaterial({ color: '#111', side: THREE.BackSide });
  function part(parent, geo, color, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], line = 1.06 } = {}) {
    const m = new THREE.Mesh(geo, toon(color));
    m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
    if (line) { const o = new THREE.Mesh(geo, lineMat); o.scale.setScalar(line); m.add(o); }
    parent.add(m);
    return m;
  }
  const sph = (r, w = 24) => new THREE.SphereGeometry(r, w, Math.round(w * .75));
  const cyl = (a, b, h) => new THREE.CylinderGeometry(a, b, h, 14);
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 16);
  const eyes = (head, x, y, z, r = .045) => {
    for (const s of [1, -1]) {
      part(head, sph(r), '#111', { p: [s * x, y, z], line: 0 });
      part(head, sph(r * .35), '#fff', { p: [s * x + r * .3, y + r * .35, z + r * .7], line: 0 });
    }
  };

  // --- Yellow : golden retriever crème ---
  function yellow() {
    const g = new THREE.Group(), anim = [];
    const fur = '#f0d4a0', ear = '#ddb172', light = '#f9ead0';
    part(g, cap(.3, .45), fur, { p: [0, .62, -.05], r: [Math.PI / 2 - .5, 0, 0] }); // corps assis
    for (const s of [1, -1]) {
      part(g, cyl(.08, .07, .5), fur, { p: [s * .16, .27, .22] });            // pattes avant
      part(g, sph(.17), fur, { p: [s * .2, .25, -.22], s: [.8, .9, 1.2] });    // cuisses
    }
    const head = new THREE.Group(); head.position.set(0, 1.12, .2); g.add(head);
    part(head, sph(.3), fur);
    part(head, sph(.15), light, { p: [0, -.08, .25], s: [1, .8, 1.25] });
    part(head, sph(.06), '#111', { p: [0, -.02, .43], line: 0 });
    eyes(head, .12, .07, .25);
    for (const s of [1, -1]) part(head, sph(.17), ear, { p: [s * .28, -.04, -.02], s: [.38, 1.05, .7], r: [0, 0, s * .22] });
    part(head, new THREE.TorusGeometry(.21, .04, 8, 24), '#ff8fb8', { p: [0, -.26, -.05], r: [Math.PI / 2 - .25, 0, 0] });
    const tail = new THREE.Group(); tail.position.set(0, .35, -.42); g.add(tail);
    part(tail, cap(.06, .3), fur, { p: [0, .05, -.18], r: [-1.1, 0, 0] });
    anim.push(t => { tail.rotation.y = Math.sin(t * 9) * .7; head.rotation.z = Math.sin(t * 1.2) * .14; });
    return { g, anim, target: [0, .72, 0], dist: 2.55 };
  }

  // --- Lapin tête de lion (Plume tricolore, Espoir gris) ---
  function lionhead({ fur, mane, earCol, patches = [] }) {
    const g = new THREE.Group(), anim = [];
    const body = new THREE.Group(); g.add(body);
    part(body, sph(.32), fur, { p: [0, .3, -.06], s: [1, .88, 1.15] });
    part(body, sph(.1), mane, { p: [0, .32, -.42] }); // queue
    for (const s of [1, -1]) part(body, sph(.09), fur, { p: [s * .13, .06, .22], s: [1, .6, 1.5] });
    for (const pt of patches) part(body, sph(pt.r), pt.c, { p: pt.p, s: pt.s || [1, 1, 1], line: 0 });
    const head = new THREE.Group(); head.position.set(0, .66, .18); body.add(head);
    part(head, sph(.22), fur);
    // la crinière : une couronne de touffes autour de la tête
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2;
      part(head, sph(.09), mane, { p: [Math.cos(a) * .22, Math.sin(a) * .2 + .02, -.06], line: 1.04 });
    }
    const nose = part(head, sph(.035), '#ff8fb8', { p: [0, -.04, .215], line: 0 });
    eyes(head, .1, .04, .17, .04);
    const ears = [];
    for (const s of [1, -1]) {
      const e = new THREE.Group(); e.position.set(s * .08, .17, -.02); head.add(e);
      part(e, cap(.055, .16), earCol, { p: [0, .12, 0], s: [1, 1, .55] });
      e.rotation.z = -s * .2; ears.push(e);
    }
    anim.push(t => {
      nose.scale.setScalar(1 + Math.max(0, Math.sin(t * 9)) * .25);
      ears[0].rotation.x = Math.sin(t * 2.6) * .15;
      ears[1].rotation.x = Math.sin(t * 2.6 + 1) * .15;
      body.position.y = Math.max(0, Math.sin(t * 2)) ** 8 * .12;
    });
    return { g, anim, target: [0, .48, 0], dist: 1.95 };
  }

  const builders = {
    yellow,
    plume: () => lionhead({
      fur: '#f4e8d6', mane: '#efe0c8', earCol: '#b7a493',
      patches: [
        { c: '#3b3030', r: .1, p: [-.1, .66 + .02, .36], s: [.6, 1.1, .3] },  // tache sombre sur la joue
        { c: '#a06d47', r: .16, p: [.18, .42, -.05], s: [.6, .7, 1] },        // tache rousse sur le flanc
        { c: '#3b3030', r: .12, p: [.05, .5, -.3], s: [1, .6, .8] }           // tache sombre sur le dos
      ]
    }),
    espoir: () => lionhead({ fur: '#9d9ca9', mane: '#b9b8c4', earCol: '#8a8997' })
  };

  // Une scène par badge
  const views = badges.map(cv => {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#ffd6e6', 2.1));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.8); sun.position.set(2, 4, 3); scene.add(sun);
    const m = (builders[cv.dataset.avatar] || yellow)();
    scene.add(m.g);
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
    const t = new THREE.Vector3(...m.target);
    camera.position.set(t.x + m.dist * .45, t.y + m.dist * .18, t.z + m.dist * .9);
    camera.lookAt(t);
    const ctx = cv.getContext('2d');
    cv.width = cv.height = SIZE;
    return { cv, ctx, scene, camera, m, card: cv.closest('.cap') };
  });

  const clock = new THREE.Clock();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let first = true;
  const frame = () => {
    const t = still ? 1 : clock.getElapsedTime();
    for (const v of views) {
      if (!first && !v.card.classList.contains('on')) continue; // seules les cartes visibles s'animent
      v.m.g.rotation.y = Math.sin(t * .6) * .45;
      for (const a of v.m.anim) a(t);
      renderer.render(v.scene, v.camera);
      v.ctx.clearRect(0, 0, SIZE, SIZE);
      v.ctx.drawImage(renderer.domElement, 0, 0, SIZE, SIZE);
    }
    first = false;
    requestAnimationFrame(frame);
  };
  frame();
})();
