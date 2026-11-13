# Archives (GitHub + Netlify)

Site d'archives partagées : tout le monde peut lire, toute personne qui connaît le mot de passe (shuen) peut ajouter/supprimer.
Les données sont stockées côté Netlify (Netlify Blobs), donc visibles par tous les visiteurs.

## Mise en ligne
1. Crée un dépôt GitHub et envoie-y tout le contenu de ce dossier (glisser-déposer sur github.com → "Add file → Upload files").
2. Sur Netlify : **Add new site → Import an existing project → GitHub** → choisis le dépôt → Deploy.
3. Netlify : **Site configuration → Environment variables** → ajoute `ADMIN_PASSWORD` avec le mot de passe de ton choix.
4. Relance un déploiement (**Deploys → Trigger deploy**).

Note : un glisser-déposer direct du dossier sur Netlify ne marche pas ici (la fonction a besoin de GitHub/CLI pour installer `@netlify/blobs`).

## Images
Les images sont réduites automatiquement (1600 px max) puis stockées sur Netlify Blobs. Maximum 12 par archive.
