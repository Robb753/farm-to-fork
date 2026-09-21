# Audit Farm2Fork — reprise vers un MVP utilisable

Date : 21 septembre 2026. Dépôt : Robb753/farm-to-fork. Branche de travail : `codex/reconcile-config-build`.

## Mise à jour — tâche 1 « Réconcilier code et configuration réelle »

**État : tâche 1 vérifiée dans son périmètre isolé. Baseline reconstruite sur Supabase local natif, matrice SQL validée et CI #92 verte au commit `4bbae2599114f5a5f74dceeb7f8ff28190a99363`.** Le code, la configuration versionnée, l’inventaire Supabase réel et la CI ont été réconciliés. Aucun parcours producteur n’a été refondu, aucune nouvelle fonctionnalité n’a été ajoutée et aucune migration/écriture n’a été appliquée à la base de production.

Travail livré dans la PR en brouillon #114. Le correctif initial est au commit `60609bbc1d0107cde53b66b3fea24484ef523b2e`; des commits de documentation et de préparation SQL ont ensuite été ajoutés sur la même branche.

### Ce qui a été terminé

- Next.js **15.5.14 → 15.5.25** et outils Next/ESLint alignés.
- Node **24.19.0** et npm **11.9.0** explicités.
- CI couvrant `master`, `main` et les PR avec `npm ci`, lint, TypeScript, tests et build isolé.
- `.env.example`, README et contrôles de forme/cohérence des variables corrigés.
- Export SQL réel exécuté en lecture seule sur Supabase : tables, colonnes, contraintes, policies, grants, fonctions, triggers et Storage inventoriés.
- Comparateur de schéma/versionnement ajouté ; les migrations historiques ne doivent pas être rejouées en bloc.
- Correctif SQL ciblé testé dans `supabase/audit/targeted-permissions-fix.sql`, **jamais appliqué en production**.
- Documentation détaillée maintenue dans `docs/reconciliation.md`.

### Vérifications

