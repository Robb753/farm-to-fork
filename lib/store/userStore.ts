// lib/store/userStore.ts - Version corrigée (jsonb favorites + TS safe)
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  determineUserRole,
  updateClerkRole,
  syncProfileToSupabase,
} from "@/lib/syncUserUtils";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import type { UserResource } from "@clerk/types";
import type { Json } from "@/lib/types/database";

// ==================== TYPES ====================

// ⚠️ Chez toi, la table profiles a:
// - id: number
// - user_id: string (Clerk)
// Ici, ton store utilise "id" comme identifiant Clerk (string).
// (On garde ton choix pour éviter de casser le reste de ton app.)
export interface UserProfile {
  id: string; // Clerk user id
  email: string;
  role: "user" | "farmer" | "admin";
  favorites: number[];
}

export type Role = "user" | "farmer" | "admin" | null;

interface UserState {
  profile: UserProfile | null;
  role: Role;

  isSyncing: boolean;
  isReady: boolean;
  isWaitingForProfile: boolean;
  syncError: string | null;

  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: Role) => void;
  setSyncing: (syncing: boolean) => void;
  setReady: (ready: boolean) => void;
  setWaitingForProfile: (waiting: boolean) => void;
  setSyncError: (error: string | null) => void;

  syncUser: (user: UserResource | null) => Promise<void>;
  resyncRole: (user: UserResource | null) => Promise<void>;

  loadFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (listingId: number, userId: string) => Promise<void>;
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;
  isFavorite: (listingId: number) => boolean;

  reset: () => void;
  logoutReset: () => Promise<void>;
}

// ==================== HELPERS ====================

// Robust jsonb -> number[]
const toNumberArray = (value: unknown): number[] => {
  if (!value) return [];

  // Supabase jsonb renvoie souvent déjà un array
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => Number.isFinite(n));
  }

  // Compat avec ancien stockage stringifié
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return toNumberArray(parsed);
    } catch {
      return [];
    }
  }

  return [];
};

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

// ==================== STORE ====================

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

        // ==================== FAVORITES ====================
        loadFavorites: async (userId) => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("favorites")
              .eq("user_id", userId)
              .single();

            if (error) throw error;

            const favoritesArray = toNumberArray(data?.favorites);

            set((state) => {
              if (!state.profile) return state;
              return {
                profile: {
                  ...state.profile,
                  favorites: favoritesArray,
                },
              };
            });
          } catch (error) {
            console.error("[UserStore] Error loading favorites:", error);
            toast.error("Erreur lors du chargement des favoris");
          }
        },

        toggleFavorite: async (listingId, userId) => {
          const state = get();
          if (!state.profile) {
            toast.error("Vous devez être connecté pour gérer vos favoris");
            return;
          }

          const isCurrentlyFavorite =
            state.profile.favorites.includes(listingId);
          const updatedFavorites = isCurrentlyFavorite
            ? state.profile.favorites.filter((id) => id !== listingId)
            : [...state.profile.favorites, listingId];

          const previousFavorites = state.profile.favorites;

          // Optimistic update
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
            // ✅ colonne = jsonb => on envoie directement un array (pas stringify)
            const { error } = await supabase
              .from("profiles")
              .update({ favorites: updatedFavorites as unknown as Json })
              .eq("user_id", userId);

            if (error) throw error;

            toast.success(
              isCurrentlyFavorite ? "Retiré des favoris" : "Ajouté aux favoris"
            );
          } catch (error) {
            console.error("[UserStore] Error toggling favorite:", error);

            // Rollback
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
            const resolvedRole = await determineUserRole(user);
            setRole(resolvedRole);

            if ((user.publicMetadata as any)?.role !== resolvedRole) {
              await updateClerkRole(user.id, resolvedRole);
            }

            await syncProfileToSupabase(user, resolvedRole, {
              createListing: resolvedRole === "farmer",
            });

            setReady(true);
          } catch (e: unknown) {
            const errMsg =
              e instanceof Error ? e.message : "Erreur de synchronisation";
            console.error("[UserStore] Erreur de synchronisation:", e);
            setSyncError(errMsg);

            toast.error(
              "Erreur de synchronisation du profil. Certaines fonctionnalités peuvent être limitées."
            );

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
          const persistApi = (useUserStore as any).persist;
          if (persistApi?.clearStorage) {
            await persistApi.clearStorage();
          }
        },
      }),
      {
        name: "farm2fork-user",
        partialize: (state) => ({
          profile: state.profile,
          role: state.role,
        }),
      }
    )
  )
);

// ==================== SELECTORS ====================
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

export const useIsFavorite = (listingId: number) =>
  useUserStore((s) => s.profile?.favorites.includes(listingId) ?? false);
