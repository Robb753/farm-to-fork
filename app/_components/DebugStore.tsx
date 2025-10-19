// app/_components/DebugStore.tsx
"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/appStore";

export function DebugStore() {
  const state = useAppStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-mono text-xs"
      >
        🐛 Ouvrir Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs max-w-sm max-h-96 overflow-auto z-50 border-2 border-green-500 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-green-500">
        <h3 className="font-bold text-green-300">🐛 STORE DEBUG</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-red-400 hover:text-red-300 font-bold"
        >
          ✕
        </button>
      </div>

      {/* Map State */}
      <div className="mb-3 pb-2 border-b border-green-700">
        <div className="text-green-300 font-bold mb-1">📍 MAP:</div>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            {
              coordinates: state.map.coordinates,
              zoom: state.map.zoom,
              isApiLoaded: state.map.isApiLoaded,
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Listings State */}
      <div className="mb-3 pb-2 border-b border-green-700">
        <div className="text-green-300 font-bold mb-1">📋 LISTINGS:</div>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            {
              allCount: state.listings.all.length,
              visibleCount: state.listings.visible.length,
              selectedId: state.listings.selectedId,
              hoveredId: state.listings.hoveredId,
              isLoading: state.listings.isLoading,
              hasMore: state.listings.hasMore,
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Filters State */}
      <div className="mb-3 pb-2 border-b border-green-700">
        <div className="text-green-300 font-bold mb-1">🔍 FILTERS:</div>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(state.filters, null, 2)}
        </pre>
      </div>

      {/* User State */}
      <div className="mb-3 pb-2 border-b border-green-700">
        <div className="text-green-300 font-bold mb-1">👤 USER:</div>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            {
              role: state.user.profile?.role || "none",
              email: state.user.profile?.email || "none",
              favorites: state.user.profile?.favorites?.length || 0,
              isLoading: state.user.isLoading,
              error: state.user.error,
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="text-yellow-300 font-bold mb-2">⚡ ACTIONS TEST:</div>

        <button
          onClick={() => {
            state.setCoordinates({ lat: 48.8566, lng: 2.3522 });
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mb-1"
        >
          ✓ Set Coordinates (Paris)
        </button>

        <button
          onClick={() => {
            state.toggleFilter("product_type", "Fruits");
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mb-1"
        >
          ✓ Toggle Filter: Fruits
        </button>

        <button
          onClick={() => {
            state.setUserProfile({
              id: "test-user",
              email: "test@example.com",
              role: "user",
              favorites: [],
            });
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mb-1"
        >
          ✓ Set User Profile
        </button>

        <button
          onClick={() => {
            state.addFavorite(123);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mb-1"
        >
          ✓ Add Favorite (123)
        </button>

        <button
          onClick={() => {
            state.setListingsLoading(true);
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs mb-1"
        >
          ✓ Set Loading: true
        </button>

        <button
          onClick={() => {
            state.reset();
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-bold"
        >
          🔴 RESET ALL
        </button>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-green-700 text-green-500 text-xs">
        ✅ Store fonctionne correctement
      </div>
    </div>
  );
}
