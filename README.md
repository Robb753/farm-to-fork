# Farm2Fork

Next.js, Clerk, Supabase et Mapbox. Branche de référence : `master`.

## Installation et contrôles

Node **24.19.0** (`.nvmrc`), npm **11.9.0** ; le lockfile fait référence.

```bash
nvm use
npm ci
npm run ci:check
```

La CI couvre les PR et les pushes sur master/main. `ci:check` exécute ESLint, TypeScript, Vitest et un build avec catalogue local vide et clés fictives, sans secrets. Il exige un checkout sans fichiers `.env` ni configuration `.clerk`. **Ne jamais déployer le `.next` produit par `build:ci`.** Ce contrôle ne valide ni les données, ni Clerk, ni les autorisations réelles. `next/font` nécessite Google Fonts pendant la compilation. Les scripts Playwright historiques ne sont pas opérationnels.

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

Lire [la réconciliation](docs/reconciliation.md) avant tout SQL. Les migrations historiques ne reconstruisent pas l'état réel et ne doivent pas être rejouées en bloc. Le code utilise le template Clerk `supabase` : le conserver tant que la configuration Clerk/Supabase n'est pas vérifiée.

Exécuter `supabase/audit/export-schema.sql` en lecture seule ; enregistrer la cellule JSON snapshot dans `private-audit/schema.json`, puis :

```bash
npm run schema:check -- private-audit/schema.json
```

Ce contrôle partiel vérifie tables/colonnes, identifiants Clerk et certaines erreurs RLS. Il ne valide pas nullabilité, enums, tous les droits ou le comportement des triggers. Ce n'est ni une migration ni une certification de sécurité. Ne pas publier l'export brut : les fonctions peuvent contenir des littéraux privés.
