"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { X } from "@/utils/icons";
import {
  filterSections,
  useFiltersState,
  useFiltersActions,
} from "@/lib/store/mapboxListingsStore";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/* build an empty filter object that matches the store shape */
const makeEmptyFilters = () => {
  const base = Object.fromEntries(filterSections.map(({ key }) => [key, []]));
  return { ...base, mapType: [] };
};

/* build a query string from filters (preserve lat/lng) */
const buildUrlSearch = (sp, filters) => {
  const qs = new URLSearchParams();
  const lat = sp.get("lat");
  const lng = sp.get("lng");
  if (lat) qs.set("lat", lat);
  if (lng) qs.set("lng", lng);

  Object.entries(filters || {}).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      qs.set(key, values.join(","));
    }
  });
  return qs.toString();
};

export default function FiltersModal({ open, onClose }) {
  const storeFilters = useFiltersState();
  const { setFilters, resetFilters } = useFiltersActions();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // on édite une copie locale, puis on applique “Voir les résultats”
  const [draft, setDraft] = useState(storeFilters);

  useEffect(() => {
    if (open) setDraft(storeFilters);
  }, [open, storeFilters]);

  // lock scroll page derrière la modale
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  const activeCount = useMemo(
    () =>
      Object.values(draft).reduce(
        (acc, v) => acc + (Array.isArray(v) ? v.length : 0),
        0
      ),
    [draft]
  );

  const toggleDraft = (key, value) => {
    setDraft((d) => {
      const arr = Array.isArray(d[key]) ? d[key] : [];
      const exists = arr.includes(value);
      const next = exists ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...d, [key]: next };
    });
  };

  const clearSection = (key) =>
    setDraft((d) => ({
      ...d,
      [key]: [],
    }));

  const apply = () => {
    // 1) MAJ store
    setFilters(draft);
    // 2) MAJ URL (lat/lng conservés)
    const query = buildUrlSearch(searchParams, draft);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    onClose?.();
  };

  const clearAll = () => {
    const cleared = makeEmptyFilters();
    // 1) MAJ store
    resetFilters();
    setDraft(cleared);
    // 2) Nettoyer l’URL
    const query = buildUrlSearch(searchParams, cleared);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    onClose?.();
  };

  if (!open || typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Container */}
      <div
        className="
          relative w-[min(920px,92vw)] rounded-2xl bg-white shadow-2xl
          outline-none
          max-h-[calc(100vh-4rem)]
          flex flex-col
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-3 bg-white/95 backdrop-blur">
          <h2 className="text-lg font-semibold">Filtres</h2>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-8">
            {filterSections.map(({ title, key, items }) => (
              <section key={key} className="border-b pb-6 last:border-0">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">{title}</h3>
                  {!!draft[key]?.length && (
                    <button
                      onClick={() => clearSection(key)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {items.map((item) => {
                    const checked = (draft[key] || []).includes(item);
                    return (
                      <button
                        key={`${key}-${item}`}
                        type="button"
                        onClick={() => toggleDraft(key, item)}
                        className={`px-3 py-2 rounded-full text-sm border transition
                          ${
                            checked
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        aria-pressed={checked}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t bg-white px-5 py-3 flex items-center justify-between">
          <button
            onClick={clearAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Tout effacer
          </button>
          <button
            onClick={apply}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Voir les résultats
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
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
