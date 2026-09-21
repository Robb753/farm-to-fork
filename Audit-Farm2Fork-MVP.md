# Audit Farm2Fork — reprise vers un MVP utilisable

Date : 21 septembre 2026. Dépôt : Robb753/farm-to-fork. Branche de travail : `codex/reconcile-config-build`.

## Préparation du déploiement sur la base existante — 21 septembre 2026

**Plan préparé, aucune écriture en production, aucune fusion.** Dossier complet : [`supabase/deployment/README.md`](supabase/deployment/README.md), avec pré-checks SQL, inventaire exact des droits, plan de migrations/hash et rollback testé.

- PR #114 : HEAD relu **6f491c8**, différent du commit CI #92 (**4bbae259**) mais validé par **CI #93**, jobs applicatif et Supabase natif verts. Entre les deux : documentation/workflow uniquement, migrations identiques. Ces références désignent le code validé avant les nouveaux fichiers de préparation.
- Historique distant relu : `[]` ; table `supabase_migrations.schema_migrations` **absente**. Schéma applicatif relu conforme à la baseline source. **Ne jamais exécuter la baseline sur cette production existante.**
- Adoption prévue : `migration repair 20260920213943 --status applied` sur le projet explicitement ciblé ; écrit uniquement le suivi historique. Non exécuté. Puis `migration list` et `db push --dry-run --skip-vault`, dont la sortie doit contenir **uniquement 20260921051759_targeted_permissions.sql**. Le plan JSON est une simulation hors ligne, pas un dry-run distant prétendument effectué.
- Profil admin présent : **1**, identifiant Clerk/email renseignés. La maîtrise réelle du compte par l’opérateur reste à confirmer par connexion avant application.
- Impacts à arbitrer : **40 objets Storage à chemin non numérique**, dont la lecture reste publique mais dont les écritures propriétaires seront refusées ; **1 fiche possédée avec profil farmer/admin non rattaché à la ferme correspondante**. Aucune donnée corrigée automatiquement. Aucun produit à listing_id/farm_id contradictoires ; 7 fiches non revendiquées inactives deviendront non publiques.
- Rollback préparé hors des migrations actives ; test isolé réussi : retour exact au catalogue/grants initiaux, données et séquences inchangées, triggers/fonctions producteur conservés. Il réouvre les anciens droits dangereux et exige un accord distinct. `migration repair --status reverted` ne remplace jamais l’exécution du rollback SQL.
- Vérifications de préparation : hashes des migrations conservés, matrice SQL relancée, test de non-modification et de rollback réussi. Les workflows versionnés ne poussent aucune migration distante ; l’absence d’intégration externe n’est pas attestée, donc aucune fusion.

**Arrêt avant la première écriture.** Accord proposé pour la phase A uniquement : enregistrer la baseline dans l’historique, puis présenter le dry-run réel. L’application du correctif (phase B) reste conditionnée à un nouvel accord, à l’arbitrage des deux impacts, à une sauvegarde restaurable attestée et au contrôle du compte admin. Aucun justificatif de sauvegarde ni accès opérateur CLI/Postgres n’a été établi dans cette préparation ; les accès du connecteur en lecture ne remplacent pas ces prérequis.

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

1. Après accord explicite, adopter **uniquement l’historique de la baseline**, vérifier `migration list` et présenter le dry-run distant ne proposant que targeted_permissions.
2. Valider le compte admin, la sauvegarde et le traitement/acceptation des 40 anciens chemins Storage et du rattachement farmer/admin identifié ; aucune correction implicite.
3. Après un accord distinct, déployer le seul correctif, vérifier historique/droits et effectuer la recette connectée, avec rollback encadré disponible. Aucun parcours producteur engagé.

## Limite de périmètre

Cette tâche ne traite volontairement ni la simplification des trois parcours producteur, ni les slugs/navigation, ni le chargement géographique, ni le catalogue public, ni le commerce. Ces sujets restent pour les tâches MVP suivantes.
