/**
 * Équipe : le portrait survolé (ou focalisé au clavier) s'élargit.
 * Le comportement visuel est en CSS (.is-open) ; ici on gère juste l'état.
 */
export function initTeam() {
  const list = document.querySelector('[data-team]');
  if (!list) return;
  const members = [...list.children];
  const open = (m) => members.forEach((el) => el.classList.toggle('is-open', el === m));
  members.forEach((m) => {
    m.addEventListener('pointerenter', () => open(m));
    m.addEventListener('focus', () => open(m));
  });
}
