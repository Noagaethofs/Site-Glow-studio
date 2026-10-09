// Outils partagés par les tests.

/** Simule un visiteur qui a déjà vu l'intro : la page s'ouvre directement. */
export async function skipIntro(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('glow-intro', '1');
    } catch {}
  });
}

/** Collecte les erreurs JavaScript et les ressources introuvables de la page. */
export function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`JS : ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console : ${msg.text()}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`${res.status()} : ${res.url()}`);
  });
  return errors;
}

export const isMobile = (testInfo) => testInfo.project.name === 'mobile';
