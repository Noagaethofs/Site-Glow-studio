// Travelling 3D de la page d'accueil (provisoire : sera remplacé par la vidéo filmée)
// Script classique (et non module) pour fonctionner aussi en ouvrant le fichier en local.
(async () => {
const fallback = msg => {
  const f = document.getElementById('fallback');
  f.textContent = msg;
  f.style.display = 'grid';
};
let THREE;
try {
  // window.THREE_SRC permet de fournir Three.js intégré (version « fichier unique »)
  THREE = await import(window.THREE_SRC || 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
} catch (e) {
  fallback("Le travelling 3D n'a pas pu se charger. Ouvrez la page dans Safari ou Chrome, avec une connexion internet.");
  return;
}

const canvas = document.getElementById('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  fallback("La 3D n'est pas disponible sur cet appareil.");
  return;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const SKY = new THREE.Color('#ffd9e6');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 22, 70);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

// Lumières
scene.add(new THREE.HemisphereLight('#ffffff', '#7ee0c3', 1.6));
const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// Matériaux « cartoon » avec contour noir (comme les cartes de la DA)
const grad = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const mats = {};
const toon = c => mats[c] ||= new THREE.MeshToonMaterial({ color: c, gradientMap: grad });
const outlineMat = new THREE.MeshBasicMaterial({ color: '#111', side: THREE.BackSide });

function part(parent, geo, color, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], outline = 1.07, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, toon(color));
  m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = shadow;
  if (outline) { const o = new THREE.Mesh(geo, outlineMat); o.scale.setScalar(outline); m.add(o); }
  parent.add(m);
  return m;
}
const sph = (r, w = 24) => new THREE.SphereGeometry(r, w, Math.round(w * .75));
const cyl = (r1, r2, h) => new THREE.CylinderGeometry(r1, r2, h, 16);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 16);

// Chemin : légère courbe
const pathX = z => Math.sin(z * 0.07) * 1.2;

// Sol vallonné
const groundGeo = new THREE.PlaneGeometry(120, 160, 120, 160);
groundGeo.rotateX(-Math.PI / 2);
const pos = groundGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i) - 40;
  const d = Math.abs(x - pathX(z));
  const hills = Math.sin(x * .18) * Math.cos(z * .12) * 1.4 + Math.sin(z * .05 + x * .07) * 1.2;
  pos.setY(i, hills * THREE.MathUtils.smoothstep(d, 4, 14));
}
groundGeo.translate(0, 0, -40);
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(groundGeo, toon('#7ee0c3'));
ground.receiveShadow = true;
scene.add(ground);

// Sentier
const pathPts = [];
for (let z = 12; z >= -100; z -= 2) pathPts.push(new THREE.Vector3(pathX(z), 0.02, z));
const pathCurve = new THREE.CatmullRomCurve3(pathPts);
const pathGeo = new THREE.TubeGeometry(pathCurve, 200, 1.1, 8, false);
pathGeo.scale(1, 0.02, 1);
const path = new THREE.Mesh(pathGeo, toon('#ffe7a8'));
path.receiveShadow = true;
scene.add(path);

// Décor : arbres pop, fleurs, nuages
const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const canopy = ['#2340ff', '#ff8fb8', '#ffd23f', '#5ccfae'];
for (let i = 0; i < 46; i++) {
  const z = 10 - i * 2.4 - rand() * 2;
  const side = i % 2 ? 1 : -1;
  const x = pathX(z) + side * (6 + rand() * 12);
  const t = new THREE.Group();
  t.position.set(x, 0, z);
  const h = 1.2 + rand() * 1.2;
  part(t, cyl(.12, .16, h), '#7a4b2a', { p: [0, h / 2, 0] });
  const col = canopy[i % canopy.length];
  if (rand() > .5) part(t, sph(.9 + rand() * .5), col, { p: [0, h + .6, 0], outline: 1.04 });
  else part(t, new THREE.ConeGeometry(.9, 2.2, 16), col, { p: [0, h + 1, 0], outline: 1.04 });
  scene.add(t);
}
const flowerCols = ['#ffffff', '#ff8fb8', '#ffd23f', '#2340ff'];
for (let i = 0; i < 220; i++) {
  const z = 10 - rand() * 90;
  const side = rand() > .5 ? 1 : -1;
  const x = pathX(z) + side * (1.6 + rand() * 7);
  part(scene, sph(.07, 8), flowerCols[i % 4], { p: [x, .08, z], outline: 0, shadow: false });
}
for (let i = 0; i < 9; i++) {
  const c = new THREE.Group();
  c.position.set(-30 + rand() * 60, 12 + rand() * 6, -20 - rand() * 60);
  for (let j = 0; j < 4; j++) part(c, sph(1 + rand()), '#ffffff', { p: [j * 1.3 - 2, rand() * .6, rand()], outline: 1.03, shadow: false });
  scene.add(c);
}
part(scene, sph(5), '#ffd23f', { p: [14, 20, -95], outline: 1.03, shadow: false });

