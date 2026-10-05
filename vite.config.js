/**
 * Configuration Vite — site multi-pages GLOW.
 *
 * - Toutes les pages `index.html` du projet (hors node_modules / dist / templates)
 *   sont détectées automatiquement : ajouter une page projet = ajouter un dossier.
 * - Plugin `htmlIncludes` : remplace `<!-- @include partials/x.html clé="valeur" -->`
 *   par le contenu du fichier, en substituant les `{{clé}}`. Évite de dupliquer
 *   header, footer et formulaire sur chaque page, sans framework.
 */
import { defineConfig } from 'vite';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const root = import.meta.dirname;
const IGNORED = new Set(['node_modules', 'dist', 'public', 'templates', 'partials', 'src', 'functions', 'scripts', 'docs', '.git']);

/** Liste récursive des pages HTML à construire. */
function findPages(dir, pages = {}) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findPages(full, pages);
    else if (entry === 'index.html') {
      const name = relative(root, dir) || 'home';
      pages[name] = full;
    }
  }
  return pages;
}

/** Remplace les directives d'inclusion (récursif, avec paramètres). */
function renderIncludes(html, depth = 0) {
  if (depth > 5) return html;
  return html.replace(/<!--\s*@include\s+([^\s]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (_, file, rawParams) => {
    const params = {};
    for (const [, k, v] of rawParams.matchAll(/([\w-]+)="([^"]*)"/g)) params[k] = v;
    let partial = readFileSync(resolve(root, file), 'utf8');
    partial = partial.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (m, k) => params[k] ?? '');
    return renderIncludes(partial, depth + 1);
  });
}

const htmlIncludes = () => ({
  name: 'glow-html-includes',
  transformIndexHtml: { order: 'pre', handler: (html) => renderIncludes(html) },
  handleHotUpdate({ file, server }) {
    if (file.includes('/partials/')) server.ws.send({ type: 'full-reload' });
  },
});

export default defineConfig({
  plugins: [htmlIncludes()],
  build: {
    rollupOptions: { input: findPages(root) },
    assetsInlineLimit: 0,
  },
});
