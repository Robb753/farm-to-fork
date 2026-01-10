// lib/store/userStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";

import type { UserResource } from "@clerk/types";
import type { Json } from "@/lib/types/database";
import type { SupabaseDbClient } from "@/lib/syncUserUtils";

import {
  determineUserRole,
  updateClerkRole,
  syncProfileToSupabase,
} from "@/lib/syncUserUtils";

// ==================== TYPES ====================

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

  // ✅ Injection du client Supabase (créé via useSupabaseWithClerk côté React)
  supabase: SupabaseDbClient | null;
  initSupabase: (client: SupabaseDbClient) => void;

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
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => Number.isFinite(n));
  }

  // Compat legacy stringifié
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

// Dedup
const uniq = (arr: number[]) => Array.from(new Set(arr));

// ==================== INITIAL STATE ====================

const INITIAL_STATE: Omit<
  UserState,
  | "initSupabase"
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

  supabase: null,
};

// ==================== STORE ====================

export const useUserStore = create<UserState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // ✅ Injection Supabase (à appeler depuis un composant)
        initSupabase: (client) => set({ supabase: client }),

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
          const supabase = get().supabase;
          if (!supabase) {
            console.warn(
              "[UserStore] Supabase non initialisé (loadFavorites)."
            );
            return;
          }

          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("favorites,email,role,user_id")
              .eq("user_id", userId)
              .single();

            if (error) throw error;

            const favoritesArray = uniq(toNumberArray(data?.favorites));

            set((state) => {
              // Si profile absent, on peut initialiser un minimum
              const existing = state.profile;
              const nextProfile: UserProfile = {
                id: userId,
                email: existing?.email ?? data?.email ?? "",
                role: (existing?.role ??
                  (data?.role as any) ??
                  "user") as UserProfile["role"],
                favorites: favoritesArray,
              };

              return { profile: nextProfile };
            });
          } catch (error) {
            console.error("[UserStore] Error loading favorites:", error);
            toast.error("Erreur lors du chargement des favoris");
          }
        },

        toggleFavorite: async (listingId, userId) => {
          const supabase = get().supabase;
          if (!supabase) {
            toast.error("Supabase non prêt. Réessaie dans un instant.");
            return;
          }

          const state = get();
          if (!state.profile) {
            toast.error("Vous devez être connecté pour gérer vos favoris");
            return;
          }

          const isCurrentlyFavorite =
            state.profile.favorites.includes(listingId);
          const updatedFavorites = uniq(
            isCurrentlyFavorite
              ? state.profile.favorites.filter((id) => id !== listingId)
              : [...state.profile.favorites, listingId]
          );

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
            // ✅ jsonb => array direct
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
                favorites: uniq([...state.profile.favorites, listingId]),
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

        isFavorite: (listingId) =>
          get().profile?.favorites.includes(listingId) ?? false,

        // ==================== ACTIONS MÉTIER ====================
        syncUser: async (user) => {
          const {
            setSyncing,
            setWaitingForProfile,
            setSyncError,
            setRole,
            setReady,
          } = get();

          const supabase = get().supabase;

          if (!user) {
            setSyncing(false);
            setWaitingForProfile(false);
            setSyncError(null);
            setRole(null);
            setReady(true);
            set({ profile: null });
            return;
          }

          if (!supabase) {
            // On évite de “crasher” si le store sync avant initSupabase()
            console.warn("[UserStore] Supabase non initialisé (syncUser).");
            setRole(((user.publicMetadata as any)?.role ?? "user") as any);
            setReady(true);
            setSyncing(false);
            setWaitingForProfile(false);
            return;
          }

          setSyncing(true);
          setWaitingForProfile(true);
          setReady(false);
          setSyncError(null);

          try {
            const resolvedRole = await determineUserRole(supabase, user);
            setRole(resolvedRole);

            if ((user.publicMetadata as any)?.role !== resolvedRole) {
              await updateClerkRole(user.id, resolvedRole);
            }

            await syncProfileToSupabase(supabase, user, resolvedRole, {
              createListing: resolvedRole === "farmer",
            });

            // Charge favorites + email/role depuis Supabase (source of truth)
            await get().loadFavorites(user.id);

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
          const supabase = get().supabase;

          if (!user) {
            console.warn("[UserStore] Aucun utilisateur pour la re-sync");
            return;
          }
          if (isSyncing) return;

          if (!supabase) {
            toast.error("Supabase non prêt. Réessaie dans un instant.");
            return;
          }

          setSyncing(true);
          setSyncError(null);

          try {
            const resolvedRole = await determineUserRole(supabase, user);
            setRole(resolvedRole);

            await updateClerkRole(user.id, resolvedRole);
            await syncProfileToSupabase(supabase, user, resolvedRole);

            // Refresh profil local
            await get().loadFavorites(user.id);

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
        // ✅ on persiste supabase ? non (il n'est pas sérialisable)
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
    initSupabase: s.initSupabase,
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
