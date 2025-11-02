// lib/store/userStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  determineUserRole,
  updateClerkRole,
  syncProfileToSupabase,
} from "@/lib/syncUserUtils";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
// Types centralisés
import type { UserProfile, Role } from "./types";
// Type Clerk
import type { User as ClerkUser } from "@clerk/nextjs/server"; // ou "@clerk/nextjs"

interface UserState {
  // État utilisateur
  profile: UserProfile | null;
  role: Role;

  // États de synchronisation
  isSyncing: boolean;
  isReady: boolean;
  isWaitingForProfile: boolean;
  syncError: string | null;

  // Actions
  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: Role) => void;
  setSyncing: (syncing: boolean) => void;
  setReady: (ready: boolean) => void;
  setWaitingForProfile: (waiting: boolean) => void;
  setSyncError: (error: string | null) => void;

  // Actions métier
  syncUser: (user: ClerkUser | null) => Promise<void>;
  resyncRole: (user: ClerkUser | null) => Promise<void>;

  // Actions favorites (optimisées avec Supabase sync)
  loadFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (listingId: number, userId: string) => Promise<void>;
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;
  isFavorite: (listingId: number) => boolean;

  // Utils
  reset: () => void;
  logoutReset: () => Promise<void>;
}

const INITIAL_STATE: Omit<
  UserState,
  | "setProfile"
  | "setRole"
  | "setSyncing"
  | "setReady"
  | "setWaitingForProfile"
  | "setSyncError"
  | "syncUser"
  | "resyncRole"
  | "loadFavorites"
  | "toggleFavorite"
  | "addFavorite"
  | "removeFavorite"
  | "isFavorite"
  | "reset"
  | "logoutReset"
> = {
  profile: null,
  role: null,
  isSyncing: false,
  isReady: false,
  isWaitingForProfile: false,
  syncError: null,
};