// Barrières le long du chemin
function fence(z0, side, n) {
  for (let i = 0; i < n; i++) {
    const z = z0 - i * 1.4, x = pathX(z) + side * 2.6;
    part(scene, new THREE.BoxGeometry(.12, .8, .12), '#ffffff', { p: [x, .4, z] });
    if (i < n - 1) part(scene, new THREE.BoxGeometry(.06, .1, 1.4), '#ffffff', { p: [x, .55, z - .7], outline: 1.15 });
  }
}
fence(-14, -1, 5); fence(-36, 1, 5);

// ===== Animaux =====
const anims = [];

function makeDog() {
  const g = new THREE.Group();
  const fur = '#d9a066', dark = '#8a5a3c';
  part(g, cap(.28, .6), fur, { p: [0, .62, 0], r: [Math.PI / 2, 0, 0] });
  for (const [x, z] of [[.15, .3], [-.15, .3], [.15, -.3], [-.15, -.3]]) part(g, cyl(.08, .07, .5), fur, { p: [x, .27, z] });
  const head = new THREE.Group(); head.position.set(0, 1.0, .48); g.add(head);
  part(head, sph(.27), fur);
  part(head, sph(.14), '#f1d1a8', { p: [0, -.08, .22], s: [1, .8, 1.3] });
  part(head, sph(.055), '#111', { p: [0, -.02, .4], outline: 0 });
  for (const s of [1, -1]) {
    part(head, sph(.04), '#111', { p: [s * .1, .07, .22], outline: 0 });
    part(head, sph(.015), '#fff', { p: [s * .1 + .01, .09, .26], outline: 0 });
    part(head, sph(.16), dark, { p: [s * .25, -.02, -.02], s: [.35, 1, .65], r: [0, 0, s * .25] });
  }
  part(head, new THREE.TorusGeometry(.2, .045, 8, 24), '#ff8fb8', { p: [0, -.24, -.06], r: [Math.PI / 2 - .3, 0, 0] });
  const tail = new THREE.Group(); tail.position.set(0, .78, -.55); g.add(tail);
  part(tail, cap(.045, .3), fur, { p: [0, .18, 0] });
  tail.rotation.x = -.6;
  anims.push(t => {
    tail.rotation.z = Math.sin(t * 10) * .6;
    head.rotation.z = Math.sin(t * 1.3) * .12;
    head.rotation.x = Math.sin(t * .9) * .05;
  });
  return g;
}

function makeRabbit(fur, inner, seed) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  part(body, sph(.24), fur, { p: [0, .24, -.04], s: [1, .9, 1.15] });
  part(body, sph(.08), '#ffffff', { p: [0, .26, -.3] });
  for (const s of [1, -1]) part(body, sph(.07), fur, { p: [s * .1, .05, .16], s: [1, .6, 1.5] });
  const head = new THREE.Group(); head.position.set(0, .46, .16); body.add(head);
  part(head, sph(.16), fur);
  part(head, sph(.03), '#ff8fb8', { p: [0, -.02, .155], outline: 0 });
  const ears = [];
  for (const s of [1, -1]) {
    part(head, sph(.03), '#111', { p: [s * .08, .04, .12], outline: 0 });
    part(head, sph(.01), '#fff', { p: [s * .08 + .008, .05, .145], outline: 0 });
    const e = new THREE.Group(); e.position.set(s * .06, .12, -.02); head.add(e);
    part(e, cap(.045, .2), fur, { p: [0, .14, 0], s: [1, 1, .55] });
    part(e, cap(.025, .16), inner, { p: [0, .14, .018], s: [1, 1, .4], outline: 0 });
    e.rotation.z = -s * .15;
    ears.push(e);
  }
  anims.push(t => {
    const tt = t + seed;
    const hop = Math.max(0, Math.sin(tt * 2.2)) ** 6;
    body.position.y = hop * .12;
    ears[0].rotation.x = Math.sin(tt * 3) * .12;
    ears[1].rotation.x = Math.sin(tt * 3 + 1) * .12 + (Math.sin(tt * .7) > .9 ? .5 : 0);
    head.rotation.y = Math.sin(tt * .8) * .2;
  });
  g.scale.setScalar(1.35);
  return g;
}

