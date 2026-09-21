# Réconciliation code / configuration — 20 septembre 2026

Tâche 1 uniquement. Référence initiale master@ebb34f927d00fa4716944bb1af6ed5159440bc58 ; branche codex/reconcile-config-build. Aucun parcours produit modifié, aucune écriture ni migration en production.

## Source vérifiée

Projet Supabase **Farm To Fork**, référence `reukdkgdlvgdvyuwuaub`, actif, PostgreSQL 17.6.1.063. Inventaire réellement exécuté en lecture seule avec `supabase/audit/export-schema.sql` : tables, colonnes, contraintes, enums, index, policies, grants, fonctions, triggers et bucket. Aucune ligne utilisateur exportée. Historique de migrations Supabase **vide** : les six migrations locales ne constituent pas une reconstruction validée.

## Écarts établis

| Élément | Configuration réelle | Conclusion |
| --- | --- | --- |
| Tables/colonnes attendues | Toutes les tables et colonnes Row de lib/types/database.ts existent | Pas de création de table à inventer ; types/contraintes/droits restent distincts |
| producer_requests | Deux policies utilisent auth.uid()::text | Incompatible avec un sub Clerk user_… : auth.uid() retourne UUID avant le cast. Les API service role contournent ces policies |
| orders | Policies propriétaire utilisent auth.jwt()->>'sub' | L'erreur UUID locale n'est pas installée ici ; INSERT/UPDATE propriétaire ne garantissent pas les invariants métier |
| products | Policy `Enable read access for all products` : **ALL TO public USING (true)** ; grants INSERT/UPDATE/DELETE à anon/authenticated | Écriture ouverte au niveau SQL malgré la policy propriétaire ; policies permissives combinées par OR |
| Storage listingImages | Bucket public ; SELECT/INSERT/UPDATE/DELETE TO public avec seul critère bucket_id ; pas de limite taille/MIME | Écriture/suppression sans contrôle propriétaire. La lecture publique du bucket est un sujet distinct |
| osm_import_review | RLS désactivée ; grants lecture/écriture à anon/authenticated | Absente des types applicatifs mais permissions SQL ouvertes ; P0 |
| listing | Policy active=true plus policy publique autorisant toute fiche sans propriétaire | Une fiche inactive sans propriétaire reste lisible selon les règles SQL |
| profiles | INSERT vérifie seulement user_id ; protections sensibles uniquement BEFORE UPDATE | Premier INSERT autorise un rôle/farm_id arbitraire si profil inexistant ; P0 |
| is_admin() | Rôle DB ou bootstrap email JWT, dont user_metadata.email | Confiance dans des métadonnées potentiellement éditables ; origine des claims Clerk non vérifiée |
| Validation producteur | **Deux triggers AFTER UPDATE** appellent handle_producer_request_approval | Exécution doublée. Fonction crée une fiche sans distinguer create/claim, ne renseigne pas profiles.farm_id et n'active pas le bypass attendu par les protections du profil. Parcours non modifié |
| Protection OSM | Aucun trigger/fonction protect_claimed_listing installé | Défaut du SQL historique non actif sur cette base ; ne pas installer ce fichier |
| Revendications | Colonnes code/SIRET/clerk_user_id/contact_email présentes | Migration ancienne différente de la table réelle |
| Avis | reviews/review_votes/review_reports : RLS sans policies | Accès direct anon/authenticated bloqué ; ne pas ouvrir ces tables pour satisfaire un contrôle |

La nullabilité diffère des types manuels pour **26 colonnes** : profiles (user_id/email/role/updated_at), listingImages (url/listing_id), farmer_requests (created_at/updated_at/first_name/last_name/siret/status), products (stock_quantity), reviews (8 colonnes), review_votes (created_at), listing_claim_requests (updated_at/contact_email, réellement NOT NULL), review_reports (status/created_at). Pas de contrainte ou conversion automatique sans inspection des données. `debug_auth_jwt`, déclarée dans les types, est absente de la base et sans appel trouvé dans le code.

