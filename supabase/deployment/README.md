# Déploiement préparé — aucune écriture de production autorisée

Cible exclusive : **Farm To Fork / reukdkgdlvgdvyuwuaub**. Préparation du 21 septembre 2026. Aucun SQL applicatif, historique, rôle ou secret distant modifié. Aucune fusion. Aucun chantier producteur.

## Référence et preuves

La PR #114 est en brouillon, HEAD observé **6f491c8525d726be54632157ae92bdbc37bb77ac**. Ce n’est pas le commit de CI #92 (**4bbae2599114f5a5f74dceeb7f8ff28190a99363**) : quatre fichiers documentation/workflow ont changé ensuite, pas les migrations. Le HEAD est validé par [CI #93](https://github.com/Robb753/farm-to-fork/actions/runs/35567598268), jobs `ci` et `database` réussis ; Vercel réussi. `plan.json` fige les SHA-256 des deux migrations validées.

L’inventaire distant a été relu sous `BEGIN TRANSACTION READ ONLY`. `list_migrations` retourne `[]` et `to_regclass('supabase_migrations.schema_migrations')` retourne NULL : il faut créer le suivi historique, pas reconstruire les tables existantes. Tables, colonnes, contraintes, fonctions, triggers, enums, index, policies, grants applicatifs et bucket relus correspondent à la baseline source. Les cinq séquences concernées conservent SELECT/USAGE/UPDATE pour anon/authenticated/service_role ; le correctif retire seulement UPDATE aux deux rôles client.

Les définitions et grants exacts concernés sont dans `observed-permissions.json` (29 policies, grants de tables/colonnes/séquences, flags RLS, is_admin et triggers producteur). Aucun identifiant ou email utilisateur réel n’a été exporté. Cet inventaire doit être renouvelé juste avant exécution ; toute dérive impose une nouvelle revue et, si nécessaire, la régénération du rollback.

## Pré-checks et conditions de passage

Exécuter `prechecks.sql` et `../audit/export-schema.sql` dans une session en lecture seule ; conserver les résultats privés et comparer au catalogue de référence. Les résultats observés sont :

| Contrôle | Résultat | Conséquence |
| --- | --- | --- |
| Profil admin réel en base | 1, avec user_id Clerk et email ; 0 identifiant vide | L’ancien bootstrap email peut être retiré sans supprimer cette ligne. Confirmer que l’opérateur contrôle effectivement ce compte avec une connexion admin ; le SQL seul ne prouve pas l’accès au compte Clerk |
| Produits listing_id/farm_id incohérents | 0 | Pas de ligne actuelle identifiée comme incompatible avec ce nouveau contrôle |
| Fiche possédée sans profil farmer/admin rattaché à cette ferme | 1 | Profil présent et rôle farmer/admin, mais farm_id différent ou absent. L’ancienne policy ALL masquait potentiellement ce défaut. **Ne pas corriger automatiquement ; arbitrer avant le correctif** |
| Objets Storage sans préfixe numérique de fiche | 40 | Ni fiche absente ni fiche non revendiquée : ce sont des chemins non numériques. Lecture publique conservée, écriture/suppression propriétaire refusée par le nouveau contrôle. **Accepter explicitement cet effet ou traiter les chemins séparément avant le correctif** |
| Fiches non revendiquées inactives | 7 | Deviendront invisibles aux visiteurs, comportement recherché ; aucune suppression |
| Demandes producteur pending | 0 | Instantané uniquement ; aucun trigger modifié |
| Historique | Table absente | Adoption nécessaire avant tout push |

Autres conditions avant application : sauvegarde récente/restaurable identifiée par date et référence (non attestée dans cette préparation), accès opérateur Postgres/CLI disponible sans secrets dans les logs, aucun déploiement concurrent, fenêtre courte sans écritures applicatives pour comparer les données avant/après. L’export de métadonnées **n’est pas une sauvegarde des données ni des fichiers Storage**. Aucun nouveau compte/projet/branche payant à créer.

## Simulation des migrations — sans connexion d’écriture

`plan.json` constitue le plan calculé à partir de l’historique distant vide et des deux fichiers locaux, **pas la sortie d’un dry-run CLI distant exécuté** :

