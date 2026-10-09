# GLOW Studio — Designed to Shine

Site de GLOW Studio, agence créative belge : sites web, photo et vidéo pour les petites entreprises.

HTML, CSS et JavaScript sans framework · animations GSAP + ScrollTrigger · défilement doux Lenis ·
build Vite · hébergement Cloudflare Pages.

## Démarrer

Prérequis : Node.js 22.

```bash
npm install
npm run dev        # site en local sur http://localhost:5173, rechargé à chaque modification
npm run build      # version de production dans dist/
npm run preview    # sert dist/ pour vérifier la version de production
```

## Vérifier avant de publier

```bash
npm run check      # tout d'un coup : format + lint + tests
```

| Commande         | Rôle                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| `npm run format` | remet en forme le JS, le CSS et les fichiers de config (Prettier)        |
| `npm run lint`   | ESLint (JS), Stylelint (CSS), html-validate (HTML des pages construites) |
| `npm test`       | tests Playwright sur ordinateur et téléphone (Chromium)                  |

La première fois, installer le navigateur de test : `npx playwright install chromium`.

Les mêmes vérifications tournent automatiquement sur GitHub à chaque push (`.github/workflows/ci.yml`).
Si une vérification échoue, le rapport des tests est téléchargeable depuis l'onglet **Actions**.

## Structure

```
index.html                 accueil
photographie/index.html    page de Tim
equipe/index.html          l'équipe
mentions-legales/          merci/
partials/                  header, footer, logo, formulaire (inclus au build)
src/css/
  tokens.css               couleurs, typos, espacements : les réglages de la marque
  base.css                 éléments de base, boutons, textes, emplacements .ph
  components/              loader, curseur, header, menu, CTA mobile, footer, formulaire
  sections/                une feuille par section : hero, statement, services, method,
                           projects, offers, team, contact, contact-card, film-modal
  pages/                   styles propres aux pages secondaires
  main.css                 assemble tout, dans l'ordre
src/js/main.js             démarrage : active les modules présents sur la page
src/js/modules/            un module par comportement (intro, hero, services, projets…)
public/                    fichiers copiés tels quels : polices, médias, _headers, robots.txt
functions/api/contact.js   envoi du formulaire (Cloudflare Pages Function + Resend)
tests/                     tests Playwright
docs/                      direction artistique, contenus à compléter
```

Inclure un morceau de page : `<!-- @include partials/header.html cle="valeur" -->`. Dans le partial,
`{{cle}}` est remplacé par la valeur. Toute page `dossier/index.html` est construite automatiquement.

## Modifications courantes

**Changer un texte.** Directement dans le HTML de la page (ou du partial pour le header et le footer).
Les textes provisoires portent `class="todo"` ; la liste est dans `docs/A-COMPLETER.md`.

**Changer une couleur, une police, un espacement.** Dans `src/css/tokens.css` : la valeur change partout.

**Ajouter une photo ou une vidéo.**

1. Optimiser le fichier : WebP pour les photos (environ 1600 px de large), MP4 (H.264) + WebM pour les
   vidéos, sans le son pour les boucles. Exemple avec ffmpeg :
   ```bash
   ffmpeg -i photo.jpg -vf scale=1600:-2 -c:v libwebp -quality 80 photo.webp
   ffmpeg -i film.mov -an -vf scale=1280:-2 -c:v libx264 -crf 26 -movflags +faststart boucle.mp4
   ffmpeg -i film.mov -an -vf scale=1280:-2 -c:v libvpx-vp9 -crf 36 -b:v 0 boucle.webm
   ```
2. Le placer dans `public/media/…`.
3. Remplacer l'emplacement `.ph` correspondant (son `data-label` décrit le média attendu) par
   `<img src="/media/…" alt="…" width="…" height="…" loading="lazy">` ou par une `<video>` :
   WebM en premier, puis MP4, `muted loop playsinline data-autoplay` pour une boucle.

**Ajouter un projet.** Dans `index.html`, section Projets : une diapositive `.screen__slide` (vidéo ou
capture), un bloc `.case-info` au même rang et un bouton dans `.cases__steps`. Le compteur suit seul.

**Modifier une offre.** Section `#offres` de `index.html`.

## Mise en ligne (Cloudflare Pages)

- Projet relié au dépôt GitHub, branche de production `main`.
- Build : `npm run build` · dossier publié : `dist`.
- Variables d'environnement :
  - `SITE_URL` : adresse du site (pour le sitemap), ex. `https://glowstudio.be`
  - `RESEND_API_KEY` : clé Resend pour l'envoi du formulaire
  - `CONTACT_TO` : adresse qui reçoit les demandes
  - `CONTACT_FROM` : expéditeur validé chez Resend
- Domaine (Combell) : ajouter le domaine dans Cloudflare Pages, puis créer chez Combell
  l'enregistrement DNS indiqué par Cloudflare.
- Avant la mise en ligne : remplacer `[DOMAINE]` dans les pages et `public/robots.txt`.

## Bonnes pratiques

- Pas de librairie en plus sans raison : le site doit rester rapide.
- Chaque animation respecte « réduire les animations » (préférence du visiteur).
- Une modification = vérifier sur téléphone et ordinateur, puis `npm run check`.
