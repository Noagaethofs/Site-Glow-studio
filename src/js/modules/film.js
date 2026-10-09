/**
 * Vidéos complètes (avec le son) :
 * - [data-film-open="/chemin/sans-extension"] ouvre une fenêtre (<dialog>)
 *   qui lit le film (WebM puis MP4) ; fermeture : bouton, Échap ou clic autour.
 */
export function initFilm() {
  const modal = document.querySelector('[data-film-modal]');
  const frame = modal?.querySelector('[data-film-frame]');
  let opener = null;

  const close = () => {
    frame.innerHTML = ''; // arrête la lecture et libère la vidéo
    modal.close();
    opener?.focus();
  };

  document.querySelectorAll('[data-film-open]').forEach((btn) => {
    if (!modal) return;
    btn.addEventListener('click', () => {
      opener = btn;
      const base = btn.dataset.filmOpen;
      frame.innerHTML = `<video controls autoplay playsinline aria-label="${btn.dataset.filmTitle || 'Vidéo'}">
        <source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4"></video>`;
      modal.showModal();
    });
  });
  if (modal) {
    modal.querySelector('[data-film-close]').addEventListener('click', close);
    modal.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }
}
