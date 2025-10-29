"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@/utils/icons";
import {
  filterSections,
  useFiltersState,
  useFiltersActions,
} from "@/lib/store/mapListingsStore";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/* Construit un objet vide de filtres selon la forme du store */
const makeEmptyFilters = () => {
  const base = Object.fromEntries(filterSections.map(({ key }) => [key, []]));
  return { ...base, mapType: [] };
};

/* Construit une query string à partir des filtres (préserve lat/lng/zoom) */
const buildUrlSearch = (sp, filters) => {
  const qs = new URLSearchParams();

  // ✅ Préserver les paramètres carte
  ["lat", "lng", "zoom"].forEach((k) => {
    const v = sp.get(k);
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

export default function FiltersModal({ open = false, onClose }) {
  const storeFilters = useFiltersState();
  const { setFilters, resetFilters } = useFiltersActions();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // On édite une copie locale, puis on applique via “Voir les résultats”
  const [draft, setDraft] = useState(storeFilters);

  useEffect(() => {
    if (open) setDraft(storeFilters);
  }, [open, storeFilters]);

  // Bloque le scroll derrière la modale quand open = true
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  // Fermer avec Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const activeCount = useMemo(() => {
    return Object.values(draft).reduce(
      (acc, v) => acc + (Array.isArray(v) ? v.length : 0),
      0
    );
  }, [draft]);

  const toggleDraft = (key, value) => {
    setDraft((d) => {
      const arr = Array.isArray(d[key]) ? d[key] : [];
      const exists = arr.includes(value);
      const next = exists ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...d, [key]: next };
    });
  };

  const clearSection = (key) => {
    setDraft((d) => ({
      ...d,
      [key]: [],
    }));
  };

  const apply = () => {
    // 1) MAJ store
    setFilters(draft);
    // 2) MAJ URL (lat/lng/zoom conservés)
    const query = buildUrlSearch(searchParams, draft);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    onClose?.();
  };

  const clearAll = () => {
    const cleared = makeEmptyFilters();
    // 1) MAJ store + local draft
    resetFilters();
    setDraft(cleared);
    // 2) Nettoyer l’URL tout en gardant lat/lng/zoom
    const query = buildUrlSearch(searchParams, cleared);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    onClose?.();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        aria-label="Fermer les filtres"
        onClick={onClose}
      />

      {/* Container principal */}
      <div
        className="
        relative w-[min(820px,92vw)] max-h-[calc(100vh-8rem)] mt-[5rem]
        flex flex-col overflow-hidden rounded-3xl
        bg-gradient-to-b from-white to-gray-50
        shadow-2xl
        border border-gray-100
        animate-in fade-in slide-in-from-bottom-6
      "
      >
        {/* Header avec glass effect */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 border-b bg-white/70 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
            🧩 Filtres
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
            type="button"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {filterSections.map(({ title, key, items }) => (
            <section
              key={key}
              className="rounded-xl border border-gray-100 bg-white/70 backdrop-blur-sm p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">
                  {title}
                </h3>
                {!!draft[key]?.length && (
                  <button
                    onClick={() => clearSection(key)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    type="button"
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
                      className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border font-medium transition-all
                      ${
                        checked
                          ? "bg-emerald-100 border-emerald-300 text-emerald-900 shadow-sm"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                      }`}
                      aria-pressed={checked}
                    >
                      {checked && (
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                          ✓
                        </span>
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <button
            onClick={clearAll}
            className="text-sm text-gray-600 hover:text-gray-900 transition"
            type="button"
          >
            Tout effacer
          </button>

          <button
            onClick={apply}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm"
          >
            Voir les résultats
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-xs">
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
