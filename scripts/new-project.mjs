#!/usr/bin/env node
/**
 * Crée une page projet à partir de templates/project.html.
 *
 * Usage :
 *   npm run new-project -- <slug> "<Nom>" "<Secteur>" "<Prestation>" "<Résumé en une phrase>"
 * Exemple :
 *   npm run new-project -- boulangerie-dupont "Boulangerie Dupont" "Commerce" "Site web + photos" "Un site chaleureux…"
 *
 * La page est créée dans projets/<slug>/index.html et sera automatiquement
 * construite par Vite et ajoutée au sitemap. Il reste à ajouter la ligne
 * correspondante dans la liste « Réalisations » de index.html.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [slug, name, sector = '[Secteur]', scope = '[Prestation]', summary = '[Résumé du projet en une phrase.]'] = process.argv.slice(2);

if (!slug || !name || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage : npm run new-project -- <slug-en-minuscules> "<Nom>" "<Secteur>" "<Prestation>" "<Résumé>"');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'projets', slug);
const file = resolve(dir, 'index.html');
if (existsSync(file)) {
  console.error(`La page existe déjà : projets/${slug}/index.html`);
  process.exit(1);
}

const vars = { slug, name, sector, scope, summary };
const html = readFileSync(resolve(root, 'templates/project.html'), 'utf8')
  .replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => vars[k] ?? m);

mkdirSync(dir, { recursive: true });
writeFileSync(file, html);
console.log(`Page créée : projets/${slug}/index.html`);
console.log('Pensez à ajouter le projet dans la liste « Réalisations » de index.html.');
