Administration — Progressions
=============================

Cette petite page d'administration permet d'exporter, d'importer et de réinitialiser
les données de progression stockées localement dans le navigateur.

Fichiers / clés
- Les progressions sont stockées dans la clé `proactif_progress_v1` du `localStorage`.

Utilisation
- Ouvrir `admin/progress.html` depuis votre serveur local ou dépôt publié.
- Cliquer sur **Exporter JSON** pour télécharger un fichier `progression.json`.
- Pour importer, choisir un fichier JSON valide puis **Importer**.
- **Réinitialiser** supprime la clé et vide les progressions.

Notes techniques
- L'export/import est entièrement côté client (JavaScript) — aucune API serveur.
- Pour sauvegarde serveur, exporter et envoyer le JSON via l'API de votre choix.

Génération d'icônes (build)
- Un script minimal est fourni pour générer et minifier le sprite SVG depuis les fichiers présents dans `icons/`.
- Installer les dépendances de développement :

```bash
npm install --save-dev
```

- Commandes disponibles :
  - `npm run icons:svgo` : optimise les SVG dans `icons/` et écrit dans `icons/optimized`.
  - `npm run icons:sprite` : génère `icons/sprite.min.svg` depuis `icons/optimized`.
  - `npm run icons:build` : exécute les deux étapes ci‑dessus.

Remarque: le sprite est déjà inliné dans `index.html` pour la production; le script sert pour maintenance et CI.

CI / GitHub Actions
- Un workflow `Icons build` (filé dans `.github/workflows/icons-build.yml`) s'exécute sur `push` et `pull_request` vers `main`.
- Il installe les dépendances, lance `npm run icons:build` et publie `icons/sprite.min.svg` comme artifact (téléchargeable depuis l'exécution CI).

