// La politique de sécurité (dist/_headers) ne doit rien bloquer sur le site.
// `vite preview` n'applique pas _headers : on ajoute l'en-tête nous-mêmes.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { skipIntro, collectErrors } from './helpers.js';

// lu au moment du test : dist/ est construit par le webServer de Playwright
const readCsp = () => readFileSync('dist/_headers', 'utf8').match(/Content-Security-Policy: (.+)/)[1];

test('la Content-Security-Policy est complète', () => {
  const csp = readCsp();
  expect(csp).not.toContain('{{');
  expect(csp).toMatch(/script-src 'self' 'sha256-/);
});

for (const path of ['/', '/photographie/', '/equipe/']) {
  test(`${path} fonctionne avec la Content-Security-Policy`, async ({ page }) => {
    const csp = readCsp();
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
    });
    const errors = collectErrors(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    // l'intro démarre : preuve que le script inline du header a bien été autorisé
    await expect(page.locator('html')).toHaveClass(/is-loading/);
    expect(errors).toEqual([]);
  });
}

test('le script inline est bloqué si son empreinte ne correspond pas', async ({ page }) => {
  await skipIntro(page);
  const wrong = readCsp().replace(/'sha256-[^']+'/g, "'sha256-AAAA'");
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': wrong } });
  });
  const errors = collectErrors(page);
  await page.goto('/');
  expect(errors.join(' ')).toMatch(/Content Security Policy|Refused/);
});
