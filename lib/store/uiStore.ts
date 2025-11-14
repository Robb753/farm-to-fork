// lib/store/uiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Interface pour l'état UI
 */
interface UIState {
  // ═══ État de la carte ═══
  isMapExpanded: boolean;

  // ═══ État responsive ═══
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // ═══ État des modales ═══
  isFiltersModalOpen: boolean;
  isUserMenuOpen: boolean;
  isMobileMenuOpen: boolean;

  // ═══ État du layout ═══
  sidebarCollapsed: boolean;
  headerHeight: number;

  // ═══ État des notifications ═══
  notifications: UINotification[];
  hasUnreadNotifications: boolean;
}

/**
 * Interface pour les notifications UI
 */
interface UINotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
}

/**
 * Interface pour les actions UI
 */
interface UIActions {
  // ═══ Actions carte ═══
  setMapExpanded: (expanded: boolean) => void;
  toggleMapExpanded: () => void;

  // ═══ Actions responsive ═══
  setDeviceState: (state: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }) => void;
  updateScreenSize: () => void;

  // ═══ Actions modales ═══
  setFiltersModalOpen: (open: boolean) => void;
  setUserMenuOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  closeAllModals: () => void;

  // ═══ Actions layout ═══
  setSidebarCollapsed: (collapsed: boolean) => void;
  setHeaderHeight: (height: number) => void;

  // ═══ Actions notifications ═══
  addNotification: (
    notification: Omit<UINotification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // ═══ Reset ═══
  reset: () => void;
}

/**
 * Type combiné pour le store
 */
type UIStore = UIState & UIActions;

/**
 * État initial de l'UI
 */
const INITIAL_UI_STATE: UIState = {
  isMapExpanded: false,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isFiltersModalOpen: false,
  isUserMenuOpen: false,
  isMobileMenuOpen: false,
  sidebarCollapsed: false,
  headerHeight: 64, // Hauteur par défaut du header
  notifications: [],
  hasUnreadNotifications: false,
};

/**
 * Breakpoints pour la détection responsive
 */
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Fonction utilitaire pour la détection d'écran
 */
const getDeviceState = () => {
  if (typeof window === "undefined") {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }

  const width = window.innerWidth;
  return {
    isMobile: width < BREAKPOINTS.mobile,
    isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.tablet,
  };
};

/**
 * Store spécialisé pour l'état global de l'interface utilisateur
 *
 * Features:
 * - Gestion de l'expansion de carte
 * - Détection responsive automatique
 * - Gestion des modales globales
 * - État du layout (sidebar, header)
 * - Système de notifications
 * - Persistence des préférences UI
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // ═══ État initial ═══
      ...INITIAL_UI_STATE,

      // ═══ Actions carte ═══
      setMapExpanded: (isMapExpanded) => {
        set({ isMapExpanded });
      },

      toggleMapExpanded: () => {
        set((state) => ({ isMapExpanded: !state.isMapExpanded }));
      },

      // ═══ Actions responsive ═══
      setDeviceState: ({ isMobile, isTablet, isDesktop }) => {
        set({ isMobile, isTablet, isDesktop });

        // Auto-collapse sidebar on mobile
        if (isMobile) {
          set({ sidebarCollapsed: true });
        }
      },

      updateScreenSize: () => {
        const deviceState = getDeviceState();
        get().setDeviceState(deviceState);
      },

      // ═══ Actions modales ═══
      setFiltersModalOpen: (isFiltersModalOpen) => {
        set({ isFiltersModalOpen });
      },

      setUserMenuOpen: (isUserMenuOpen) => {
        set({ isUserMenuOpen });
      },

      setMobileMenuOpen: (isMobileMenuOpen) => {
        set({ isMobileMenuOpen });
      },

      closeAllModals: () => {
        set({
          isFiltersModalOpen: false,
          isUserMenuOpen: false,
          isMobileMenuOpen: false,
        });
      },

      // ═══ Actions layout ═══
      setSidebarCollapsed: (sidebarCollapsed) => {
        set({ sidebarCollapsed });
      },

      setHeaderHeight: (headerHeight) => {
        set({ headerHeight });
      },

      // ═══ Actions notifications ═══
      addNotification: (notificationData) => {
        const notification: UINotification = {
          ...notificationData,
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications],
          hasUnreadNotifications: true,
        }));

        // Auto-remove non-persistent notifications after 5 seconds
        if (!notification.persistent) {
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, 5000);
        }
      },

      removeNotification: (id) => {
        set((state) => {
          const newNotifications = state.notifications.filter(
            (n) => n.id !== id
          );
          const hasUnreadNotifications = newNotifications.some((n) => !n.read);

          return {
            notifications: newNotifications,
            hasUnreadNotifications,
          };
        });
      },

      markNotificationAsRead: (id) => {
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          const hasUnreadNotifications = newNotifications.some((n) => !n.read);

          return {
            notifications: newNotifications,
            hasUnreadNotifications,
          };
        });
      },

      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          hasUnreadNotifications: false,
        }));
      },

      clearNotifications: () => {
        set({
          notifications: [],
          hasUnreadNotifications: false,
        });
      },

      // ═══ Reset ═══
      reset: () => {
        set({ ...INITIAL_UI_STATE });
      },
    }),
    {
      name: "farm2fork-ui",
      // Persister seulement les préférences utilisateur importantes
      partialize: (state) => ({
        isMapExpanded: state.isMapExpanded,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// ═══ Selectors optimisés ═══

/**
 * Hook pour obtenir l'état complet de l'UI
 */
