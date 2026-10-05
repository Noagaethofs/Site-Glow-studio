# GLOW — Designed to Shine

Site de GLOW, agence créative et digitale belge. HTML / CSS / JS vanilla, GSAP + ScrollTrigger + Lenis, build Vite, hébergement Cloudflare Pages.

## Démarrer
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/ (SITE_URL=https://domaine.be npm run build pour le sitemap)
```

## Structure
- `index.html` accueil · `photographie/` page de Tim · `mentions-legales/` · `merci/` · `projets/<slug>/`
- `partials/` header, footer, formulaire (inclus au build via `<!-- @include … -->`)
- `src/css/` `tokens.css` (couleurs, typos, espacements) · `base.css` · `components.css` · `home.css` · `pages.css`
- `src/js/modules/` un module par comportement (hero, méthode, réalisations, lightbox…)
- `functions/api/contact.js` envoi du formulaire (Cloudflare Pages Function + Resend)

## Ajouter un projet
```bash
npm run new-project -- mon-slug "Nom du client" "Secteur" "Prestation" "Résumé en une phrase"
```
Puis ajouter la ligne correspondante dans la liste « Réalisations » de `index.html`.

## Photos et vidéos
Les emplacements sont des blocs `.ph` avec un libellé (`data-label`) qui décrit le média attendu. Les remplacer par `<img>` / `<picture>` / `<video>` (commentaires dans le HTML).

## Contenus à compléter
Tout texte provisoire est balisé `class="todo"` (souligné en pointillés). Liste : `docs/A-COMPLETER.md`.

## Déploiement Cloudflare Pages
Build : `npm run build` · Dossier : `dist` · Variables : `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`, `SITE_URL`.
