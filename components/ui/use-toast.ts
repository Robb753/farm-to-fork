// hooks/use-toast.ts
"use client";

import * as React from "react";

/**
 * Configuration du système de toast
 */
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Types pour les actions du reducer
 */
type ActionType = {
  ADD_TOAST: "ADD_TOAST";
  UPDATE_TOAST: "UPDATE_TOAST";
  DISMISS_TOAST: "DISMISS_TOAST";
  REMOVE_TOAST: "REMOVE_TOAST";
};

const actionTypes: ActionType = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * Interface pour un toast
 */
export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
  duration?: number;
}

/**
 * Props pour créer un nouveau toast
 */
export type ToastProps = Omit<Toast, "id">;

/**
 * État du système de toast
 */
interface State {
  toasts: Toast[];
}

/**
 * Actions possibles sur le système de toast
 */
type Action =
  | {
      type: "ADD_TOAST";
      toast: Toast;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<Toast>;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: Toast["id"];
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: Toast["id"];
    };

/**
 * Générateur d'ID unique pour les toasts
 */
let count = 0;

function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/**
 * Map des timeouts pour gérer la suppression automatique
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Ajoute un toast à la queue de suppression
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Reducer pour gérer l'état des toasts
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Side effects - gérer la suppression automatique
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

/**
 * Listeners pour les changements d'état
 */
const listeners: Array<(state: State) => void> = [];

/**
 * État en mémoire du système de toast
 */
let memoryState: State = { toasts: [] };

/**
 * Dispatcher pour les actions
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * Interface pour les retours de la fonction toast
 */
interface ToastReturn {
  id: string;
  dismiss: () => void;
  update: (props: ToastProps) => void;
}

/**
 * Fonction pour créer et afficher un toast
 * 
 * @param props - Configuration du toast
 * @returns Objet avec méthodes de contrôle du toast
 * 
 * @example
 * ```typescript
 * const { dismiss, update } = toast({
 *   title: "Succès",
 *   description: "Votre action a été effectuée",
 *   variant: "default"
 * });
 * 
 * // Modifier le toast
 * update({ description: "Nouvelle description" });
 * 
 * // Fermer le toast
 * dismiss();
 * ```
 */
function toast(props: ToastProps): ToastReturn {
  const id = genId();

  const update = (newProps: ToastProps) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...newProps, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

/**
 * Interface de retour du hook useToast
 */
interface UseToastReturn extends State {
  toast: (props: ToastProps) => ToastReturn;
  dismiss: (toastId?: string) => void;
}

/**
 * Hook pour utiliser le système de toast
 * 
 * @returns État et fonctions de contrôle des toasts
 * 
 * @example
 * ```typescript
 * const { toasts, toast, dismiss } = useToast();
 * 
 * // Afficher un toast de succès
 * toast({
 *   title: "Succès !",
 *   description: "Opération réussie",
 *   variant: "default"
 * });
 * 
 * // Afficher un toast d'erreur
 * toast({
 *   title: "Erreur",
 *   description: "Une erreur est survenue",
 *   variant: "destructive"
 * });
 * 
 * // Fermer tous les toasts
 * dismiss();
 * ```
 */
function useToast(): UseToastReturn {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

/**
 * Export des fonctions et types principaux
 */
export { useToast, toast, actionTypes };
export type { ToastReturn, UseToastReturn, State, Action, ActionType };