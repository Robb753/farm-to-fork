# Baseline applicative Supabase — tâche 1

Cette baseline provient d'un inventaire **en lecture seule** du projet Farm To Fork, et non des types TypeScript. Source : métadonnées capturées le 20 septembre 2026 (PostgreSQL 17.6.1.063). Aucun utilisateur, objet Storage, produit ou jeton de production n'est inclus.

## Reconstruction

Les deux fichiers de `supabase/migrations/` constituent la chaîne complète pour un **projet Supabase vide** :

1. `20260920213943_verified_app_baseline.sql` reproduit le schéma applicatif observé : 12 tables, 205 colonnes, 47 contraintes, 65 index, 6 enums, 10 séquences et leurs propriétaires, 11 fonctions, 10 triggers, policies et grants. Il recrée aussi le bucket applicatif public listingImages et ses policies.
2. `20260921051759_targeted_permissions.sql` applique le correctif ciblé. Son contenu doit être strictement identique à `supabase/audit/targeted-permissions-fix.sql` ; le test le vérifie.

**Appliquer la chaîne entière uniquement dans un environnement isolé.** La première migration reproduit aussi les anciennes permissions ouvertes ; elle ne doit jamais être laissée seule sur un service accessible. Elle refuse un schéma applicatif déjà présent. Aucune commande `db push`, `--linked` ou changement de production n'est autorisé par cette procédure.

Les anciens SQL incomplets sont conservés, inchangés, dans `supabase/legacy-migrations/`. Ils ne participent plus aux resets. La future adoption sur une base existante exige un plan de migration et de suivi d'historique distinct ; ne pas marquer arbitrairement des migrations comme appliquées.

La baseline suppose les schémas, fonctions et rôles gérés par Supabase déjà installés (`auth.jwt`, `auth.uid`, `storage.objects`, `storage.buckets`, anon/authenticated/service_role). Elle ne remplace pas les migrations internes de Supabase, ses services, secrets, objets stockés ou son dashboard Clerk. Les valeurs courantes des séquences et les données ne sont pas exportées. Le schéma conserve ses nullabilités et les triggers producteur existants, y compris leurs défauts déjà documentés.

## Vérification gratuite sans Docker

```bash
npm ci --no-audit --no-fund
npm run db:check
```

PGlite 0.3.14 exécute le vrai moteur PostgreSQL 17.5 en WebAssembly. Deux bases locales indépendantes sont créées puis fermées. La première baseline est comparée au catalogue de référence ; des contrôles négatifs reproduisent les anciennes ouvertures. Après correctif, la matrice est testée. La seconde base repart de zéro, rejoue les deux migrations, vérifie le même catalogue, l'absence de données applicatives puis la même matrice.

`source-catalog.json` contient uniquement les métadonnées relues du schéma applicatif. Le test compare colonnes/types/nullabilité/defaults/identités, contraintes, index, enums, fonctions, triggers, RLS, policies, grants de tables et fonctions, bucket, définitions et propriété des séquences. Les compteurs de séquences, OID, espaces des définitions SQL et nom local de base ne sont pas des critères d'identité.

`supabase/tests/*fixture.sql` fournit la frontière SQL gérée par Supabase pour le test sans Docker. Ces fichiers ne sont **pas des migrations**. Leurs fonctions JWT et protections de suppression Storage proviennent des définitions réelles. Ils ne simulent pas les décisions RLS ; PostgreSQL les exécute. Ils ne reproduisent cependant pas les serveurs Auth/PostgREST/Storage HTTP.

## Vérification sur Supabase local réel (Docker)

```bash
npx --yes supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,mailpit
npx --yes supabase@2.117.0 db reset --local --no-seed --yes
npm run db:check:supabase
npx --yes supabase@2.117.0 stop --no-backup
```

Le job CI `database` exécute cette procédure sans token ni projet cloud. Le test ne peut se connecter qu'à 127.0.0.1:54322, avec les identifiants standards locaux, et refuse des tables applicatives déjà remplies. Les données de test portent uniquement des identifiants `user_A`, `user_B`, `user_admin`, `user_new` et adresses example.invalid.

## Matrice retenue

Chaque opération utilise SET LOCAL ROLE anon/authenticated et des claims de session fictifs, avec vérification que le rôle n'est ni superuser ni BYPASSRLS. Les opérations sont annulées après chaque assertion. Admin désigne un utilisateur authenticated dont profiles.role vaut admin, **pas** service_role. La signature JWT réelle est couverte séparément par la preuve navigateur Clerk déjà fournie ; ces tests contrôlent l'autorisation SQL après authentification.

| Ressource | Visiteur | Utilisateurs A/B propriétaires de fermes distinctes | Admin DB |
| --- | --- | --- | --- |
| products | Lecture préservée, écriture interdite | CRUD uniquement sur sa ferme ; réattribution et listing_id contradictoire interdits | Pas d'écriture globale ajoutée ; nécessite son propre rattachement farm_id |
| listing | Fiches actives uniquement | Fiches actives + sa fiche inactive ; édition propre autorisée, transfert interdit | Lecture/édition étendues existantes conservées |
| listingImages | Images de fiches actives | Lecture/écriture propres, y compris fiche inactive ; réattribution interdite | Lecture/édition/suppression existantes conservées ; pas d'INSERT hors propriété ajouté |
| storage.objects | Lecture du bucket public, aucune écriture | Upload, remplacement et suppression dans son dossier uniquement ; déplacement inter-fermes refusé | Pas de privilège global Storage ajouté |
| profiles | Aucun accès | Lecture/édition propres autorisées, champs sensibles protégés ; nouveau profil user sans ferme seulement | Rôle administrateur issu de la base reconnu |
| osm_import_review | Aucun accès direct | Aucun accès direct | Aucun accès client direct ; traitement serveur privilégié distinct |

Sont aussi vérifiés : TRUNCATE refusé aux quatre acteurs, réinitialisation de séquence refusée, faux email admin ignoré, chemins Storage malformés et débordement numérique refusés sans erreur de conversion. Pour DELETE Storage, le contexte interne `storage.allow_delete_query` est activé uniquement dans le test représentant l'API ; la suppression SQL directe reste testée et refusée.

## Corrections au brouillon initial

- Qualification de `storage.objects.name` : dans la sous-requête, `name` désignait auparavant `listing.name` et refusait les uploads légitimes.
- Comparaison du préfixe à `listing.id::text` : évite les conversions bigint sur des chemins hostiles.
- Lecture des métadonnées images par leur propriétaire, nécessaire aussi à INSERT RETURNING et UPDATE/DELETE sur fiche inactive.
- Retrait des privilèges hors RLS TRUNCATE/REFERENCES/TRIGGER sur les tables ciblées et UPDATE sur leurs séquences.
- Contrôle de cohérence listing_id/farm_id à l'écriture produit ; lecture publique existante conservée, aucun catalogue développé.
- `is_admin()` s'appuie exclusivement sur le rôle protégé en base. L'email/user_metadata ne peut plus accorder des droits. Avant toute future application en production, confirmer qu'un administrateur existe bien en base : aucun bootstrap par email n'est conservé.

Pas de correction des triggers producteur, de slugs, de recherche, de catalogue public ni de commandes. Ce travail valide une reconstruction et des permissions ; il ne certifie pas le MVP entier ni les API service_role historiques.