| État | Historique distant | SQL considéré en attente |
| --- | --- | --- |
| Actuel | Vide | baseline + targeted_permissions : **ne pas lancer db push** |
| Après adoption prévue | 20260920213943 marqué applied | **20260921051759_targeted_permissions.sql uniquement** |
| Après déploiement prévu | Les deux versions applied | Aucun |

La baseline contient une garde contre une base déjà peuplée, mais cette garde n’est pas la stratégie de déploiement. **Son SQL ne doit jamais être exécuté sur la production.** Les anciens fichiers `legacy-migrations/` ne doivent jamais être recopiés dans `migrations/`.

## Commandes prévues, non exécutées en production

CLI épinglée et aides vérifiées : `supabase@2.117.0`. Préparer un checkout propre dédié au commit approuvé, avec exactement les deux migrations dont les hashes figurent dans `plan.json`. Authentification opérateur via mécanisme CLI habituel ; ne pas coller de mot de passe/token dans le dépôt ou une discussion. `--project-ref` fixe explicitement la cible et évite un lien local ambigu. Aucun `--yes`, `--include-all`, `--include-seed` ou `--include-roles`.

### Phase A — lecture et première frontière d’approbation

```bash
npx --yes supabase@2.117.0 migration list --project-ref reukdkgdlvgdvyuwuaub
```

Attendu : les deux versions locales, aucune version distante. Arrêt si autre état. Avant toute mutation, comparer les métadonnées, les hashes et confirmer le projet. `npx --yes` autorise seulement le téléchargement du paquet épinglé ; aucun flag `--yes` n’est transmis à Supabase.

**STOP : accord explicite requis pour la commande suivante, qui écrit uniquement le suivi historique.** Elle crée si nécessaire le schéma/table de suivi et marque la baseline applied, sans exécuter son fichier SQL. Ne jamais marquer targeted_permissions applied avant son application réelle.

```bash
npx --yes supabase@2.117.0 migration repair 20260920213943 --status applied --project-ref reukdkgdlvgdvyuwuaub
npx --yes supabase@2.117.0 migration list --project-ref reukdkgdlvgdvyuwuaub
npx --yes supabase@2.117.0 db push --dry-run --skip-vault --project-ref reukdkgdlvgdvyuwuaub
```

Après repair : baseline présente dans les deux colonnes, targeted_permissions locale uniquement. Le dry-run doit annoncer **un seul fichier**, `20260921051759_targeted_permissions.sql`. Comparer son SHA-256 à `plan.json` et lire son contenu complet. Si la baseline ou un autre fichier apparaît, **arrêt immédiat**. `--skip-vault` exclut les mises à jour de secrets ; aucune seed/configuration/rôle supplémentaire n’est à pousser. Conserver la sortie du dry-run comme preuve avant la phase B.

### Phase B — second accord pour le seul correctif

**Ne pas exécuter tant que les impacts Storage/profil, la sauvegarde, le compte admin contrôlé et le dry-run exact ne sont pas validés. L’accord de phase A ne vaut pas accord de phase B.**

```bash
npx --yes supabase@2.117.0 db push --skip-vault --project-ref reukdkgdlvgdvyuwuaub
npx --yes supabase@2.117.0 migration list --project-ref reukdkgdlvgdvyuwuaub
npx --yes supabase@2.117.0 db push --dry-run --skip-vault --project-ref reukdkgdlvgdvyuwuaub
```

À la confirmation interactive, un seul fichier doit encore être proposé. Deux versions distantes ensuite ; dernier dry-run sans migration en attente. Ne jamais utiliser `db reset`, `migration up`, `db pull` avec réparation automatique ou appliquer la baseline via SQL Editor/MCP sur la production.

Configurer des timeouts de verrou/statement pour la session de déploiement si le canal choisi le permet, et interrompre en cas de blocage prolongé. Ne pas modifier silencieusement le fichier hashé pour ajouter des commandes. Le correctif utilise BEGIN/COMMIT : un échec SQL avant COMMIT annule ses changements transactionnels. En cas de coupure/résultat ambigu, relire schéma et historique avant toute relance ; un fichier non idempotent ne doit pas être réessayé à l’aveugle.

