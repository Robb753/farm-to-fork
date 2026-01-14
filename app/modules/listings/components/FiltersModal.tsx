"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@/utils/icons";
import { COLORS, FILTER_SECTIONS } from "@/lib/config";
import { cn } from "@/lib/utils";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
// ✅ MIGRATION: Import du store unifié
import { useUnifiedStore } from "@/lib/store/unifiedStore";
import type { FilterState } from "@/lib/store/unifiedStore";

/**
 * Interface pour les props de la modale
 */
interface FiltersModalProps {
  open?: boolean;
  onClose?: () => void;
}

/**
 * Interface pour les sections de filtres (compatible avec FILTER_SECTIONS)
 */
interface FilterSection {
  id: string;
  title: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
    count?: number;
  }>;
}

/**
 * Construit un objet vide de filtres selon la forme du store
 */
const makeEmptyFilters = (): FilterState => {
  return {
    product_type: [],
    certifications: [],
    purchase_mode: [],
    production_method: [],
    additional_services: [],
    availability: [],
    mapType: [],
  };
};

/**
 * Construit une query string à partir des filtres (préserve lat/lng/zoom)
 */
const buildUrlSearch = (
  searchParams: URLSearchParams,
  filters: FilterState
): string => {
  const qs = new URLSearchParams();

  // ✅ Préserver les paramètres carte
  ["lat", "lng", "zoom"].forEach((k) => {
    const v = searchParams.get(k);
    if (v != null && v !== "") qs.set(k, v);
  });

  // ✅ Écrire uniquement les filtres non vides
  Object.entries(filters || {}).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      qs.set(key, values.join(","));
    }
  });

  return qs.toString();
};

