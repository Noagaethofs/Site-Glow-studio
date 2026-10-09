// Comportements clés de la page d'accueil.
import { test, expect } from '@playwright/test';
import { skipIntro, isMobile } from './helpers.js';

test.describe('intro GLOW', () => {
  test("s'affiche à l'arrivée et part au premier geste", async ({ page }, testInfo) => {
    await page.goto('/');
    const loader = page.locator('[data-loader]');
    await expect(page.locator('html')).toHaveClass(/is-loading/);
    await expect(loader).toBeVisible();

    await page.waitForTimeout(600);
    if (isMobile(testInfo)) await page.locator('[data-loader]').click();
    else await page.mouse.wheel(0, 300);

    await expect(loader).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
  });

  test('ne revient pas quand on change de page', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/equipe/');
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
  });
});

test('le bouton principal mène au contact', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/');
  const cta = page.locator('.hero .btn--glow');
  await expect(cta).toHaveText(/Lancer mon projet/);
  await expect(cta).toHaveAttribute('href', /#contact/);
});

test('les services changent d’image au défilement', async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo), 'colonne d’images visible sur ordinateur uniquement');
  await skipIntro(page);
  await page.goto('/');
  const imgs = page.locator('[data-service-img]');
  await expect(imgs).toHaveCount(4);
  await page.locator('[data-service]').nth(2).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 150);
  await expect(imgs.nth(2)).toHaveClass(/is-active/, { timeout: 5_000 });
});

test('les projets changent au geste sur l’écran', async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo), 'le glisser tactile est vérifié à la main sur téléphone');
  await skipIntro(page);
  await page.goto('/');
  const screen = page.locator('[data-screen]');
  const infos = page.locator('[data-case-info]');
  await screen.scrollIntoViewIfNeeded();
  await expect(infos.nth(0)).toHaveClass(/is-active/);

  await screen.hover();
  await page.mouse.wheel(0, 120);
  await expect(infos.nth(1)).toHaveClass(/is-active/, { timeout: 3_000 });

  // flèches du clavier sur l'écran
  await page.waitForTimeout(900);
  await screen.focus();
  await page.keyboard.press('ArrowUp');
  await expect(infos.nth(0)).toHaveClass(/is-active/, { timeout: 3_000 });
});

test('la vidéo du Planning Familial s’ouvre avec le son et se ferme', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/');
  const button = page.locator('[data-film-open]');
  const modal = page.locator('[data-film-modal]');
  await button.evaluate((el) => el.click());
  await expect(modal).toBeVisible();
  await expect(modal.locator('video')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(modal.locator('video')).toHaveCount(0);
});

test('le formulaire de devis vérifie les champs puis envoie', async ({ page }) => {
  await skipIntro(page);
  await page.route('**/api/contact', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );
  await page.goto('/#contact');
  const details = page.locator('[data-cta-form]');
  await details.locator('summary').click();
  const form = details.locator('form');

  await form.locator('button[type="submit"]').click();
  await expect(form.locator('.field__error')).toHaveCount(3);

  await form.locator('input[name="name"]').fill('Test');
  await form.locator('input[name="email"]').fill('test@example.com');
  await form.locator('textarea[name="message"]').fill('Un site pour mon salon.');
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveClass(/is-sent/);
});

test('le menu mobile s’ouvre et se ferme', async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo), 'menu plein écran : téléphone');
  await skipIntro(page);
  await page.goto('/');
  const burger = page.locator('[data-burger]');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-menu]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});
