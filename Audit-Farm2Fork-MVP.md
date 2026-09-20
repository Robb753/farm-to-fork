# Audit Farm2Fork — reprise vers un MVP utilisable

Date : 20 septembre 2026. Dépôt : Robb753/farm-to-fork. Branche de travail : `codex/reconcile-config-build`.

## Mise à jour — tâche 1 « Réconcilier code et configuration réelle »

**État : clôture technique partielle, avec deux blocages externes explicitement identifiés.** Le code, la configuration versionnée, l’inventaire Supabase réel et la CI ont été réconciliés. Aucun parcours producteur n’a été refondu, aucune nouvelle fonctionnalité n’a été ajoutée et aucune migration/écriture n’a été appliquée à la base de production.

Travail livré dans la PR en brouillon #114. Le correctif initial est au commit `60609bbc1d0107cde53b66b3fea24484ef523b2e`; des commits de documentation et de préparation SQL ont ensuite été ajoutés sur la même branche.

### Ce qui a été terminé

- Next.js **15.5.14 → 15.5.25** et outils Next/ESLint alignés.
- Node **24.19.0** et npm **11.9.0** explicités.
- CI couvrant `master`, `main` et les PR avec `npm ci`, lint, TypeScript, tests et build isolé.
- `.env.example`, README et contrôles de forme/cohérence des variables corrigés.
- Export SQL réel exécuté en lecture seule sur Supabase : tables, colonnes, contraintes, policies, grants, fonctions, triggers et Storage inventoriés.
- Comparateur de schéma/versionnement ajouté ; les migrations historiques ne doivent pas être rejouées en bloc.
- Correctif SQL ciblé des permissions préparé dans `supabase/audit/targeted-permissions-fix.sql`, **non appliqué**.
- Documentation détaillée maintenue dans `docs/reconciliation.md`.

### Vérifications

| Contrôle | Résultat | Limite |
| --- | --- | --- |
| `npm ci --no-audit --no-fund` | Réussi | Dépréciations transitives Clerk signalées |
| `npm run lint` | Réussi | Contrôle statique |
| `npm run typecheck` | Réussi | Contrôle statique |
| `npm run test:unit` | **142 tests réussis** | Services simulés |
| `npm run build:ci` | **Réussi** | Build isolé, non déployable |
| `npm run ci:check` | Réussi localement | Même périmètre que ci-dessus |
| GitHub Actions CI #85 | **Succès** | Commit `60609bbc...` |
| `npm run schema:check -- private-audit/schema.json` | **3 écarts détectés** | RLS OSM + 2 policies Clerk UUID |
| Build Vercel avec configuration cible | Non validé | Accès Vercel bloqué par autorisation du scope |

### État réel Supabase confirmé

Projet **Farm To Fork** `reukdkgdlvgdvyuwuaub`, actif, PostgreSQL 17.6.1.063. Historique de migrations Supabase renvoyé : vide.

Les constats de sécurité/configuration prioritaires sont confirmés :

- `producer_requests` utilise encore deux policies `auth.uid()::text`, incompatibles avec les identifiants Clerk `user_...`.
- `products` possède une policy `ALL TO public USING(true)`, qui rend la policy propriétaire inefficace pour l’écriture.
- le bucket Storage `listingImages` autorise actuellement INSERT/UPDATE/DELETE publiquement sans contrôle propriétaire ;
- `osm_import_review` a RLS désactivée et des droits client directs ;
- `profiles_self_insert` ne protège pas le rôle ni `farm_id` lors du premier INSERT ;
- une policy publique expose les fiches non revendiquées même lorsqu’elles sont inactives ;
- `is_admin()` accepte un bootstrap email issu du JWT, notamment `user_metadata.email` : ne pas le modifier avant vérification des claims Clerk réellement émis ;
- deux triggers AFTER UPDATE appellent la même fonction d’approbation producteur ; défaut identifié mais **non corrigé ici**, car cela appartient au chantier producteur suivant ;
- le trigger historique `protect_claimed_listing` n’est pas installé sur la base réelle.

Le correctif préparé ferme uniquement les ouvertures déjà démontrées : products, Storage, OSM review, profil initial, fiches inactives et policies Clerk de `producer_requests`. Il conserve volontairement `is_admin()` et les triggers producteur tant que leur contexte réel n’est pas validé.

### Blocages restants

1. **Vercel** : le projet est sous le scope `robb753s-projects`, mais la connexion disponible renvoie **403 Forbidden** sur ce scope. Les logs, variables Preview/Production et réglages de build ne sont donc pas inspectables tant que l’accès Vercel n’est pas ré-authentifié sur cette équipe.
2. **Clerk** : template `supabase`, issuer, claims, instance test/live et JWT réellement accepté par Supabase ne sont pas vérifiables avec les accès actuels. Le code conserve donc `getToken({ template: 'supabase' })` sans migration vers une autre intégration.
3. **Recette A/B/admin** : le patch SQL ne doit pas être appliqué en production avant un test isolé avec visiteur, utilisateur A, utilisateur B et admin utilisant de vrais JWT Clerk.
4. **Baseline DB** : l’inventaire réel existe, mais la reconstruction complète de la base sur une base vide n’est pas encore démontrée.

## Les 3 prochaines actions

1. **Ré-authentifier Vercel sur le scope `robb753s-projects` et diagnostiquer le déploiement échoué** : vérifier variables Preview/Production, Node, commande de build, commit déployé et domaines Clerk/Mapbox/CSP.
2. **Vérifier Clerk de bout en bout puis tester le patch SQL dans un environnement isolé** : JWT réel accepté par Supabase, `sub` Clerk, rôle `authenticated`, puis matrice visiteur/A/B/admin. Ne pas modifier les triggers producteur dans cette étape.
3. **Versionner la baseline réellement reconstruisible et clôturer définitivement la tâche 1** : appliquer le schéma/policies/triggers retenus sur une base vide, relancer les contrôles/CI et consigner les preuves avant de passer au parcours producteur.

## Limite de périmètre

Cette tâche ne traite volontairement ni la simplification des trois parcours producteur, ni les slugs/navigation, ni le chargement géographique, ni le catalogue public, ni le commerce. Ces sujets restent pour les tâches MVP suivantes.
