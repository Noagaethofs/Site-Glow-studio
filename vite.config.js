/**
 * Configuration Vite — site multi-pages GLOW.
 *
 * - Toutes les pages `index.html` du projet (hors dossiers techniques) sont
 *   détectées automatiquement : ajouter une page = ajouter un dossier avec un index.html.
 * - Plugin `htmlIncludes` : remplace `<!-- @include partials/x.html clé="valeur" -->`
 *   par le contenu du fichier, en substituant les `{{clé}}`. Évite de dupliquer
 *   header, footer et formulaire sur chaque page, sans framework.
 */
import { defineConfig } from 'vite';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const root = import.meta.dirname;
const IGNORED = new Set([
  'node_modules',
  'dist',
  'public',
  'partials',
  'src',
  'functions',
  'tests',
  'playwright-report',
  'test-results',
  'docs',
  '.git',
  '.github',
]);

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

/**
 * Génère sitemap.xml (dans le dossier de sortie) à partir des pages détectées.
 * Domaine : variable SITE_URL (ex. SITE_URL=https://glow.be npm run build).
 */
const NO_INDEX = new Set(['merci', 'mentions-legales']);
const sitemap = (pages) => {
  let outDir;
  return {
    name: 'glow-sitemap',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const site = (process.env.SITE_URL || 'https://[DOMAINE]').replace(/\/$/, '');
      const today = new Date().toISOString().slice(0, 10);
      const urls = Object.keys(pages)
        .filter((name) => !NO_INDEX.has(name))
        .map((name) => {
          const path = name === 'home' ? '/' : `/${name.split('\\').join('/')}/`;
          return `  <url><loc>${site}${path}</loc><lastmod>${today}</lastmod></url>`;
        });
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      );
    },
  };
};

const pages = findPages(root);

export default defineConfig({
  plugins: [htmlIncludes(), sitemap(pages)],
  build: {
    rollupOptions: { input: pages },
    assetsInlineLimit: 0,
  },
});
