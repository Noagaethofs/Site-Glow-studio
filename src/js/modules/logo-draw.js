/**
 * Effet « dessin » du logo (formes pleines, identiques au fichier d'origine) :
 * le contour de chaque lettre se trace, puis la lettre se remplit.
 */
import { gsap } from 'gsap';

export function prepareLogo(paths, strokeWidth = 1.6) {
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.stroke = 'currentColor';
    p.style.strokeWidth = strokeWidth;
    p.style.fillOpacity = 0;
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = len;
  });
  return paths;
}

/** Ajoute à une timeline le tracé puis le remplissage des chemins. */
export function drawLogo(tl, paths, { at = 0, draw = 1, stagger = 0.12, fill = 0.5 } = {}) {
  tl.to(paths, { strokeDashoffset: 0, duration: draw, ease: 'power2.inOut', stagger }, at)
    .to(paths, { fillOpacity: 1, duration: fill, ease: 'power1.out', stagger }, `${typeof at === 'number' ? at + draw * 0.7 : at}`)
    .set(paths, { strokeWidth: 0 });
  return tl;
}
