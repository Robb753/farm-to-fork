/**
 * Point d'entrée centralisé pour les clients Supabase.
 *
 * Convention de nommage :
 *  - @/lib/supabase   → nouveau chemin canonique (préférer pour tout nouveau code)
 *  - @/utils/supabase → chemin historique (toujours fonctionnel, 24 fichiers existants)
 *
 * Les deux pointent vers les mêmes implémentations ; aucune migration forcée.
 */

// Client navigateur (avec token Clerk injecté via useAuth)
export { useSupabaseWithClerk } from "@/utils/supabase/client";

// Client serveur public (service role, sans auth utilisateur)
export { supabaseServerPublic } from "@/utils/supabase/server-public";
