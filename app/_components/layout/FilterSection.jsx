"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Check,
  ArrowLeft,
} from "@/utils/icons";
import {
  useFiltersState,
  useFiltersActions,
} from "@/lib/store/mapboxListingsStore";
import { useSearchParams } from "next/navigation";
import { useUpdateExploreUrl } from "@/utils/updateExploreUrl";

/* -------- open on mobile from elsewhere -------- */
export const openMobileFilters = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMobileFilters"));
  }
};

/* -------- filter sections -------- */
export const filterSections = [
  {
    title: "Produits",
    key: "product_type",
    items: [
      "Fruits",
      "Légumes",
      "Produits laitiers",
      "Viande",
      "Œufs",
      "Produits transformés",
    ],
  },
  {
    title: "Certifications",
    key: "certifications",
    items: ["Label AB", "Label Rouge", "AOP/AOC", "HVE", "Demeter"],
  },
  {
    title: "Distribution",
    key: "purchase_mode",
    items: [
      "Vente directe à la ferme",
      "Marché local",
      "Livraison à domicile",
      "Drive fermier",
    ],
  },
  {
    title: "Production",
    key: "production_method",
    items: [
      "Agriculture conventionnelle",
      "Agriculture biologique",
      "Agriculture durable",
      "Agriculture raisonnée",
    ],
  },
  {
    title: "Services",
    key: "additional_services",
    items: [
      "Visite de la ferme",
      "Ateliers de cuisine",
      "Hébergement",
      "Activités pour enfants",
      "Réservation pour événements",
    ],
  },
  {
    title: "Disponibilité",
    key: "availability",
    items: [
      "Saisonnière",
      "Toute l'année",
      "Pré-commande",
      "Sur abonnement",
      "Événements spéciaux",
    ],
  },
];

const mapFilterTypes = [
  { id: "conventional", label: "Agriculture conventionnelle" },
  { id: "organic", label: "Agriculture biologique" },
  { id: "sustainable", label: "Agriculture durable" },
  { id: "reasoned", label: "Agriculture raisonnée" },
];

/* -------- small UI bits -------- */
const SimpleCheckbox = ({ checked, onChange, id, label }) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <span
      onClick={onChange}
      className={`flex h-4 w-4 items-center justify-center rounded border text-white transition ${
        checked
          ? "border-emerald-600 bg-emerald-600"
          : "border-gray-300 bg-white"
      }`}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && <Check className="h-3 w-3" />}
    </span>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
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

/* ===== helpers ===== */
function useOnClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

const PillButton = ({ active, label, onClick, count, onClear, rightIcon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition ${
      active
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
    }`}
  >
    <span>{label}</span>
    {count ? (
      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/80 px-1.5 text-xs">
        {count}
      </span>
    ) : null}
    {active && onClear ? (
      <span
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/60"
        aria-label={`Effacer ${label}`}
      >
        <X className="h-4 w-4" />
      </span>
    ) : (
      (rightIcon ?? <ChevronDown className="h-4 w-4" />)
    )}
  </button>
);

const DropdownPill = ({ label, values, children, onClear }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const count = Array.isArray(values) ? values.length : 0;
  const active = count > 0;

  return (
    <div className="relative" ref={ref}>
      <PillButton
        label={label}
        active={active}
        count={count || undefined}
        onClick={() => setOpen((o) => !o)}
        onClear={active ? onClear : undefined}
      />
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[320px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          {children}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Component ---------- */
const FilterSection = () => {
  // IMPORTANT : useFiltersState() renvoie l’objet "filters" (après correction du store)
  const filters = useFiltersState();
  const { toggleFilter, resetFilters, setFilters } = useFiltersActions();

  const searchParams = useSearchParams();
  const updateExploreUrl = useUpdateExploreUrl();

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* 1) hydrate from URL once */
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

  /* 2) sync URL (debounced), keep lat/lng */
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

  /* 3) responsive + openMobileFilters event */
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

  /* 4) lock scroll when mobile modal open */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.removeProperty("overflow");
  }, [isMobileModalOpen]);

  /* helpers */
  const handleFilterChange = useCallback(
    (key, value) => toggleFilter(key, value),
    [toggleFilter]
  );

  const clearSection = useCallback(
    (key) => {
      const current = filters[key];
      if (Array.isArray(current)) current.forEach((v) => toggleFilter(key, v));
    },
    [filters, toggleFilter]
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      ),
    [filters]
  );

  const resetAllFilters = useCallback(() => resetFilters(), [resetFilters]);

  const resetMapFilters = useCallback(() => {
    (filters.mapType || []).forEach((id) => handleFilterChange("mapType", id));
  }, [filters, handleFilterChange]);

  /* ---------- Mobile modal ---------- */
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
                      id={`m-${key}-${item}`}
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
                    id={`m-map-${t.id}`}
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

  /* ---------- Desktop pills bar ---------- */
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-3">
          <div className="no-scrollbar flex h-14 items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none]">
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
                          id={`${key}-${item}`}
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
                        id={`map-${t.id}`}
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

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm hover:bg-gray-50"
              onClick={() => openMobileFilters()}
            >
              <Filter className="h-4 w-4" />
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
