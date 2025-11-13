"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  X,
  Filter,
  Check,
  ArrowLeft,
  MapPin,
  List,
} from "lucide-react";

import {
  useFiltersState,
  useFiltersActions,
  filterSections,
  useMapActions,
  useMapState,
  MAPBOX_CONFIG,
  useUIState,
  useUIActions,
} from "@/lib/store/migratedStore";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useUpdateExploreUrl } from "@/utils/updateExploreUrl";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

// ✅ type du store (assure-toi qu'il est exporté par ton code)
import type { FilterState } from "@/lib/store/types";

/* ------------------------------------------------------------------ */
/* ---------------------------- Types locaux ------------------------- */
/* ------------------------------------------------------------------ */

type FilterSectionDef = {
  title: string;
  key: string; // vient d'une config externe → on vérifie avec un guard
  items: string[];
};

type FiltersModalProps = {
  open: boolean;
  onClose: () => void;
};

type MediaQueryChangeEvent = MediaQueryListEvent | MediaQueryList;

/* ------------------------------------------------------------------ */
/* ---------------------- Aide & constants typés --------------------- */
/* ------------------------------------------------------------------ */

// Clés réelles du store (mets-les à jour si tu ajoutes un filtre)
type FilterKey = keyof FilterState;
const FILTER_KEYS: readonly FilterKey[] = [
  "product_type",
  "certifications",
  "purchase_mode",
  "production_method",
  "additional_services",
  "availability",
  "mapType",
] as const;

function isFilterKey(k: string): k is FilterKey {
  return (FILTER_KEYS as readonly string[]).includes(k);
}

/* ------------------------------------------------------------------ */
/* -------------------- Ouverture modale (mobile) -------------------- */
/* ------------------------------------------------------------------ */

export const openMobileFilters = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMobileFilters"));
  }
};

const FiltersModal = dynamic<FiltersModalProps>(
  () => import("@/app/modules/listings/components/FiltersModal"),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/* ------------------------------ UI bits ---------------------------- */
/* ------------------------------------------------------------------ */

interface SimpleCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

const SimpleCheckbox: React.FC<SimpleCheckboxProps> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onChange();
    }}
    onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onChange();
      }
    }}
    className="flex w-full cursor-pointer items-center gap-3 text-left"
  >
    <span
      className={`flex h-4 w-4 items-center justify-center rounded border text-white transition ${
        checked
          ? "border-emerald-600 bg-emerald-600"
          : "border-gray-300 bg-white"
      }`}
    >
      {checked && <Check className="h-3 w-3" />}
    </span>
    <span className="text-sm text-gray-700">{label}</span>
  </button>
);

const filtersToUrlParams = (filters: FilterState): Record<string, string> => {
  const params: Record<string, string> = {};
  (Object.entries(filters) as [FilterKey, string[]][]).forEach(
    ([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        params[key] = values.join(",");
      }
    }
  );
  return params;
};

