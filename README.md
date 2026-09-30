# J-Clean Auto — site vitrine

Refonte moderne et animée du site de J-Clean Auto (detailing mobile en Belgique).
Site statique en HTML, CSS et JavaScript, sans dépendance ni étape de build.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

- `index.html` : contenu de la page
- `css/style.css` : styles et animations
- `js/main.js` : interactions (préchargeur, révélations au scroll, compteurs, curseur, boutons magnétiques, cartes 3D, onglets de tarifs, comparateur avant/après, lightbox, etc.)
- `assets/` : logo, photos et vidéo

Les animations respectent le réglage système « réduire les animations » (`prefers-reduced-motion`).