## Portée exacte, données et recette

Le correctif remplace des policies, retire des privilèges, active RLS sur osm_import_review et remplace **uniquement is_admin()**. Aucun INSERT/UPDATE/DELETE/TRUNCATE applicatif, aucun changement de colonne/contrainte, aucun CREATE/DROP/ALTER TRIGGER. Les mots INSERT/UPDATE/DELETE dans CREATE POLICY/GRANT ne sont pas des mutations de lignes. Les fonctions/triggers d’approbation producteur sont conservés byte pour byte dans le catalogue.

`node scripts/verify-permissions-rollback.mjs` vérifie en PostgreSQL isolé les hashes, l’identité des lignes public/Storage et des valeurs de séquences avant/après correctif, les fonctions/triggers inchangés, puis le retour exact au catalogue/grants d’origine avec le rollback. La matrice validée reste disponible via `npm run db:check`. Ce test ne remplace pas la sauvegarde ni le contrôle des données réelles avant/après sous fenêtre sans écritures concurrentes.

Après déploiement autorisé : vérifier historique, RLS/policies/grants et is_admin, absence de changements de triggers ; tester une session du vrai admin, profiles/favoris et les refus visiteur/A/B. Effectuer upload/upsert/suppression Storage sur des **objets de test explicitement autorisés**, propres à A, et refus sur B ; ne pas tester des suppressions contre les 40 objets existants. Le contrôle de signature Clerk et la recette HTTP Storage restent distincts de la matrice SQL. Aucune nouvelle validation producteur à déclencher.

## Rollback préparé — approbation distincte

`rollback-targeted-permissions.sql` restitue les anciennes policies, les seuls grants retirés, le flag RLS initial et l’ancienne définition is_admin(). Il ne restaure/supprime aucune ligne et ne change pas l’historique. **Il réouvre les vulnérabilités antérieures** : solution d’incident encadrée, pas étape normale. Vérifier aucune dérive concurrente avant utilisation ; préférer un correctif minimal si possible.

Si le correctif a été commité et le rollback devient nécessaire, accord explicite puis exécution du rollback dans une transaction via une session Postgres validée (exemple avec service libpq configuré en privé, SSL vérifié) :

```bash
psql 'service=farm2fork-production' -X -v ON_ERROR_STOP=1 -f supabase/deployment/rollback-targeted-permissions.sql
# Seulement APRÈS succès du rollback et comparaison du catalogue :
npx --yes supabase@2.117.0 migration repair 20260921051759 --status reverted --project-ref reukdkgdlvgdvyuwuaub
npx --yes supabase@2.117.0 migration list --project-ref reukdkgdlvgdvyuwuaub
```

La baseline reste applied. Le patch sera de nouveau pending : interdire tout push automatique jusqu’à nouvelle décision. `migration repair --status reverted` **n’annule aucun SQL** ; il ne fait que supprimer une entrée historique. Si seule l’adoption de baseline a eu lieu et doit être annulée, `migration repair 20260920213943 --status reverted --project-ref reukdkgdlvgdvyuwuaub` exige aussi accord explicite et ne doit jamais être suivi d’un push de baseline.

## Automatisation et arrêt actuel

Workflows du dépôt relus : seuls `start`, `db reset --local`, tests et `stop` Supabase sur runner isolé. Aucun `db push` distant dans CI, package scripts ou commande de build. Une intégration cloud externe n’est pas prouvée absente par cette lecture : aucune fusion master ni nouvelle commande de déploiement automatique préparée. PR conservée en brouillon.

**Arrêt actuel : avant migration repair, avant création de table d’historique et avant toute écriture en production.** Prochaine autorisation proposée : phase A uniquement, puis présentation du dry-run distant réel. La phase B reste bloquée jusqu’à arbitrage des impacts et validation des autres conditions.

Références officielles consultées : [migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair), [db push](https://supabase.com/docs/reference/cli/supabase-db-push), [changelog](https://supabase.com/changelog). Aides de la version CLI épinglée vérifiées : `--project-ref`, `--status`, `--dry-run`, `--skip-vault`.
