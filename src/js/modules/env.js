/**
 * Environnement : préférences utilisateur et points de rupture.
 * Les mêmes requêtes sont utilisées partout pour rester cohérent avec le CSS.
 */
export const MQ = {
  desktop: '(min-width: 64em)',
  finePointer: '(hover: hover) and (pointer: fine)',
  reduced: '(prefers-reduced-motion: reduce)',
};

export const prefersReducedMotion = () => matchMedia(MQ.reduced).matches;
export const isDesktop = () => matchMedia(MQ.desktop).matches;
export const hasFinePointer = () => matchMedia(MQ.finePointer).matches;
