// app/_components/layout/FilterSection.jsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ChevronDown, X, Filter, Check, ArrowLeft } from "@/utils/icons";
import {
  useFiltersState,
  useFiltersActions,
  filterSections,
  useMapboxActions,
  useMapboxState,
  MAPBOX_CONFIG,
} from "@/lib/store/mapboxListingsStore";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useUpdateExploreUrl } from "@/utils/updateExploreUrl";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";

/* -------- open on mobile from elsewhere -------- */
export const openMobileFilters = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMobileFilters"));
  }
};

const FiltersModal = dynamic(
  () => import("@/app/modules/listings/components/FiltersModal"),
  { ssr: false }
);

const mapFilterTypes = [
  { id: "conventional", label: "Agriculture conventionnelle" },
  { id: "organic", label: "Agriculture biologique" },
  { id: "sustainable", label: "Agriculture durable" },
  { id: "reasoned", label: "Agriculture raisonnée" },
];

/* -------- small UI bits -------- */
const SimpleCheckbox = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={(e) => {
      e.stopPropagation();
      onChange();
    }}
    onKeyDown={(e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onChange();
      }
    }}
    className="flex w-full cursor-pointer items-center gap-3 text-left"
  >
    <span
      className={`flex h-4 w-4 items-center justify-center rounded border text-white transition
        ${checked ? "border-emerald-600 bg-emerald-600" : "border-gray-300 bg-white"}`}
    >
      {checked && <Check className="h-3 w-3" />}
    </span>
    <span className="text-sm text-gray-700">{label}</span>
  </button>
);

/* filters -> query params */
const filtersToUrlParams = (filters) => {
  const params = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0)
      params[key] = values.join(",");
  });
  return params;
};

