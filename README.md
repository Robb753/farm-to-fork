# Farm2Fork

Next.js, Clerk, Supabase et Mapbox. Branche de référence : `master`.

## Installation et contrôles

Node **24.19.0** (`.nvmrc`), npm **11.9.0** ; le lockfile fait référence.

```bash
nvm use
npm ci
npm run ci:check
```

La CI couvre les PR et les pushes sur master/main. `ci:check` exécute ESLint, TypeScript, Vitest, la matrice SQL sur deux bases isolées et un build avec catalogue local vide et clés fictives, sans secrets. Il exige un checkout sans fichiers `.env` ni configuration `.clerk`. **Ne jamais déployer le `.next` produit par `build:ci`.** Ce contrôle valide les autorisations SQL sur fixtures ; il ne valide ni les données de production ni une session Clerk signée. `next/font` nécessite Google Fonts pendant la compilation. Les scripts Playwright historiques ne sont pas opérationnels.

## Développement et vrai déploiement

Copier `.env.example` dans `.env.local` et renseigner les variables en privé. Aucune clé service/secrète dans `NEXT_PUBLIC_`. Les fichiers `.env` et `private-audit/` sont ignorés par Git.

```bash
npm run env:check:runtime -- --development
npm run dev
```

Pour l'environnement cible :

```bash
npm run env:check:runtime
npm run build
npm start
```

`env:check` contrôle les variables publiques ; `env:check:runtime` exige aussi les paramètres serveur. Ils vérifient présence/forme/cohérence, pas l'authenticité des clés ni les droits. Ne pas remplacer la commande de déploiement par `build:ci`.

## Base et authentification

Lire [la réconciliation](docs/reconciliation.md) avant tout SQL. La [baseline vérifiée et sa procédure](supabase/baseline/README.md) reconstruisent le schéma applicatif sur Supabase vide ; les anciennes migrations sont archivées hors chaîne active. `npm run db:check` vérifie gratuitement deux bases PostgreSQL isolées ; la CI ajoute Supabase local/Docker. Ne jamais exécuter cette reconstruction en production. La liaison Clerk/Supabase est confirmée par recette navigateur.

Exécuter `supabase/audit/export-schema.sql` en lecture seule ; enregistrer la cellule JSON snapshot dans `private-audit/schema.json`, puis :

```bash
npm run schema:check -- private-audit/schema.json
```

Ce contrôle partiel vérifie tables/colonnes, identifiants Clerk et certaines erreurs RLS. Il ne valide pas nullabilité, enums, tous les droits ou le comportement des triggers. Ce n'est ni une migration ni une certification de sécurité. Ne pas publier l'export brut : les fonctions peuvent contenir des littéraux privés.