function makeHamster(fur, belly, seed) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  part(body, sph(.17), fur, { p: [0, .15, 0], s: [1.05, .9, 1.2] });
  part(body, sph(.12), belly, { p: [0, .12, .08], s: [1, .9, 1] , outline: 0 });
  for (const s of [1, -1]) {
    part(body, sph(.045), fur, { p: [s * .09, .28, .06] });
    part(body, sph(.022), '#111', { p: [s * .06, .2, .18], outline: 0 });
    part(body, sph(.045), belly, { p: [s * .1, .14, .15], outline: 0 });
  }
  part(body, sph(.018), '#ff8fb8', { p: [0, .16, .21], outline: 0 });
  anims.push(t => {
    const tt = t + seed;
    body.scale.set(1 + Math.sin(tt * 6) * .02, 1 - Math.sin(tt * 6) * .02, 1);
    body.rotation.y = Math.sin(tt * .9) * .3;
  });
  g.scale.setScalar(1.7);
  return g;
}

function place(obj, z, side, face = 0) {
  const x = pathX(z) + side;
  obj.position.set(x, 0, z);
  obj.rotation.y = face;
  scene.add(obj);
  return obj;
}

const dog = place(makeDog(), -10, 1.7, -0.7);
place(makeRabbit('#f5f1ea', '#ffb7cf', 0), -22, -1.6, 0.6);
place(makeRabbit('#9b9aa8', '#ffb7cf', 2), -28, 1.6, -0.6);
place(makeRabbit('#a8724c', '#f3c9a6', 4), -34, -1.6, 0.6);
// Les hamsters sur un coussin
const cushion = part(scene, cyl(.9, .95, .14), '#ff8fb8', { p: [pathX(-46) + 1.2, .07, -46], outline: 1.02 });
cushion.receiveShadow = true;
place(makeHamster('#e6a85c', '#fff3e0', 0), -46, 0.85, 0.3).position.y = .14;
place(makeHamster('#e8e2d8', '#ffffff', 3), -46.2, 1.55, -0.3).position.y = .14;

// ===== Trajectoire caméra : une étape par animal =====
const V = (x, y, z) => new THREE.Vector3(pathX(z) + x, y, z);
const keys = [
  { p: V(0, 3.4, 8),       t: V(0, 1.2, -12) },     // 0 intro
  { p: V(-.3, 1.5, -5.6),  t: V(1.7, .85, -10) },   // 1 chien
  { p: V(.3, 1.1, -18.6),  t: V(-1.6, .45, -22) },  // 2 lapin 1
  { p: V(-.3, 1.1, -24.6), t: V(1.6, .45, -28) },   // 3 lapin 2
  { p: V(.3, 1.1, -30.6),  t: V(-1.6, .45, -34) },  // 4 lapin 3
  { p: V(.6, 1.25, -42.6), t: V(1.2, .3, -46.1) },  // 5 hamsters
];
const camCurve = new THREE.CatmullRomCurve3(keys.map(k => k.p), false, 'centripetal');
const tgtCurve = new THREE.CatmullRomCurve3(keys.map(k => k.t), false, 'centripetal');
const N = keys.length - 1;
const smoother = x => x * x * x * (x * (x * 6 - 15) + 10);

// Défilement → progression
const travel = document.getElementById('accueil');
const intro = document.getElementById('intro');
const hint = document.getElementById('hint');
const caps = [...document.querySelectorAll('.cap')];
const dots = [...document.querySelectorAll('#rail span')];
let target = 0, current = 0;
function readScroll() {
  const r = travel.getBoundingClientRect();
  const span = r.height - innerHeight;
  target = THREE.MathUtils.clamp(-r.top / span, 0, 1);
}
addEventListener('scroll', readScroll, { passive: true });

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 1 ? 62 : 45;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize(); readScroll();

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
function frame() {
  const t = clock.getElapsedTime();
  current += (target - current) * 0.08;
  const k = current * N;
  const i = Math.min(Math.floor(k), N - 1);
  const u = (i + smoother(k - i)) / N;
  camera.position.copy(camCurve.getPoint(u));
  // léger mouvement « caméra à l'épaule »
  camera.position.y += Math.sin(t * .8) * .03;
  camera.lookAt(tgtCurve.getPoint(u));

  sun.position.copy(camera.position).add(tmp.set(6, 12, 4));
  sun.target.position.copy(camera.position).add(tmp.set(0, 0, -6));

  for (const a of anims) a(t);

  // Textes synchronisés
  intro.style.opacity = Math.max(0, 1 - k * 2.2);
  intro.style.transform = `translateY(${-k * 60}px)`;
  intro.style.pointerEvents = k < .3 ? 'auto' : 'none';
  hint.style.opacity = k < .15 ? 1 : 0;
  const near = Math.round(k);
  caps.forEach(c => c.classList.toggle('on', +c.dataset.k === near && Math.abs(k - near) < .3));
  dots.forEach((d, j) => d.classList.toggle('on', j === Math.min(near, 5)));

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();

// Permet de sauter directement à une étape (aperçus, tests)
window.__jump = p => { target = current = p; };
})();
