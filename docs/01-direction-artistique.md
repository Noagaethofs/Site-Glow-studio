# GLOW — Proposition de direction artistique (étape 1)

> Statut : à valider avant de coder. Rien n'est implémenté tant que cette proposition n'est pas validée.

## 1. Concept : « L'ouverture »

GLOW vend deux choses qui se rejoignent : un site et la lumière qui le rend vivant (photo, vidéo).
Le fil rouge visuel est celui de l'appareil photo : **l'ouverture**. Tout part du noir, et la lumière révèle le contenu.

- Le noir n'est pas un « dark mode » : c'est la chambre noire. Le blanc, c'est la lumière.
- Les images ne « s'affichent » pas, elles **s'ouvrent** : révélations par masque, comme un obturateur.
- La typographie XXL fait le décor ; les photos de Tim sont le deuxième pilier, toujours grandes, plein cadre.
- Alternance de sections noires et blanc cassé pour rythmer la lecture (jamais deux sections construites pareil).

## 2. Couleurs

| Token     | Valeur         | Usage                                                                  |
| --------- | -------------- | ---------------------------------------------------------------------- |
| `--ink`   | `#0B0B0B`      | fond principal, texte sur clair                                        |
| `--paper` | `#F1EFEA`      | blanc cassé, fond des sections claires, texte sur noir                 |
| `--grey`  | `#8A8883`      | textes secondaires, légendes (contraste AA vérifié sur les deux fonds) |
| `--line`  | 12 % d'opacité | filets fins des listes éditoriales                                     |

**Pas de couleur d'accent.** Le seul « effet couleur » vient des photos et vidéos de Tim, qui ressortent d'autant plus sur un site strictement noir et blanc. Si une couleur devient nécessaire plus tard, elle sera unique et justifiée.

## 3. Typographie

- **General Sans** (Indian Type Foundry, Fontshare — licence gratuite, usage commercial autorisé, auto-hébergée en WOFF2) : grotesque au dessin légèrement géométrique, assez de caractère pour les titres XXL, très lisible en texte courant. Graisses : 400, 500, 600.
- **Instrument Serif Italic** (Google Fonts, OFL, auto-hébergée) : serif éditoriale en contraste, utilisée avec parcimonie sur un mot par titre (« _Shine_ », « _vous_ »). C'est elle qui évite l'effet template.
- Titres en `clamp()` : jusqu'à ~22vw pour le logo hero, interlignage serré (0.85), approche négative.
- Neue Montreal reste possible si GLOW achète la licence web ; General Sans est l'équivalent libre le plus proche.

## 4. Concept du hero

1. **Chargement (< 1 s)** : écran noir, « GL / OW » stacked qui se compose, puis s'efface. Ignoré si la page est déjà prête ou si `prefers-reduced-motion`.
2. **État initial** : composition typographique plein écran. « Designed to » en grotesque, « _Shine_ » en serif italique, en très grand. Le **O** de GLOW, en bas de l'écran, est une fenêtre : à l'intérieur tourne en boucle une vidéo courte de Tim (muette, compressée, avec poster).
3. **Au scroll (section pinnée)** : le O s'agrandit jusqu'à remplir tout l'écran — on « entre dans l'objectif » — et la vidéo devient plein cadre. La transition mène directement au constat.
4. **Curseur (desktop)** : les lettres du titre réagissent légèrement à la position (variation de graisse/décalage subtil), sans gêner la lecture.
5. **Mobile** : pas de pin ni d'effet curseur. Titre empilé, vidéo plein cadre sous le titre, CTA fixe « Devis » en bas.

## 5. Textes du hero

- **Surtitre** : Agence créative — Belgique
- **Titre (H1, visuel)** : Designed to _Shine_
  (H1 complet pour le SEO : « GLOW — Sites web, photo et vidéo en Belgique. Designed to Shine », la partie descriptive en texte visible plus petit.)
- **Phrase d'offre** : Nous créons votre site web et les photos qui vont avec. Une présence en ligne à la hauteur de votre travail.
- **CTA principal** : Demander un devis
- **Lien secondaire** : Voir nos réalisations
- **Ligne basse** : Sites web · Photographie · Vidéo

Alternatives pour la phrase d'offre :

- « Un site qui fait sérieux, des photos qui vous ressemblent. Réalisés par la même équipe. »
- « Site web, photo, vidéo : tout ce qu'il faut pour qu'on ait envie de travailler avec vous. »

## 6. Socle technique proposé

- HTML / CSS / JS vanilla, GSAP + ScrollTrigger + Lenis, sans framework.
- Build léger avec **Vite** (multi-pages) pour minifier, hasher les fichiers et générer les images — à confirmer, sinon fichiers statiques purs.
- Pages projets générées à partir d'un fichier de données (`projects.json`) + un gabarit commun, pour ajouter un projet sans toucher au code.
- Formulaire : Cloudflare Pages Function (même hébergement, pas de service tiers) ou Formspree.

## 7. Informations à compléter

Voir la liste des questions dans la conversation / le suivi du projet.