function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 300
): (...args: Args) => void {
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Args) => {
      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

interface DropdownPillProps {
  label: string;
  values?: string[];
  children: ReactNode;
  onClear?: () => void;
}

const DropdownPill: React.FC<DropdownPillProps> = ({
  label,
  values,
  children,
  onClear,
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const positionPanel = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = Math.min(320, Math.max(260, r.width));
    const margin = 8;
    let left = r.left;
    if (left + width > window.innerWidth - margin) {
      left = window.innerWidth - margin - width;
    }
    const top = r.bottom + 8;
    setPos({ top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    positionPanel();
    const onResize = () => positionPanel();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, positionPanel]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const btn = btnRef.current;
      const pnl = panelRef.current;
      const target = e.target as Node | null;
      if (!btn || !pnl || !target) return;
      if (btn.contains(target) || pnl.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = Array.isArray(values) ? values.length : 0;
  const active = count > 0;

  const button = (
    <button
      ref={btnRef}
      type="button"
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs shadow-[0_1px_0_0_rgba(17,24,39,0.04)] transition ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
      }`}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <span className="text-xs">{label}</span>
      {count > 0 && (
        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-medium text-white">
          {count}
        </span>
      )}
      {active && onClear ? (
        <span
          onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className="-mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/60"
          aria-label={`Effacer ${label}`}
        >
          <X className="h-3 w-3" />
        </span>
      ) : (
        <ChevronDown className="h-3 w-3" />
      )}
    </button>
  );

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        role="menu"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 10000,
        }}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xl"
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) =>
          e.stopPropagation()
        }
      >
        {children}
        <div className="mt-3 flex justify-end">
          <button
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="relative">
      {button}
      {panel}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* --------------------------- Composant ----------------------------- */
/* ------------------------------------------------------------------ */

const FilterSection: React.FC = () => {
  const filters = useFiltersState(); // FilterState
  const { toggleFilter, resetFilters, setFilters } = useFiltersActions();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const updateExploreUrl = useUpdateExploreUrl();

  // mapInstance typé léger pour éviter les erreurs
  const { mapInstance } = useMapState() as {
    mapInstance?: {
      easeTo?: (options: {
        center: [number, number];
        zoom: number;
        pitch: number;
        bearing: number;
        duration: number;
        essential: boolean;
      }) => void;
    };
  };
  const { setCoordinates, setZoom } = useMapActions();

  const { isMapExpanded } = useUIState();
  const { setMapExpanded } = useUIActions();

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasPendingAreaChange, setHasPendingAreaChange] = useState(false);

  // Merge “sûr” pour reconstruire un FilterState complet depuis un partiel
  const mergeFilters = useCallback(
    (partial: Partial<FilterState>): FilterState => ({
      product_type: partial.product_type ?? [],
      certifications: partial.certifications ?? [],
      purchase_mode: partial.purchase_mode ?? [],
      production_method: partial.production_method ?? [],
      additional_services: partial.additional_services ?? [],
      availability: partial.availability ?? [],
      mapType: partial.mapType ?? [],
    }),
    []
  );

  /* ---- Hydration via URL ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlFilters: Partial<FilterState> = {};

    (filterSections as any as FilterSectionDef[]).forEach(({ key }) => {
      const raw = params.get(key);
      if (raw && isFilterKey(key)) {
        urlFilters[key] = raw.split(",").filter(Boolean);
      }
    });

    const mapTypeVal = params.get("mapType");
    if (mapTypeVal) {
      urlFilters.mapType = mapTypeVal.split(",").filter(Boolean);
    }

    if (Object.keys(urlFilters).length > 0) {
      setFilters(mergeFilters(urlFilters));
    }
    setHydratedFromUrl(true);
  }, [setFilters, mergeFilters]);

  /* ---- Sync URL (debounced) ---- */
  const pushUrl = useDebouncedCallback((f: FilterState) => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) return;
    updateExploreUrl({ lat, lng, ...filtersToUrlParams(f) });
  }, 300);

  useEffect(() => {
    if (!hydratedFromUrl) return;
    pushUrl(filters);
  }, [filters, hydratedFromUrl, pushUrl]);

  /* ---- Mobile modal control ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryChangeEvent) => {
      const matches =
        "matches" in e ? e.matches : (e as MediaQueryList).matches;
      setIsMobile(matches);
    };
    onChange(mq);

    const handleChange = (event: Event) =>
      onChange(event as MediaQueryListEvent);
    mq.addEventListener("change", handleChange);

    const handleOpen = () => setIsMobileModalOpen(true);
    window.addEventListener("openMobileFilters", handleOpen);

    return () => {
      mq.removeEventListener("change", handleChange);
      window.removeEventListener("openMobileFilters", handleOpen);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.removeProperty("overflow");
  }, [isMobileModalOpen]);

  /* ---- Zone modifiée (events) ---- */
  useEffect(() => {
    const onDirty = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setHasPendingAreaChange(Boolean(detail));
    };
    window.addEventListener("areaDirtyChange", onDirty);
    return () => window.removeEventListener("areaDirtyChange", onDirty);
  }, []);

  /* ---- URL cleaner (resets) ---- */
  const syncUrl = useCallback(
    (nextFilters: FilterState) => {
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");

      const qs = new URLSearchParams();
      if (lat) qs.set("lat", lat);
      if (lng) qs.set("lng", lng);

      (Object.entries(nextFilters) as [FilterKey, string[]][]).forEach(
        ([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            qs.set(key, values.join(","));
          }
        }
      );

      const query = qs.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  /* ---- Handlers (TYPES SÛRS) ---- */
  const handleFilterChange = useCallback(
    <K extends FilterKey>(key: K, value: string) => toggleFilter(key, value),
    [toggleFilter]
  );

  const clearSection = useCallback(
    (key: FilterKey) => {
      const complete = mergeFilters({ ...filters, [key]: [] });
      setFilters(complete);
      syncUrl(complete);
    },
    [filters, setFilters, syncUrl, mergeFilters]
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      ),
    [filters]
  );

  const recenterEurope = useCallback(() => {
    const [lng, lat] = MAPBOX_CONFIG.center;
    setCoordinates({ lat, lng });
    setZoom(MAPBOX_CONFIG.zoom);
    try {
      mapInstance?.easeTo?.({
        center: [lng, lat],
        zoom: MAPBOX_CONFIG.zoom,
        pitch: 0,
        bearing: 0,
        duration: 600,
        essential: true,
      });
    } catch (e) {
      // noop
    }
  }, [mapInstance, setCoordinates, setZoom]);

  const resetAllFilters = useCallback(() => {
    resetFilters();
    const emptyFilters = mergeFilters({});
    syncUrl(emptyFilters);
    recenterEurope();
  }, [resetFilters, syncUrl, recenterEurope, mergeFilters]);

  const resetMapFilters = useCallback(() => {
    const complete = mergeFilters({ ...filters, mapType: [] });
    setFilters(complete);
    syncUrl(complete);
  }, [filters, setFilters, syncUrl, mergeFilters]);

  useEffect(() => {
    if (hasPendingAreaChange) {
      // hook dispo pour logique future
    }
  }, [hasPendingAreaChange]);

  /* ------------------------------- Render ------------------------------- */

  if (isMobile && isMobileModalOpen) {
    return (
      <div className="fixed inset-0 z-5 overflow-y-auto bg-white">
        <div className="sticky top-0 border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="flex items-center gap-2 text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
            <h1 className="text-lg font-semibold">Filtres</h1>
            <button
              onClick={() => {
                resetAllFilters();
                setIsMobileModalOpen(false);
              }}
              className="font-medium text-emerald-600"
            >
              Effacer
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-gray-500">
            Contenu des filtres mobiles à implémenter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="w-full border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-3">
          <div className="no-scrollbar flex h-12 items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            {(filterSections as any as FilterSectionDef[]).map(
              ({ title, key, items }) => {
                if (!isFilterKey(key)) return null; // Narrowing ⬅️

                const values = filters[key];

                return (
                  <DropdownPill
                    key={key}
                    label={title}
                    values={values}
                    onClear={() => clearSection(key)}
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        {title}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {items.map((item) => {
                          const checked = (values || []).includes(item);
                          return (
                            <SimpleCheckbox
                              key={`${key}-${item}`}
                              checked={checked}
                              onChange={() => handleFilterChange(key, item)}
                              label={item}
                            />
                          );
                        })}
                      </div>
                      {(values?.length || 0) > 0 && (
                        <div className="pt-1">
                          <button
                            onClick={() => clearSection(key)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Réinitialiser
                          </button>
                        </div>
                      )}
                    </div>
                  </DropdownPill>
                );
              }
            )}

            <DropdownPill
              label="Type d'agriculture"
              values={filters.mapType}
              onClear={resetMapFilters}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Type d'agriculture
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: "conventional",
                      label: "Agriculture conventionnelle",
                    },
                    { id: "organic", label: "Agriculture biologique" },
                    { id: "sustainable", label: "Agriculture durable" },
                    { id: "reasoned", label: "Agriculture raisonnée" },
                  ].map((t) => {
                    const checked = (filters.mapType || []).includes(t.id);
                    return (
                      <SimpleCheckbox
                        key={`map-${t.id}`}
                        checked={checked}
                        onChange={() => handleFilterChange("mapType", t.id)}
                        label={t.label}
                      />
                    );
                  })}
                </div>
                {(filters.mapType?.length || 0) > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={resetMapFilters}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            </DropdownPill>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs shadow-[0_1px_0_0_rgba(17,24,39,0.04)] hover:bg-gray-50"
              aria-label="Ouvrir la fenêtre des filtres"
            >
              <Filter className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex">
              <div className="ml-2 flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-[0_1px_0_0_rgba(17,24,39,0.04)]">
                <button
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${
                    !isMapExpanded
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setMapExpanded(false)}
                >
                  <List className="h-4 w-4" />
                  <span>Liste</span>
                </button>
                <button
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${
                    isMapExpanded
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setMapExpanded(true)}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Carte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FiltersModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {activeFilterCount > 0 && (
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-3 py-1">
          <span className="text-xs text-gray-500">Filtres actifs :</span>
          {(Object.entries(filters) as [FilterKey, string[]][]).flatMap(
            ([key, values]) =>
              (values || []).map((value) => (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                >
                  {value}
                  <button
                    onClick={() => handleFilterChange(key, value)}
                    aria-label={`Retirer ${value}`}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
          )}
          <button
            onClick={resetAllFilters}
            className="ml-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Effacer tous les filtres
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(FilterSection);
