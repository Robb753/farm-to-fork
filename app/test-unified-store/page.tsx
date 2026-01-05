"use client";

import { useEffect } from "react";
import {
  useUnifiedStore,
  useMapBounds,
  useMapCoordinates,
  useAllListings,
  useVisibleListings,
  useFilteredListings,
  useIsListingsLoading,
  useCurrentFilters,
  useHasActiveFilters,
  useIsMapExpanded,
  useMapActions,
  useListingsActions,
  useFiltersActions,
  useUIActions,
} from "@/lib/store/unifiedStore";

/**
 * Page de test pour valider le store unifié
 * Route: /test-unified-store
 *
 * Tests:
 * 1. Map actions (bounds, coordinates)
 * 2. Listings actions (fetch, filter)
 * 3. Filters actions (toggle, reset)
 * 4. UI actions (expand map)
 * 5. Synchronisation automatique
 */
export default function TestUnifiedStorePage() {
  // ═══ SELECTORS ═══
  const bounds = useMapBounds();
  const coordinates = useMapCoordinates();
  const allListings = useAllListings();
  const visibleListings = useVisibleListings();
  const filteredListings = useFilteredListings();
  const isLoading = useIsListingsLoading();
  const filters = useCurrentFilters();
  const hasActiveFilters = useHasActiveFilters();
  const isMapExpanded = useIsMapExpanded();

  // ═══ ACTIONS ═══
  const { setBounds, setCoordinates } = useMapActions();
  const { fetchListings, setAllListings } = useListingsActions();
  const { toggleFilter, resetFilters } = useFiltersActions();
  const { toggleMapExpanded } = useUIActions();

  // ═══ STATE COMPLET (pour debug) ═══
  const fullState = useUnifiedStore();

  // ═══ FETCH INITIAL ═══
  useEffect(() => {
    console.log("🚀 Test Unified Store - Chargement initial");

    // ✅ Charger des données MOCK au lieu de Supabase
    // (évite les erreurs de connexion)
    handleTestMockData();

    // Si tu veux tester avec de vraies données Supabase :
    // fetchListings();
  }, []);

  // ═══ TEST HANDLERS ═══

  const handleTestMapBounds = () => {
    console.log("🗺️ Test: Changement de bounds");
    const newBounds = {
      north: 49.0,
      south: 45.0,
      east: 3.0,
      west: 1.0,
    };
    setBounds(newBounds);
    console.log(
      "✅ Bounds mis à jour, applyFiltersAndBounds() appelé automatiquement"
    );
  };

  const handleTestCoordinates = () => {
    console.log("📍 Test: Changement de coordonnées");
    setCoordinates({ lat: 48.8566, lng: 2.3522 }); // Paris
    console.log("✅ Coordonnées mises à jour");
  };

  const handleTestFilter = () => {
    console.log("🔍 Test: Toggle filtre 'Légumes'");
    toggleFilter("product_type", "Légumes");
    console.log(
      "✅ Filtre toggleé, applyFiltersAndBounds() appelé automatiquement"
    );
  };

  const handleTestResetFilters = () => {
    console.log("🔄 Test: Reset filtres");
    resetFilters();
    console.log("✅ Filtres réinitialisés");
  };

  const handleTestFetchWithBounds = () => {
    console.log("🌍 Test: Fetch avec bounds géographiques");
    const franceBounds = {
      north: 51.1,
      south: 41.3,
      east: 9.6,
      west: -5.2,
    };
    setBounds(franceBounds);
    fetchListings({ bounds: franceBounds });
    console.log("✅ Fetch avec bounds lancé");
  };

  const handleTestMockData = () => {
    console.log("🎭 Test: Charger données mock");
    const mockListings = [
      {
        id: 1,
        name: "Ferme Bio du Soleil",
        address: "Paris, France",
        lat: 48.8566,
        lng: 2.3522,
        product_type: ["Légumes", "Fruits"],
        certifications: ["Bio", "Label AB"],
        active: true,
      },
      {
        id: 2,
        name: "Élevage des Montagnes",
        address: "Lyon, France",
        lat: 45.764,
        lng: 4.8357,
        product_type: ["Viande", "Œufs"],
        certifications: ["Label Rouge"],
        active: true,
      },
      {
        id: 3,
        name: "Maraîcher Local",
        address: "Marseille, France",
        lat: 43.2965,
        lng: 5.3698,
        product_type: ["Légumes"],
        certifications: ["Bio", "AOC"],
        active: true,
      },
      {
        id: 4,
        name: "Ferme Laitière Tradition",
        address: "Toulouse, France",
        lat: 43.6047,
        lng: 1.4442,
        product_type: ["Produits laitiers"],
        certifications: ["Bio"],
        active: true,
      },
      {
        id: 5,
        name: "Verger du Val",
        address: "Bordeaux, France",
        lat: 44.8378,
        lng: -0.5792,
        product_type: ["Fruits"],
        certifications: ["HVE"],
        active: true,
      },
      {
        id: 6,
        name: "Rucher des Abeilles",
        address: "Nice, France",
        lat: 43.7102,
        lng: 7.262,
        product_type: ["Produits transformés"],
        certifications: ["Bio"],
        active: true,
      },
    ];
    setAllListings(mockListings as any);
    console.log("✅ 6 fermes mock chargées");
  };

  const handleTestSynchronization = () => {
    console.log("🔄 Test: Synchronisation automatique");
    console.log("1️⃣ Ajout de bounds...");
    setBounds({
      north: 46.0,
      south: 43.0,
      east: 5.0,
      west: 4.0,
    });

    setTimeout(() => {
      console.log("2️⃣ Ajout de filtre 'Légumes'...");
      toggleFilter("product_type", "Légumes");

      setTimeout(() => {
        console.log("3️⃣ Vérification de la synchronisation");
        console.log("   - Bounds actifs:", !!bounds);
        console.log("   - Filtres actifs:", hasActiveFilters);
        console.log("   - Listings visibles:", visibleListings.length);
        console.log("✅ Test de synchronisation terminé");
      }, 500);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test du Store Unifié
          </h1>
          <p className="text-gray-600">
            Validation de l'architecture unifiée avant migration
          </p>
        </div>

        {/* Boutons de Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">⚡ Actions de Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={handleTestMapBounds}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🗺️ Test Bounds
            </button>

            <button
              onClick={handleTestCoordinates}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              📍 Test Coords
            </button>

            <button
              onClick={handleTestFilter}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              🔍 Toggle Filtre
            </button>

            <button
              onClick={handleTestResetFilters}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              🔄 Reset Filtres
            </button>

            <button
              onClick={handleTestFetchWithBounds}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              🌍 Fetch + Bounds
            </button>

            <button
              onClick={handleTestMockData}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
            >
              🎭 Charger Mock
            </button>

            <button
              onClick={handleTestSynchronization}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              🔄 Test Sync
            </button>

            <button
              onClick={toggleMapExpanded}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              📐 Toggle Map
            </button>
          </div>
        </div>

        {/* État du Store */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🗺️ Map State</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-mono">
                  {coordinates
                    ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                    : "null"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bounds:</span>
                <span className="font-mono">
                  {bounds ? "✅ Définis" : "❌ Non définis"}
                </span>
              </div>
              {bounds && (
                <div className="pl-4 mt-2 space-y-1 text-xs text-gray-500">
                  <div>
                    NE: {bounds.north.toFixed(2)}, {bounds.east.toFixed(2)}
                  </div>
                  <div>
                    SW: {bounds.south.toFixed(2)}, {bounds.west.toFixed(2)}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Zoom:</span>
                <span className="font-mono">{fullState.map.zoom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Loaded:</span>
                <span>{fullState.map.isApiLoaded ? "✅" : "❌"}</span>
              </div>
            </div>
          </div>

          {/* Listings State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Listings State</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">All Listings:</span>
                <span className="font-bold text-blue-600">
                  {allListings.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visible:</span>
                <span className="font-bold text-green-600">
                  {visibleListings.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filtered:</span>
                <span className="font-bold text-purple-600">
                  {filteredListings.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loading:</span>
                <span>{isLoading ? "⏳" : "✅"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has More:</span>
                <span>{fullState.listings.hasMore ? "✅" : "❌"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Page:</span>
                <span className="font-mono">{fullState.listings.page}</span>
              </div>
            </div>
          </div>

          {/* Filters State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🔍 Filters State</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Filters:</span>
                <span className="font-bold">
                  {hasActiveFilters ? "✅ Oui" : "❌ Non"}
                </span>
              </div>
              {Object.entries(filters).map(([key, values]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="font-mono text-xs">
                    {Array.isArray(values) && values.length > 0
                      ? values.join(", ")
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* UI State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🎨 UI State</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Map Expanded:</span>
                <span
                  className={`font-bold text-lg ${isMapExpanded ? "text-green-600" : "text-gray-400"}`}
                >
                  {isMapExpanded ? "✅ Étendue" : "❌ Normale"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span>{fullState.ui.isMobile ? "📱" : "❌"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tablet:</span>
                <span>{fullState.ui.isTablet ? "📱" : "❌"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Desktop:</span>
                <span>{fullState.ui.isDesktop ? "💻" : "❌"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filters Modal:</span>
                <span>{fullState.ui.isFiltersModalOpen ? "✅" : "❌"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Preview */}
        {visibleListings.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">
              📍 Aperçu des Listings Visibles ({visibleListings.length})
            </h3>
            <div className="space-y-3">
              {visibleListings.slice(0, 5).map((listing) => (
                <div
                  key={listing.id}
                  className="border border-gray-200 rounded p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {listing.name}
                      </h4>
                      <p className="text-sm text-gray-600">{listing.address}</p>
                      <div className="flex gap-2 mt-2">
                        {listing.product_type?.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      {listing.lat.toFixed(3)}, {listing.lng.toFixed(3)}
                    </div>
                  </div>
                </div>
              ))}
              {visibleListings.length > 5 && (
                <p className="text-center text-gray-500 text-sm">
                  ... et {visibleListings.length - 5} autres
                </p>
              )}
            </div>
          </div>
        )}

        {/* Console Logs */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 text-white">
            📟 Console Logs
          </h3>
          <p className="text-gray-400 text-sm">
            Ouvre la console du navigateur (F12) pour voir les logs détaillés
          </p>
        </div>

        {/* Validation Checklist */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">
            ✅ Checklist de Validation
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">
                Les bounds se mettent à jour sans events custom
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">
                Les filtres triggent applyFiltersAndBounds() automatiquement
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">
                Les listings visibles se synchronisent avec bounds + filters
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">
                Pas de console errors dans la console
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">
                Le localStorage persiste (farm2fork-unified)
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🧪 Page de test - Store Unifié v2.0</p>
          <p className="mt-2">
            Une fois validé, migrer les composants existants selon{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              MIGRATION_UNIFIED_STORE.md
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
