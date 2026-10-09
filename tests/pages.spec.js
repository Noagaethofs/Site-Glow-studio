// Chaque page s'ouvre sans erreur, avec un titre, un h1 et la navigation.
import { test, expect } from '@playwright/test';
import { skipIntro, collectErrors } from './helpers.js';

const PAGES = [
  { path: '/', h1: /briller/ },
  { path: '/photographie/', h1: /./ },
  { path: '/equipe/', h1: /Trois personnes/ },
  { path: '/mentions-legales/', h1: /./ },
  { path: '/merci/', h1: /./ },
];

for (const { path, h1 } of PAGES) {
  test(`${path} s'ouvre sans erreur`, async ({ page }) => {
    await skipIntro(page);
    const errors = collectErrors(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/GLOW/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(h1);
    await expect(page.locator('html')).toHaveAttribute('lang', /^fr/);
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    expect(errors).toEqual([]);
  });
}

test('les liens de la navigation mènent aux bonnes pages', async ({ page }, testInfo) => {
  await skipIntro(page);
  await page.goto('/');
  const open = async () => {
    if (testInfo.project.name === 'mobile') await page.locator('[data-burger]').click();
  };
  const scope = testInfo.project.name === 'mobile' ? '.menu' : '.header__nav';

  await open();
  await page.locator(`${scope} a[href="/photographie/"]`).click();
  await expect(page).toHaveURL(/\/photographie\/$/);

  await open();
  await page.locator(`${scope} a[href="/equipe/"]`).click();
  await expect(page).toHaveURL(/\/equipe\/$/);
});

test('aucune image sans texte alternatif', async ({ page }) => {
  await skipIntro(page);
  for (const { path } of PAGES) {
    await page.goto(path);
    const missing = await page.locator('img:not([alt])').count();
    expect(missing, path).toBe(0);
  }
});