export const useUIState = () =>
  useUIStore((state) => ({
    isMapExpanded: state.isMapExpanded,
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
    isFiltersModalOpen: state.isFiltersModalOpen,
    isUserMenuOpen: state.isUserMenuOpen,
    isMobileMenuOpen: state.isMobileMenuOpen,
    sidebarCollapsed: state.sidebarCollapsed,
    headerHeight: state.headerHeight,
    notifications: state.notifications,
    hasUnreadNotifications: state.hasUnreadNotifications,
  }));

/**
 * Hook pour obtenir les actions UI
 */
export const useUIActions = () =>
  useUIStore((state) => ({
    setMapExpanded: state.setMapExpanded,
    toggleMapExpanded: state.toggleMapExpanded,
    setDeviceState: state.setDeviceState,
    updateScreenSize: state.updateScreenSize,
    setFiltersModalOpen: state.setFiltersModalOpen,
    setUserMenuOpen: state.setUserMenuOpen,
    setMobileMenuOpen: state.setMobileMenuOpen,
    closeAllModals: state.closeAllModals,
    setSidebarCollapsed: state.setSidebarCollapsed,
    setHeaderHeight: state.setHeaderHeight,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    markNotificationAsRead: state.markNotificationAsRead,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    clearNotifications: state.clearNotifications,
    reset: state.reset,
  }));

/**
 * Selectors spécifiques
 */
export const useIsMapExpanded = () =>
  useUIStore((state) => state.isMapExpanded);
export const useIsMobile = () => useUIStore((state) => state.isMobile);
export const useIsTablet = () => useUIStore((state) => state.isTablet);
export const useIsDesktop = () => useUIStore((state) => state.isDesktop);
export const useDeviceType = () =>
  useUIStore((state) => ({
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
  }));
export const useNotifications = () =>
  useUIStore((state) => state.notifications);
export const useHasUnreadNotifications = () =>
  useUIStore((state) => state.hasUnreadNotifications);

/**
 * Hook helper pour la détection responsive
 * À utiliser dans un composant React pour configurer la détection automatique
 */
export const useResponsiveDetection = () => {
  const updateScreenSize = useUIStore((state) => state.updateScreenSize);

  return {
    updateScreenSize,
    /**
     * Configure la détection responsive automatique
     * À appeler dans useEffect d'un composant root
     */
    setupResponsiveDetection: () => {
      // Initial detection
      updateScreenSize();

      // Listen for resize
      const handleResize = () => updateScreenSize();

      if (typeof window !== "undefined") {
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
      }

      return () => {}; // Noop cleanup for SSR
    },
  };
};

// ═══ Export des types pour utilisation externe ═══
export type { UINotification };

// ═══ Export du store brut pour compatibilité ═══
export default useUIStore;
