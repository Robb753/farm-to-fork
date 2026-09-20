# Réconciliation code / configuration — 20 septembre 2026

Tâche 1 uniquement. Référence initiale master@ebb34f927d00fa4716944bb1af6ed5159440bc58 ; branche codex/reconcile-config-build. Aucun parcours produit modifié, aucune écriture en base, aucune migration appliquée.

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

## Clerk et déploiement : preuves manquantes

Le client conserve getToken({template: 'supabase'}). current_clerk_user_id lit bien auth.jwt()->>'sub'. Le plugin connecté expose le catalogue SQL, pas les réglages du template Clerk ni de l'authentification tierce. Pas de session Clerk réelle disponible ; Vercel non connecté lors du contrôle.

À confirmer sans copier les secrets dans le dépôt :

1. Même projet Supabase dans les variables serveur/public ; instance Clerk test/live, domaine/issuer, template supabase et mécanisme effectivement accepté par Supabase.
2. Sur comptes de test : JWT signé accepté par Data API, sub Clerk, rôle PostgreSQL authenticated, autorité des claims métier et synchronisation Clerk/profiles. Décoder un JWT ne valide pas sa signature.
3. Vercel : branche/commit déployé, Node 24, npm/lockfile, commande npm run build, variables Preview/Production, domaines Clerk/CSP et restrictions Mapbox. APP_URL et SITE_URL doivent désigner l'origine cible.
4. Recette des droits visiteur/A/B/admin dans un environnement de test. Aucune tentative d'écriture ou d'exploitation sur production dans cet inventaire.

L'[intégration native Clerk](https://supabase.com/docs/guides/auth/third-party/clerk) est recommandée ; templates dépréciés depuis avril 2025, primitives encore disponibles. Pas de migration aveugle. Changelog Supabase consulté le 20 septembre 2026 ; aucun changement de SDK, schéma géré ou extension engagé.

## Changements et limites

Next.js **15.5.14 → 15.5.25**, outils Next/ESLint alignés, versions exactes et lockfile. Node 24.19.0/npm 11.9.0 explicités. CI master/main et PR : npm ci, lint, types, tests, build isolé sans secrets. `.env.example`, contrôles de configuration et export/catalogue documentés. Trois commentaires ESLint inutiles retirés, sans comportement UI changé. Pas de migration majeure, changement React/Clerk ou architecture.

Le build isolé pré-rend un catalogue vide avec clés fictives. Ne jamais déployer sa sortie. Un build réel exige les variables cibles ; pages avec données, authentification et autorisations restent à tester. next/font dépend du réseau Google Fonts. Les dépendances transitives Clerk dépréciées sont signalées à l'installation ; aucune mise à niveau majeure ajoutée.

**Clôture partielle :** inventaire Supabase réel et comparaison terminés ; correctif Next/build préparé. Configuration Clerk/Vercel et recette RLS A/B restent bloquées. Les règles dangereuses sont identifiées, pas corrigées silencieusement. Une reconstruction complète du schéma depuis zéro reste à établir ; ne pas rejouer les migrations historiques.