`schema:check` renvoie **3 erreurs** : RLS désactivée sur osm_import_review et les deux policies UUID. Les autres constats résultent de la revue des définitions, pas de ce contrôle partiel.

## Advisors Supabase

L'advisor confirme une table sans RLS, trois sans policies, neuf fonctions sans search_path fixé, unaccent dans public et droits EXECUTE sur trois fonctions SECURITY DEFINER. Interpréter les alertes : handle_producer_request_approval retourne trigger, sa permission EXECUTE ne prouve pas une invocation RPC ordinaire ; is_admin/is_farmer servent aux policies, ne pas retirer leurs droits aveuglément.

- [RLS désactivée](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- [RLS sans policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [search_path mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [SECURITY DEFINER / anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [SECURITY DEFINER / authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Extension dans public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)

## Clerk et déploiement : preuves acquises

Robin confirme la CI distante verte, Vercel réussi sur `codex/reconcile-config-build` / `0337ff1` (Node 24, Next.js 15.5.25), `env:check` réussi avec la configuration réelle, et Clerk Third-Party Auth activé dans Supabase avec l'issuer `https://humane-buffalo-60.clerk.accounts.dev`. Le test navigateur connecté retourne 200/204 sur `profiles` : le JWT signé et le sub Clerk sont acceptés pour ces opérations. Les anciens blocages Vercel/Clerk sont levés ; aucune modification de l'intégration n'est nécessaire ici.

## Baseline et permissions isolées

La [procédure de reconstruction](../supabase/baseline/README.md) décrit deux migrations versionnées, le catalogue réel de référence et la matrice visiteur/A/B/admin. Les six anciens SQL sont archivés inchangés, hors chaîne active. Le correctif ciblé est appliqué uniquement aux bases de test.

La matrice a révélé et permis de corriger la résolution ambiguë de `name` dans les policies Storage, la lecture des images de sa fiche inactive et des privilèges hors RLS. Le correctif empêche aussi l'auto-attribution d'un rôle au premier INSERT et le bootstrap administrateur par email JWT : `is_admin()` dépend désormais exclusivement du rôle protégé en base. Avant une future mise en production, vérifier un compte administrateur en base. Les triggers producteur restent inchangés.

Deux reconstructions indépendantes avec PostgreSQL 17/PGlite vérifient le catalogue et les permissions. La CI ajoute un reset avec Supabase CLI/Docker réel. Les claims fictifs SQL vérifient l'autorisation, pas la signature JWT ; la preuve navigateur précédente couvre séparément l'authentification. Aucun projet payant créé, aucune écriture en production.

## Changements et limites

Next.js **15.5.14 → 15.5.25**, outils Next/ESLint alignés, versions exactes et lockfile. Node 24.19.0/npm 11.9.0 explicités. CI master/main et PR : npm ci, lint, types, tests, build isolé sans secrets. `.env.example`, contrôles de configuration et export/catalogue documentés. Trois commentaires ESLint inutiles retirés, sans comportement UI changé. Pas de migration majeure, changement React/Clerk ou architecture.

Le build isolé pré-rend un catalogue vide avec clés fictives. Ne jamais déployer sa sortie. Un build réel exige les variables cibles ; pages avec données, authentification et autorisations restent à tester. next/font dépend du réseau Google Fonts. Les dépendances transitives Clerk dépréciées sont signalées à l'installation ; aucune mise à niveau majeure ajoutée.

**Validation isolée terminée :** CI [#92](https://github.com/Robb753/farm-to-fork/actions/runs/35567315128) verte sur `4bbae259` : lint, TypeScript, 142 tests, build, 283 assertions PGlite et 140 assertions sur Supabase natif après reset vide. Les anciens blocages Vercel/Clerk sont levés. Aucun correctif appliqué en production. Voir `Audit-Farm2Fork-MVP.md` pour les limites et trois prochaines actions.
