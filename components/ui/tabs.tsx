// components/ui/tabs.tsx
"use client";

import React, { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

/**
 * Types pour le système de tabs
 */
interface TabsContextValue {
  activeTab: string | undefined;
  setActiveTab: (value: string) => void;
}

interface TabsProps {
  /** Valeur du tab actif par défaut */
  defaultValue?: string;
  /** Valeur du tab actif (mode contrôlé) */
  value?: string;
  /** Callback appelé lors du changement de tab */
  onValueChange?: (value: string) => void;
  /** Children components */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Orientation des tabs */
  orientation?: "horizontal" | "vertical";
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  /** Valeur unique identifiant ce tab */
  value: string;
  /** Contenu du déclencheur */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Si le tab est désactivé */
  disabled?: boolean;
}

interface TabsContentProps {
  /** Valeur du tab associé */
  value: string;
  /** Contenu à afficher */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Context pour partager l'état des tabs
 */
const TabsContext = createContext<TabsContextValue | undefined>(undefined);

/**
 * Hook pour accéder au context des tabs
 */
const useTabs = () => {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error("useTabs must be used within a Tabs component");
  }
  return context;
};

/**
 * Composant Tabs principal avec gestion d'état
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Contenu du Tab 1</TabsContent>
 *   <TabsContent value="tab2">Contenu du Tab 2</TabsContent>
 * </Tabs>
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
  orientation = "horizontal",
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Mode contrôlé vs non contrôlé
  const activeTab = controlledValue ?? internalValue;

  const setActiveTab = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn(
          "w-full",
          orientation === "vertical" && "flex gap-4",
          className
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * Liste des déclencheurs de tabs
 */
export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Déclencheur individuel de tab
 */
export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
}) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = value === activeTab;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`content-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      data-state={isActive ? "active" : "inactive"}
    >
      {children}
    </button>
  );
};

/**
 * Contenu d'un tab
 */
export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useTabs();
  const isActive = value === activeTab;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`content-${value}`}
      aria-labelledby={`trigger-${value}`}
      tabIndex={0}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      data-state={isActive ? "active" : "inactive"}
    >
      {children}
    </div>
  );
};

/**
 * Export des types pour utilisation externe
 */
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  TabsContextValue,
};