/* debounce helper */
const useDebouncedCallback = (fn, delay = 300) => {
  const tRef = useRef(null);
  return useCallback(
    (...args) => {
      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
};

const DropdownPill = ({ label, values, children, onClear }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });

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
    const onClick = (e) => {
      const btn = btnRef.current;
      const pnl = panelRef.current;
      if (!btn || !pnl) return;
      if (btn.contains(e.target) || pnl.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
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
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
      }`}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <span>{label}</span>
      {count ? (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/80 px-1.5 text-xs">
          {count}
        </span>
      ) : null}
      {active && onClear ? (
        <span
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/60"
          aria-label={`Effacer ${label}`}
        >
          <X className="h-4 w-4" />
        </span>
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  const panel =
    open &&
    ReactDOM.createPortal(
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
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
        <div className="mt-3 flex justify-end">
          <button
            onMouseDown={(e) => {
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

/* ---------- Component ---------- */
const FilterSection = () => {
  const filters = useFiltersState();
  const { toggleFilter, resetFilters, setFilters } = useFiltersActions();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const updateExploreUrl = useUpdateExploreUrl();

  // Map actions/state pour reset propre de la vue
  const { setCoordinates, setMapZoom, setMapPitch, setMapBearing } =
    useMapboxActions();
  const { mapInstance } = useMapboxState();

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ---- URL hydration ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlFilters = {};

    filterSections.forEach(({ key }) => {
      const raw = params.get(key);
      if (raw) urlFilters[key] = raw.split(",").filter(Boolean);
    });

    const mapTypeVal = params.get("mapType");
    if (mapTypeVal) urlFilters.mapType = mapTypeVal.split(",").filter(Boolean);

    if (Object.keys(urlFilters).length > 0) setFilters(urlFilters);
    setHydratedFromUrl(true);
  }, [setFilters]);

  /* ---- Debounced normal sync (toggling cases) ---- */
  const pushUrl = useDebouncedCallback((f) => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) return;
    updateExploreUrl({ lat, lng, ...filtersToUrlParams(f) });
  }, 300);

  useEffect(() => {
    if (!hydratedFromUrl) return;
    pushUrl(filters);
  }, [filters, hydratedFromUrl, pushUrl]);

  /* ---- Full-width modal control ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches ?? e.target.matches);
    onChange(mq);
    mq.addEventListener?.("change", onChange);
    const open = () => setIsMobileModalOpen(true);
    window.addEventListener("openMobileFilters", open);
    return () => {
      mq.removeEventListener?.("change", onChange);
      window.removeEventListener("openMobileFilters", open);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.removeProperty("overflow");
  }, [isMobileModalOpen]);

  /* ---- URL cleaner helper (used for resets) ---- */
  const syncUrl = useCallback(
    (nextFilters) => {
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");

      const qs = new URLSearchParams();
      if (lat) qs.set("lat", lat);
      if (lng) qs.set("lng", lng);

      Object.entries(nextFilters || {}).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          qs.set(key, values.join(","));
        }
      });

      const query = qs.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  /* ---- Handlers ---- */
  const handleFilterChange = useCallback(
    (key, value) => toggleFilter(key, value),
    [toggleFilter]
  );

  // Réinitialiser une SECTION (et nettoyer l'URL tout de suite)
  const clearSection = useCallback(
    (key) => {
      const next = { ...filters, [key]: [] };
      setFilters({ [key]: [] });
      syncUrl(next);
    },
    [filters, setFilters, syncUrl]
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      ),
    [filters]
  );

  // 🔁 Utilitaire : remettre la vue Europe (store + vraie carte)
  const recenterEurope = useCallback(() => {
    const [lng, lat] = MAPBOX_CONFIG.center;
    setCoordinates({ lat, lng });
    setMapZoom(MAPBOX_CONFIG.zoom);
    setMapPitch(0);
    setMapBearing(0);

    // anime la carte si prête
    try {
      mapInstance?.easeTo({
        center: [lng, lat],
        zoom: MAPBOX_CONFIG.zoom,
        pitch: 0,
        bearing: 0,
        duration: 600,
        essential: true,
      });
    } catch {}
  }, [mapInstance, setCoordinates, setMapZoom, setMapPitch, setMapBearing]);

  // Effacer TOUS les filtres (et nettoyer l'URL) + recentrer la carte
  const resetAllFilters = useCallback(() => {
    resetFilters();
    const cleared = Object.fromEntries(
      filterSections.map(({ key }) => [key, []])
    );
    cleared.mapType = [];
    syncUrl(cleared);
    recenterEurope();
  }, [resetFilters, syncUrl, recenterEurope]);

  // Réinitialiser uniquement mapType (et nettoyer l'URL)
  const resetMapFilters = useCallback(() => {
    const next = { ...filters, mapType: [] };
    setFilters({ mapType: [] });
    syncUrl(next);
  }, [filters, setFilters, syncUrl]);

  /* --- Mobile modal --- */
  if (isMobile && isMobileModalOpen) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
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
                resetFilters();
                const cleared = Object.fromEntries(
                  filterSections.map(({ key }) => [key, []])
                );
                cleared.mapType = [];
                syncUrl(cleared);
                recenterEurope();
                setIsMobileModalOpen(false);
              }}
              className="font-medium text-emerald-600"
            >
              Effacer
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {filterSections.map(({ title, key, items }) => (
            <div key={key} className="border-b pb-6 last:border-0">
              <h3 className="mb-4 text-lg font-semibold">{title}</h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const checked = (filters[key] || []).includes(item);
                  return (
                    <SimpleCheckbox
                      key={`m-${key}-${item}`}
                      checked={checked}
                      onChange={() => handleFilterChange(key, item)}
                      label={item}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-b pb-6">
            <h3 className="mb-4 text-lg font-semibold">Type d’agriculture</h3>
            <div className="space-y-3">
              {mapFilterTypes.map((t) => {
                const checked = (filters.mapType || []).includes(t.id);
                return (
                  <SimpleCheckbox
                    key={`m-map-${t.id}`}
                    checked={checked}
                    onChange={() => handleFilterChange("mapType", t.id)}
                    label={t.label}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-white p-4">
          <button
            onClick={() => setIsMobileModalOpen(false)}
            className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700"
          >
            Appliquer les filtres ({activeFilterCount})
          </button>
        </div>
      </div>
    );
  }

  /* --- Desktop --- */
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-3">
          <div className="no-scrollbar flex h-14 items-center gap-2 overflow-x-auto overflow-y-visible py-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            {filterSections.map(({ title, key, items }) => (
              <DropdownPill
                key={key}
                label={title}
                values={filters[key]}
                onClear={() => clearSection(key)}
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{title}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map((item) => {
                      const checked = (filters[key] || []).includes(item);
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
                  {filters[key]?.length > 0 && (
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
            ))}

            <DropdownPill
              label="Type d’agriculture"
              values={filters.mapType}
              onClear={() => resetMapFilters()}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Type d’agriculture
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {mapFilterTypes.map((t) => {
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
                {filters.mapType?.length > 0 && (
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

            {/* Bouton Filtres (ouvre la modale) */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm hover:bg-gray-50"
              aria-label="Ouvrir la fenêtre des filtres"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M3 4h18l-7 8v5l-4 2v-7L3 4z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modale globale */}
      <FiltersModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {activeFilterCount > 0 && (
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-3 py-2">
          <span className="text-sm text-gray-500">Filtres actifs :</span>
          {Object.entries(filters).flatMap(([key, values]) =>
            (values || []).map((value) => (
              <span
                key={`${key}-${value}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
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