export const useUserStore = create<UserState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // ==================== ACTIONS BASIQUES ====================
        setProfile: (profile) => set({ profile }),
        setRole: (role) => set({ role }),
        setSyncing: (isSyncing) => set({ isSyncing }),
        setReady: (isReady) => set({ isReady }),
        setWaitingForProfile: (isWaitingForProfile) =>
          set({ isWaitingForProfile }),
        setSyncError: (syncError) => set({ syncError }),

        // ==================== ACTIONS FAVORITES ====================
        // Charger les favoris depuis Supabase
        loadFavorites: async (userId) => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("favorites")
              .eq("user_id", userId)
              .single();

            if (error) throw error;

            set((state) => {
              if (!state.profile) return state;
              return {
                profile: {
                  ...state.profile,
                  favorites: data?.favorites || [],
                },
              };
            });
          } catch (error) {
            console.error("[UserStore] Error loading favorites:", error);
            toast.error("Erreur lors du chargement des favoris");
          }
        },

        // Toggle favorite avec optimistic update et sync Supabase
        toggleFavorite: async (listingId, userId) => {
          const state = get();
          if (!state.profile) {
            toast.error("Vous devez être connecté pour gérer vos favoris");
            return;
          }

          const isCurrentlyFavorite = state.profile.favorites.includes(listingId);
          const updatedFavorites = isCurrentlyFavorite
            ? state.profile.favorites.filter((id) => id !== listingId)
            : [...state.profile.favorites, listingId];

          // Optimistic update (mise à jour immédiate de l'UI)
          const previousFavorites = state.profile.favorites;
          set((s) => {
            if (!s.profile) return s;
            return {
              profile: {
                ...s.profile,
                favorites: updatedFavorites,
              },
            };
          });

          try {
            // Synchronisation avec Supabase
            const { error } = await supabase
              .from("profiles")
              .update({ favorites: updatedFavorites })
              .eq("user_id", userId);

            if (error) throw error;

            toast.success(
              isCurrentlyFavorite
                ? "Retiré des favoris"
                : "Ajouté aux favoris"
            );
          } catch (error) {
            console.error("[UserStore] Error toggling favorite:", error);
            // Rollback en cas d'erreur
            set((s) => {
              if (!s.profile) return s;
              return {
                profile: {
                  ...s.profile,
                  favorites: previousFavorites,
                },
              };
            });
            toast.error("Erreur lors de la mise à jour des favoris");
          }
        },

        // Actions simples pour l'état local (utilisées par loadFavorites)
        addFavorite: (listingId) =>
          set((state) => {
            if (!state.profile) return state;
            const exists = state.profile.favorites.includes(listingId);
            if (exists) return state;
            return {
              profile: {
                ...state.profile,
                favorites: [...state.profile.favorites, listingId],
              },
            };
          }),

        removeFavorite: (listingId) =>
          set((state) => {
            if (!state.profile) return state;
            return {
              profile: {
                ...state.profile,
                favorites: state.profile.favorites.filter(
                  (id) => id !== listingId
                ),
              },
            };
          }),

        // Helper pour vérifier si un listing est favori
        isFavorite: (listingId) => {
          const state = get();
          return state.profile?.favorites.includes(listingId) ?? false;
        },

        // ==================== ACTIONS MÉTIER ====================
        syncUser: async (user) => {
          const {
            setSyncing,
            setWaitingForProfile,
            setSyncError,
            setRole,
            setReady,
          } = get();

          // cas déconnecté : on réinitialise proprement l'app
          if (!user) {
            setSyncing(false);
            setWaitingForProfile(false);
            setRole(null);
            setReady(true);
            return;
          }

          setSyncing(true);
          setWaitingForProfile(true);
          setReady(false);
          setSyncError(null);

          try {
            // 1) Résoudre le rôle (Clerk+Supabase)
            const resolvedRole = await determineUserRole(user);
            setRole(resolvedRole);

            // 2) Répercuter côté Clerk si besoin
            if ((user.publicMetadata as any)?.role !== resolvedRole) {
              await updateClerkRole(user.id, resolvedRole);
            }

            // 3) Synchroniser/mettre à jour le profil Supabase
            await syncProfileToSupabase(user, resolvedRole);

            setReady(true);
          } catch (e: unknown) {
            const errMsg =
              e instanceof Error ? e.message : "Erreur de synchronisation";
            console.error("[UserStore] Erreur de synchronisation:", e);
            setSyncError(errMsg);
            toast.error(
              "Erreur de synchronisation du profil. Certaines fonctionnalités peuvent être limitées."
            );
            // Fallback raisonnable
            setRole("user");
            setReady(true);
          } finally {
            setSyncing(false);
            setWaitingForProfile(false);
          }
        },

        resyncRole: async (user) => {
          const { isSyncing, setSyncing, setSyncError, setRole, setReady } =
            get();
          if (!user) {
            console.warn("[UserStore] Aucun utilisateur pour la re-sync");
            return;
          }
          if (isSyncing) return;

          setSyncing(true);
          setSyncError(null);

          try {
            const resolvedRole = await determineUserRole(user);
            setRole(resolvedRole);
            await updateClerkRole(user.id, resolvedRole);
            await syncProfileToSupabase(user, resolvedRole);
            toast.success("Profil synchronisé avec succès");
            setReady(true);
          } catch (e: unknown) {
            const errMsg =
              e instanceof Error ? e.message : "Échec de la re-synchronisation";
            console.error("[UserStore] Échec re-sync:", e);
            setSyncError(errMsg);
            toast.error("Erreur pendant la re-synchronisation du rôle.");
          } finally {
            setSyncing(false);
          }
        },

        // ==================== UTILS ====================
        reset: () => set({ ...INITIAL_STATE }),
        logoutReset: async () => {
          set({ ...INITIAL_STATE });
          // Efface aussi le storage persisté
          const persist = (useUserStore as any).persist;
          if (persist?.clearStorage) {
            await persist.clearStorage();
          }
        },
      }),
      {
        name: "farm2fork-user",
        // On ne persiste que ce qui est utile à la reprise
        partialize: (state) => ({
          profile: state.profile,
          role: state.role,
        }),
      }
    )
  )
);

// ==================== SELECTORS ====================
// (préférables aux champs "computed" dans le store)
export const useUserProfile = () => useUserStore((s) => s.profile);
export const useUserRole = () => useUserStore((s) => s.role);
export const useIsFarmer = () => useUserStore((s) => s.role === "farmer");
export const useIsUser = () => useUserStore((s) => s.role === "user");
export const useUserSyncState = () =>
  useUserStore((s) => ({
    isSyncing: s.isSyncing,
    isReady: s.isReady,
    isWaitingForProfile: s.isWaitingForProfile,
    syncError: s.syncError,
  }));
export const useUserFavorites = () =>
  useUserStore((s) => s.profile?.favorites ?? []);

export const useUserActions = () =>
  useUserStore((s) => ({
    setProfile: s.setProfile,
    setRole: s.setRole,
    setReady: s.setReady,
    setSyncing: s.setSyncing,
    syncUser: s.syncUser,
    resyncRole: s.resyncRole,
    loadFavorites: s.loadFavorites,
    toggleFavorite: s.toggleFavorite,
    addFavorite: s.addFavorite,
    removeFavorite: s.removeFavorite,
    isFavorite: s.isFavorite,
    reset: s.reset,
    logoutReset: s.logoutReset,
  }));

// Helper selector pour vérifier si un listing est favori
export const useIsFavorite = (listingId: number) =>
  useUserStore((s) => s.profile?.favorites.includes(listingId) ?? false);
