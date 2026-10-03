// Couche 3D « jeu vidéo » posée sur le travelling réel : fleurs, herbes, papillons et pétales
// aux couleurs du site, qui défilent au premier plan avec le scroll et restent sur les bords.
(async () => {
  const canvas = document.getElementById('hero-3d');
  const section = document.getElementById('accueil');
  if (!canvas) return;
  let THREE;
  try {
    THREE = window.THREE || await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (e) { return; } // sans 3D, la vidéo seule reste affichée

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight('#ffffff', '#ffd6e6', 2.2));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.6);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  // Matériaux « cartoon » + contour noir, comme les cartes du site
  const grad = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const fadeables = []; // matériaux dont l'opacité suit la distance à la caméra
  const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: grad, transparent: true });
  const outline = () => new THREE.MeshBasicMaterial({ color: '#111', side: THREE.BackSide, transparent: true });

  function part(parent, geo, color, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], line = 1.08 } = {}) {
    const m = new THREE.Mesh(geo, toon(color));
    m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
    if (line) { const o = new THREE.Mesh(geo, outline()); o.scale.setScalar(line); m.add(o); }
    parent.add(m);
    return m;
  }
  const sph = (r, w = 16) => new THREE.SphereGeometry(r, w, Math.round(w * .75));
  const cyl = (a, b, h) => new THREE.CylinderGeometry(a, b, h, 10);

  const PINK = '#ff8fb8', YELLOW = '#ffd23f', BLUE = '#2340ff', MINT = '#7ee0c3', WHITE = '#ffffff';
  const petalsCols = [PINK, YELLOW, BLUE, WHITE];
  const rand = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  const LENGTH = 34;      // distance parcourue pendant tout le travelling
  const GROUND = -1.55;   // hauteur du sol sous la caméra
  const items = [];       // { obj, z, sway, kind }
  // sur écran vertical (téléphone), on rapproche les éléments du centre pour qu'ils restent dans le cadre
  const SPREAD = Math.min(1, Math.max(.4, (innerWidth / innerHeight) / 1.5));

  function flower(color) {
    const g = new THREE.Group();
    const h = .45 + rand() * .45;
    part(g, cyl(.025, .03, h), '#3fae6a', { p: [0, h / 2, 0], line: 1.25 });
    const head = new THREE.Group(); head.position.y = h; g.add(head);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      part(head, sph(.09), color, { p: [Math.cos(a) * .11, 0, Math.sin(a) * .11], s: [1, .45, 1] });
    }
    part(head, sph(.07), color === YELLOW ? PINK : YELLOW, { p: [0, .03, 0] });
    head.rotation.x = .5;
    part(g, sph(.07), '#3fae6a', { p: [.06, h * .45, 0], s: [1.6, .35, .7], r: [0, 0, .6] });
    return g;
  }
  function grass() {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      part(g, new THREE.ConeGeometry(.05, .35 + rand() * .3, 6), MINT,
        { p: [(rand() - .5) * .2, .2, (rand() - .5) * .15], r: [(rand() - .5) * .4, 0, (rand() - .5) * .6], line: 1.18 });
    }
    return g;
  }
  function butterfly(color) {
    const g = new THREE.Group();
    const wingGeo = new THREE.CircleGeometry(.17, 18);
    part(g, new THREE.CapsuleGeometry(.025, .16, 4, 8), '#111', { line: 0 });
    const L = new THREE.Group(), R = new THREE.Group();
    g.add(L, R);
    const wl = part(L, wingGeo, color, { p: [-.16, .04, 0], s: [1, 1.25, 1], line: 1.12 });
    const wr = part(R, wingGeo, color, { p: [.16, .04, 0], s: [1, 1.25, 1], line: 1.12 });
    wl.material.side = wr.material.side = THREE.DoubleSide;
    g.userData.wings = [L, R];
    return g;
  }

  // Place un élément sur un côté du chemin, à une profondeur donnée
  function add(obj, z, side, kind) {
    obj.userData.side = side;
    obj.userData.base = new THREE.Vector3(side * (1.6 + rand() * 1.6) * SPREAD, GROUND, z);
    obj.userData.phase = rand() * 10;
    obj.position.copy(obj.userData.base);
    obj.scale.setScalar(1.2 + rand() * .5);
    scene.add(obj);
    items.push({ obj, kind });
  }

  const narrow = innerWidth < 700;
  const step = narrow ? 1.1 : .75;
  for (let z = -2; z > -LENGTH - 6; z -= step) {
    const side = rand() > .5 ? 1 : -1;
    add(rand() > .35 ? flower(petalsCols[Math.floor(rand() * 4)]) : grass(), z - rand() * .5, side, 'ground');
  }
  for (let k = 0; k < (narrow ? 7 : 12); k++) {
    const b = butterfly([PINK, YELLOW, BLUE, MINT][k % 4]);
    add(b, -2 - k * (LENGTH / 12) - rand(), k % 2 ? 1 : -1, 'fly');
    b.userData.base.y = -.6 + rand() * .9;
    b.scale.setScalar(1.2 + rand() * .5);
  }
  // Pétales qui flottent
  const petalGeo = new THREE.CircleGeometry(.04, 8);
  for (let k = 0; k < (narrow ? 25 : 45); k++) {
    const m = new THREE.Mesh(petalGeo, new THREE.MeshBasicMaterial({ color: petalsCols[k % 4], side: THREE.DoubleSide, transparent: true }));
    scene.add(m);
    m.userData.base = new THREE.Vector3((rand() > .5 ? 1 : -1) * (1 + rand() * 2.6) * SPREAD, -1 + rand() * 2.2, -1 - rand() * (LENGTH + 4));
    m.userData.phase = rand() * 10;
    items.push({ obj: m, kind: 'petal' });
  }

  // Défilement
  let target = 0, current = 0;
  const readScroll = () => {
    const r = section.getBoundingClientRect();
    target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 68 : 50;
    camera.updateProjectionMatrix();
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', resize);
  resize(); readScroll();

  const setOpacity = (obj, a) => obj.traverse(o => { if (o.material) o.material.opacity = a; });
  const clock = new THREE.Clock();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const frame = () => {
    const t = still ? 0 : clock.getElapsedTime();
    current += (target - current) * 0.2;
    const camZ = -current * LENGTH;
    camera.position.set(0, 0, camZ);
    camera.lookAt(0, -.15, camZ - 10);

    for (const { obj, kind } of items) {
      const b = obj.userData.base, ph = obj.userData.phase;
      const d = camZ - b.z; // distance devant la caméra
      // visible seulement de près : les éléments lointains ne viennent jamais sur les animaux
      const a = d < .4 ? 0 : Math.min(1, (d - .4) / .8) * Math.min(1, Math.max(0, (7 - d) / 2));
      obj.visible = a > 0.01;
      if (!obj.visible) continue;
      setOpacity(obj, a);
      if (kind === 'ground') {
        obj.rotation.z = Math.sin(t * 1.4 + ph) * .08;
      } else if (kind === 'fly') {
        obj.position.set(b.x + Math.sin(t * .8 + ph) * .35, b.y + Math.sin(t * 1.7 + ph) * .18, b.z + Math.cos(t * .6 + ph) * .3);
        obj.rotation.z = Math.sin(t * .5 + ph) * .3;
        // ailes face à la caméra, qui battent autour de l'axe du corps
        const flap = (Math.sin(t * 12 + ph) * .5 + .5) * 1.1;
        obj.userData.wings[0].rotation.y = flap;
        obj.userData.wings[1].rotation.y = -flap;
      } else {
        obj.position.set(b.x + Math.sin(t * .7 + ph) * .2, b.y + Math.sin(t * .9 + ph) * .25, b.z);
        obj.rotation.set(t * .8 + ph, t * .6 + ph, 0);
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  frame();
})();
