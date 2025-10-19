// lib/store/userStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  determineUserRole,
  updateClerkRole,
  syncProfileToSupabase,
} from "@/lib/syncUserUtils";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  role: "user" | "farmer" | "admin";
  favorites: number[];
}

interface UserState {
  // État utilisateur
  profile: UserProfile | null;
  role: "user" | "farmer" | "admin" | null;

  // États de synchronisation
  isSyncing: boolean;
  isReady: boolean;
  isWaitingForProfile: boolean;
  syncError: string | null;

  // Actions
  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: "user" | "farmer" | "admin" | null) => void;
  setSyncing: (syncing: boolean) => void;
  setReady: (ready: boolean) => void;
  setWaitingForProfile: (waiting: boolean) => void;
  setSyncError: (error: string | null) => void;

  // Actions métier
  syncUser: (user: any) => Promise<void>;
  resyncRole: (user: any) => Promise<void>;
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;

  // Getters computed
  isFarmer: boolean;
  isUser: boolean;

  // Utils
  reset: () => void;
}

const INITIAL_STATE = {
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
        // État initial
        ...INITIAL_STATE,

        // Getters computed
        get isFarmer() {
          return get().role === "farmer";
        },
        get isUser() {
          return get().role === "user";
        },

        // ==================== ACTIONS BASIQUES ====================
        setProfile: (profile) => set({ profile }),
        setRole: (role) => set({ role }),
        setSyncing: (isSyncing) => set({ isSyncing }),
        setReady: (isReady) => set({ isReady }),
        setWaitingForProfile: (isWaitingForProfile) =>
          set({ isWaitingForProfile }),
        setSyncError: (syncError) => set({ syncError }),

        // ==================== ACTIONS FAVORITES ====================
        addFavorite: (listingId) =>
          set((state) => {
            if (!state.profile) return state;
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

        // ==================== ACTIONS MÉTIER ====================
        syncUser: async (user) => {
          if (!user) {
            console.warn("[UserStore] Aucun utilisateur fourni pour la sync");
            return;
          }

          const {
            setSyncing,
            setWaitingForProfile,
            setSyncError,
            setRole,
            setReady,
          } = get();

          setSyncing(true);
          setWaitingForProfile(true);
          setSyncError(null);

          try {
            // 1. Déterminer le rôle (Clerk → Supabase)
            const resolvedRole = await determineUserRole(user);
            setRole(resolvedRole);

            // 2. Mettre à jour Clerk si nécessaire
            if (user.publicMetadata?.role !== resolvedRole) {
              await updateClerkRole(user.id, resolvedRole);
            }

            // 3. Synchroniser Supabase
            await syncProfileToSupabase(user, resolvedRole);

            setReady(true);
          } catch (error) {
            console.error("[UserStore] Erreur de synchronisation:", error);
            setSyncError(error.message || "Erreur de synchronisation");

            toast.error(
              "Erreur de synchronisation du profil. Certaines fonctionnalités peuvent être limitées."
            );

            // En cas d'erreur, on fallback sur "user"
            setRole("user");
            setReady(true);
          } finally {
            setSyncing(false);
            setWaitingForProfile(false);
          }
        },

        resyncRole: async (user) => {
          if (!user) {
            console.warn(
              "[UserStore] Aucun utilisateur fourni pour la re-sync"
            );
            return;
          }

          const { isSyncing, setSyncing, setSyncError, setRole, setReady } =
            get();

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
          } catch (error) {
            console.error("[UserStore] Échec re-sync:", error);
            setSyncError(error.message || "Échec de la re-synchronisation");
            toast.error("Erreur pendant la re-synchronisation du rôle.");
          } finally {
            setSyncing(false);
          }
        },

        // ==================== UTILS ====================
        reset: () => set(INITIAL_STATE),
      }),
      {
        name: "farm2fork-user",
        partialize: (state) => ({
          profile: state.profile,
          role: state.role,
          // Ne pas persister les états temporaires de sync
        }),
      }
    )
  )
);

// ==================== SELECTORS ====================
export const useUserProfile = () => useUserStore((state) => state.profile);
export const useUserRole = () => useUserStore((state) => state.role);
export const useIsFarmer = () =>
  useUserStore((state) => state.role === "farmer");
export const useIsUser = () => useUserStore((state) => state.role === "user");
export const useUserSyncState = () =>
  useUserStore((state) => ({
    isSyncing: state.isSyncing,
    isReady: state.isReady,
    isWaitingForProfile: state.isWaitingForProfile,
    syncError: state.syncError,
  }));
export const useUserFavorites = () =>
  useUserStore((state) => state.profile?.favorites ?? []);

// Actions selectors
export const useUserActions = () =>
  useUserStore((state) => ({
    setProfile: state.setProfile,
    setRole: state.setRole, // ✅ Ajouté
    setReady: state.setReady, // ✅ Ajouté
    setSyncing: state.setSyncing, // ✅ Ajouté (optionnel)
    syncUser: state.syncUser,
    resyncRole: state.resyncRole,
    addFavorite: state.addFavorite,
    removeFavorite: state.removeFavorite,
    reset: state.reset,
  }));
