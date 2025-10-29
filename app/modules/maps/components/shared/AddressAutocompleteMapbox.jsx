"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";

/**
 * Autocomplétion d'adresse via Mapbox Geocoding API
 *
 * Props:
 *  - value: string (valeur affichée)
 *  - onChange(text: string): maj champ texte
 *  - onSelect(payload): quand une adresse est choisie
 *      payload = {
 *        place_name, label,
 *        lng, lat,
 *        address: { line1, city, postcode, region, country },
 *        bbox?: [minX, minY, maxX, maxY]
 *      }
 *  - placeholder?: string
 *  - country?: "FR" | "FR,BE" … (par défaut "FR")
 */
export default function AddressAutocompleteMapbox({
  value,
  onChange,
  onSelect,
  placeholder = "Saisir une adresse...",
  country = "FR",
}) {
  const [query, setQuery] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const abortRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Sync externe → interne
  useEffect(() => setQuery(value || ""), [value]);

  const search = useCallback(
    async (text) => {
      const q = text.trim();
      if (!q || q.length < 3) {
        setItems([]);
        setOpen(false);
        return;
      }
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const url =
          "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
          encodeURIComponent(q) +
          ".json?" +
          new URLSearchParams({
            access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
            country,
            language: "fr",
            limit: "8",
            types: "address,place,locality,neighborhood,postcode",
            autocomplete: "true",
          });

        const res = await fetch(url, { signal: abortRef.current.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        const mapped = (data.features || []).map((f) => {
          // Extraire composants d'adresse
          const ctx = f.context || [];
          const getCtx = (idPart) =>
            ctx.find((c) => (c.id || "").includes(idPart))?.text;
          const city =
            getCtx("place") || getCtx("locality") || getCtx("district") || "";
          const postcode = getCtx("postcode") || "";
          const region = getCtx("region") || "";
          const countryText = getCtx("country") || "";
          const line1 = f.address
            ? `${f.address} ${f.text}` // numéro + voie
            : f.place_type?.includes("place")
              ? f.text
              : f.place_name;

          return {
            id: f.id,
            place_name: f.place_name,
            label: f.place_name,
            center: f.center, // [lng, lat]
            bbox: f.bbox,
            address: {
              line1,
              city,
              postcode,
              region,
              country: countryText,
            },
          };
        });

        setItems(mapped);
        setOpen(mapped.length > 0);
        setCursor(-1);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Mapbox geocoding error:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [country]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleSelect = (item) => {
    const [lng, lat] = item.center || [];
    onSelect?.({
      place_name: item.place_name,
      label: item.label,
      lng,
      lat,
      bbox: item.bbox,
      address: item.address,
    });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" && query.trim().length >= 3) {
        e.preventDefault();
        search(query);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((p) => (p < items.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((p) => (p > 0 ? p - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cursor >= 0) handleSelect(items[cursor]);
      else if (items[0]) handleSelect(items[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const outside = (e) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
        <MapPin className="h-4 w-4 text-green-600 mr-2" />
        <input
          ref={inputRef}
          className="flex-1 outline-none bg-transparent text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : query ? (
          <button
            className="ml-2 p-1 rounded hover:bg-gray-100"
            onClick={() => {
              setQuery("");
              onChange?.("");
              setItems([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Effacer"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        ) : null}
      </div>

      {open && items.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg max-h-72 overflow-y-auto"
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setCursor(i)}
              className={`w-full text-left px-3 py-2 border-b last:border-none hover:bg-gray-50 ${
                i === cursor ? "bg-green-50" : ""
              }`}
            >
              <div className="font-medium text-gray-900 truncate">
                {item.address?.line1 || item.place_name}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {item.place_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
