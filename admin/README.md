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