| Contrôle | Résultat | Limite |
| --- | --- | --- |
| `npm ci --no-audit --no-fund` | Réussi | Dépréciations transitives Clerk signalées |
| `npm run lint` | Réussi | Contrôle statique |
| `npm run typecheck` | Réussi | Contrôle statique |
| `npm run test:unit` | **142 tests réussis** | Services simulés |
| `npm run build:ci` | **Réussi** | Build isolé, non déployable |
| `npm run ci:check` | **Réussi localement après baseline**, code 0 | Inclut désormais les 283 assertions SQL |
| [CI #92](https://github.com/Robb753/farm-to-fork/actions/runs/35567315128) | **Jobs ci et database réussis** | Commit `4bbae259` ; installation verrouillée, lint/types, 142 tests, SQL, build |
| Supabase CLI/Docker natif | **Reset vide et matrice réussis** | PostgreSQL 17.6.1.167 ; aucun accès cloud |
| Matrice SQL | **283 assertions PGlite + 140 natives réussies** | Claims fictifs sous rôles anon/authenticated, sans BYPASSRLS |
| `npm run schema:check -- private-audit/schema.json` | **3 écarts détectés** | RLS OSM + 2 policies Clerk UUID |
| Vercel | **Réussi sur codex/reconcile-config-build / 0337ff1**, Node 24, Next.js 15.5.25 | Résultat communiqué par Robin |
| npm run env:check | **Réussi avec configuration Vercel réelle** | Résultat communiqué par Robin |
| Clerk Third-Party Auth | **Activé dans Supabase**, issuer https://humane-buffalo-60.clerk.accounts.dev | Configuration confirmée par Robin |
| Navigateur sur preview | **profiles : 200/204**, utilisateur Clerk connecté | JWT/sub acceptés ; ne valide pas encore les refus A/B/admin |

### État réel Supabase confirmé

Projet **Farm To Fork** `reukdkgdlvgdvyuwuaub`, actif, PostgreSQL 17.6.1.063. Historique de migrations Supabase renvoyé : vide.

Les constats de sécurité/configuration prioritaires sont confirmés :

- `producer_requests` utilise encore deux policies `auth.uid()::text`, incompatibles avec les identifiants Clerk `user_...`.
- `products` possède une policy `ALL TO public USING(true)`, qui rend la policy propriétaire inefficace pour l’écriture.
- le bucket Storage `listingImages` autorise actuellement INSERT/UPDATE/DELETE publiquement sans contrôle propriétaire ;
- `osm_import_review` a RLS désactivée et des droits client directs ;
- `profiles_self_insert` ne protège pas le rôle ni `farm_id` lors du premier INSERT ;
- une policy publique expose les fiches non revendiquées même lorsqu’elles sont inactives ;
- `is_admin()` accepte en production un bootstrap email JWT ; le correctif isolé le supprime au profit du rôle protégé en base, et teste le refus d’un faux email administrateur ;
- deux triggers AFTER UPDATE appellent la même fonction d’approbation producteur ; défaut identifié mais **non corrigé ici**, car cela appartient au chantier producteur suivant ;
- le trigger historique `protect_claimed_listing` n’est pas installé sur la base réelle.

Le correctif préparé ferme uniquement les ouvertures déjà démontrées : products, Storage, OSM review, profil initial, fiches inactives et policies Clerk de `producer_requests`. Il conserve les triggers producteur. Il corrige aussi les privilèges hors RLS, la résolution du chemin Storage, la lecture des images de sa fiche inactive et la cohérence listing_id/farm_id des écritures produit.

### Reconstruction et matrice isolée

- Catalogue réel versionné : 12 tables, 205 colonnes, 47 contraintes, 65 index, 6 enums, 10 séquences, 11 fonctions et 10 triggers, policies/grants et bucket applicatif. Aucune donnée utilisateur exportée.
- Deux migrations : baseline de l’existant puis correctif ciblé ; les six anciens SQL sont archivés inchangés dans `supabase/legacy-migrations/`.
- Deux bases PostgreSQL 17/PGlite indépendantes : comparaison au catalogue source, contrôles négatifs des anciennes failles, reconstruction vide puis matrice après correctif. **283 assertions de permissions réussies**, y compris lors du contrôle complet.
- Tests sous rôles anon/authenticated sans superuser ni BYPASSRLS : products, listingImages/Storage, profiles, listing, osm_import_review et policies Clerk de producer_requests. Les droits d’exécution des fonctions sont aussi comparés à la source. Détails et commandes dans `supabase/baseline/README.md`.
- Job CI `database` ajouté : Supabase CLI 2.117.0, Docker local, reset sans seed puis même matrice. **Démarrage, reset, comparaison et matrice réussis en CI #92.**

### Limites et clôture

Aucun blocage technique restant pour la validation isolée demandée. La CI #89 avait identifié un ordre de tri différent entre PGlite et PostgreSQL natif ; la collation du test est désormais explicite, sans modifier les règles d’accès. Les défauts de permissions décrits plus haut restent présents en production puisque ce chantier ne les y applique pas.

Les anciens blocages Vercel/Clerk sont levés selon les preuves communiquées par Robin. Aucun correctif SQL appliqué en production, aucun parcours producteur modifié, aucun service payant créé, aucune fusion dans master.

Docker n’est pas disponible dans cet environnement de travail : la vérification Supabase native passe par le runner GitHub. PGlite utilise des fixtures pour la frontière Auth/Storage ; les claims SQL fictifs ne valident pas la signature JWT ni l’API HTTP Storage. La preuve navigateur Clerk reste distincte. La baseline reconstruit le schéma applicatif sur une plateforme Supabase vide, pas les secrets/configurations cloud. Avant toute future application réelle, vérifier un administrateur DB et préparer l’adoption de l’historique sur la base existante ; ne pas y rejouer la baseline.

## Les 3 prochaines actions

1. Relire et valider la PR #114 avec les preuves de reconstruction et la matrice SQL ; aucune fusion effectuée ici.
2. Préparer séparément l’adoption de l’historique et le déploiement du seul correctif ciblé sur la base existante : sauvegarde, état des données, administrateur DB et retour arrière ; ne jamais y rejouer la baseline.
3. Après autorisation de ce déploiement distinct, effectuer la recette connectée visiteur/A/B/admin, notamment via l’API Storage, avant d’ouvrir un autre chantier MVP.

## Limite de périmètre

Cette tâche ne traite volontairement ni la simplification des trois parcours producteur, ni les slugs/navigation, ni le chargement géographique, ni le catalogue public, ni le commerce. Ces sujets restent pour les tâches MVP suivantes.