export default function FiltersModal({
  open = false,
  onClose,
}: FiltersModalProps): JSX.Element | null {
  // ✅ Store (selectors)
  const currentFilters = useUnifiedStore((state) => state.filters.current);
  const setFilters = useUnifiedStore(
    (state) => state.filtersActions.setFilters
  );
  const resetFilters = useUnifiedStore(
    (state) => state.filtersActions.resetFilters
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Draft local (lazy init)
  const [draft, setDraft] = useState<FilterState>(() => currentFilters);

  /**
   * ✅ Fix ESLint react-hooks/set-state-in-effect
   * - On capture un snapshot des filtres du store dans un ref
   * - On sync le draft UNIQUEMENT au moment de l'ouverture (transition fermé -> ouvert)
   */
  const currentFiltersRef = useRef<FilterState>(currentFilters);
  useEffect(() => {
    currentFiltersRef.current = currentFilters;
  }, [currentFilters]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(currentFiltersRef.current);
    }
    wasOpenRef.current = open;
  }, [open]);

  /**
   * Bloque le scroll derrière la modale quand open = true
   */
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  /**
   * Fermeture avec la touche Échap
   */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  /**
   * Comptage des filtres actifs
   */
  const activeCount = useMemo(() => {
    return Object.values(draft).reduce((acc, v: string[] | unknown) => {
      if (Array.isArray(v)) return acc + v.length;
      return acc;
    }, 0);
  }, [draft]);

  /**
   * Toggle d'un filtre dans le draft
   */
  const toggleDraft = (key: string, value: string): void => {
    setDraft((prevDraft: FilterState) => {
      const arr = Array.isArray(prevDraft[key as keyof FilterState])
        ? (prevDraft[key as keyof FilterState] as string[])
        : [];
      const exists = arr.includes(value);
      const next = exists ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prevDraft, [key]: next } as FilterState;
    });
  };

  /**
   * Effacement d'une section de filtres
   */
  const clearSection = (key: string): void => {
    setDraft((prevDraft: FilterState) => ({
      ...prevDraft,
      [key]: [],
    }));
  };

  /**
   * Application des filtres + MAJ URL
   */
  const apply = (): void => {
    setFilters(draft);

    const query = buildUrlSearch(searchParams, draft);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });

    onClose?.();
  };

  /**
   * Effacement des filtres + MAJ URL
   */
  const clearAll = (): void => {
    const cleared = makeEmptyFilters();

    resetFilters();
    setDraft(cleared);

    const query = buildUrlSearch(searchParams, cleared);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });

    onClose?.();
  };

  // ✅ Ne pas rendre si fermé ou côté serveur
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="filters-modal-title"
    >
      {/* ✅ Backdrop */}
      <button
        type="button"
        className={cn(
          "absolute inset-0 backdrop-blur-sm transition-opacity duration-200",
          "focus:outline-none"
        )}
        style={{
          backgroundColor: `${COLORS.TEXT_PRIMARY}66`,
        }}
        aria-label="Fermer les filtres"
        onClick={onClose}
      />

      {/* ✅ Container principal */}
      <div
        className={cn(
          "relative w-[min(820px,92vw)] max-h-[calc(100vh-8rem)] mt-[5rem]",
          "flex flex-col overflow-hidden rounded-3xl shadow-2xl",
          "animate-in fade-in slide-in-from-bottom-6 duration-300"
        )}
        style={{
          background: `linear-gradient(to bottom, ${COLORS.BG_WHITE}, ${COLORS.BG_GRAY})`,
          borderColor: COLORS.BORDER,
        }}
      >
        {/* ✅ Header */}
        <div
          className={cn(
            "sticky top-0 z-10 flex items-center justify-between gap-3",
            "px-6 py-4 border-b backdrop-blur-md"
          )}
          style={{
            backgroundColor: `${COLORS.BG_WHITE}B3`,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2
            id="filters-modal-title"
            className="text-lg font-semibold tracking-tight"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            🧩 Filtres de recherche
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            )}
            style={{ color: COLORS.TEXT_MUTED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Fermer la modale de filtres"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ✅ Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {FILTER_SECTIONS.map((section: FilterSection) => (
            <section
              key={section.id}
              className={cn("rounded-xl border p-4 shadow-sm backdrop-blur-sm")}
              style={{
                backgroundColor: `${COLORS.BG_WHITE}B3`,
                borderColor: COLORS.BORDER,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3
                  className="text-base font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {section.title}
                </h3>
                {!!draft[section.id as keyof FilterState]?.length && (
                  <button
                    onClick={() => clearSection(section.id)}
                    className={cn(
                      "text-xs transition-colors duration-200",
                      "hover:underline focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
                    )}
                    style={{ color: COLORS.TEXT_MUTED }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.TEXT_MUTED;
                    }}
                    type="button"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {section.options.map((option) => {
                  const checked = (
                    draft[section.id as keyof FilterState] || []
                  ).includes(option.value);

                  return (
                    <button
                      key={`${section.id}-${option.value}`}
                      type="button"
                      onClick={() => toggleDraft(section.id, option.value)}
                      className={cn(
                        "group flex items-center gap-1.5 px-3.5 py-2 rounded-full",
                        "text-sm border font-medium transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
                        checked ? "shadow-sm" : "hover:shadow-sm"
                      )}
                      style={{
                        backgroundColor: checked
                          ? `${COLORS.SUCCESS}20`
                          : COLORS.BG_WHITE,
                        borderColor: checked
                          ? `${COLORS.SUCCESS}60`
                          : COLORS.BORDER,
                        color: checked ? COLORS.SUCCESS : COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={(e) => {
                        if (!checked)
                          e.currentTarget.style.backgroundColor =
                            COLORS.BG_GRAY;
                      }}
                      onMouseLeave={(e) => {
                        if (!checked)
                          e.currentTarget.style.backgroundColor =
                            COLORS.BG_WHITE;
                      }}
                      aria-pressed={checked}
                    >
                      {checked && (
                        <span
                          className={cn(
                            "inline-flex h-3.5 w-3.5 items-center justify-center",
                            "rounded-full text-[10px] font-bold"
                          )}
                          style={{
                            backgroundColor: COLORS.SUCCESS,
                            color: COLORS.BG_WHITE,
                          }}
                        >
                          ✓
                        </span>
                      )}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ✅ Footer sticky */}
        <div
          className={cn(
            "sticky bottom-0 z-10 border-t backdrop-blur-md",
            "px-6 py-4 flex items-center justify-between"
          )}
          style={{
            backgroundColor: `${COLORS.BG_WHITE}E6`,
            borderColor: COLORS.BORDER,
          }}
        >
          <button
            onClick={clearAll}
            className={cn(
              "text-sm transition-colors duration-200",
              "hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
            )}
            style={{ color: COLORS.TEXT_MUTED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_MUTED;
            }}
            type="button"
          >
            Tout effacer
          </button>

          <button
            onClick={apply}
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full",
              "px-6 py-2.5 text-sm font-semibold shadow-sm",
              "transition-all duration-200 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            Voir les résultats
            {activeCount > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center",
                  "rounded-full px-1.5 text-xs font-semibold"
                )}
                style={{
                  backgroundColor: `${COLORS.BG_WHITE}40`,
                  color: COLORS.BG_WHITE,
                }}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
