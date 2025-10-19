// lib/store/userStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  determineUserRole,
  updateClerkRole,
  syncProfileToSupabase,
} from "@/lib/syncUserUtils";
import { toast } from "sonner";
// (optionnel) importer le type Clerk si tu veux typer `user`
import type { User as ClerkUser } from "@clerk/nextjs/server"; // ou "@clerk/nextjs"

interface UserProfile {
  id: string;
  email: string;
  role: "user" | "farmer" | "admin";
  favorites: number[];
}

type Role = "user" | "farmer" | "admin" | null;

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
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;

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
  | "addFavorite"
  | "removeFavorite"
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
    addFavorite: s.addFavorite,
    removeFavorite: s.removeFavorite,
    reset: s.reset,
    logoutReset: s.logoutReset,
  }));
