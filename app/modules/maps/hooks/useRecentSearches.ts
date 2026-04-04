"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "farm2fork_recent_searches";
const MAX_ENTRIES = 6;

export interface RecentSearch {
  city: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentSearch[];
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      }
    } catch {
      // Ignore parse errors or missing localStorage (SSR, private browsing)
    }
  }, []);

  const addRecentSearch = useCallback((entry: RecentSearch) => {
    setRecentSearches((prev) => {
      // Deduplicate by city name (case-insensitive)
      const deduped = prev.filter(
        (r) => r.city.toLowerCase() !== entry.city.toLowerCase()
      );
      // Most recent first, capped at MAX_ENTRIES
      const next = [entry, ...deduped].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  return { recentSearches, addRecentSearch };
}
