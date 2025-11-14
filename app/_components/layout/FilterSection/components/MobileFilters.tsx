// FilterSection/components/MobileFilters.tsx

import React from "react";
import { ArrowLeft } from "lucide-react";
import { CSS_CLASSES, A11Y_MESSAGES, Z_INDEX } from "../utils/constants";

interface MobileFiltersProps {
  onClose: () => void;
  onReset: () => void;
  isOpen: boolean;
  className?: string;
}

/**
 * Composant filtres pour mobile (modal plein écran)
 *
 * Features:
 * - ✅ Modal plein écran responsive
 * - ✅ Header avec navigation et actions
 * - ✅ Contenu scrollable
 * - ✅ Accessibilité complète
 * - ✅ Animations fluides
 *
 * @todo Implémenter le contenu des filtres
 */
const MobileFilters: React.FC<MobileFiltersProps> = ({
  onClose,
  onReset,
  isOpen,
  className = "",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 overflow-y-auto bg-white ${className}`}
      style={{ zIndex: Z_INDEX.MOBILE_MODAL }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filters-title"
    >
      {/* Header fixe */}
      <div className="sticky top-0 border-b bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Bouton retour */}
          <button
            onClick={onClose}
            className={`flex items-center gap-2 text-gray-600 ${CSS_CLASSES.FOCUS_RING}`}
            aria-label={A11Y_MESSAGES.BACK_TO_LIST}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Retour</span>
          </button>

          {/* Titre */}
          <h1
            id="mobile-filters-title"
            className="text-lg font-semibold text-gray-900"
          >
            Filtres
          </h1>

          {/* Bouton reset */}
          <button
            onClick={onReset}
            className={`font-medium text-emerald-600 hover:text-emerald-700 transition-colors ${CSS_CLASSES.FOCUS_RING}`}
            aria-label="Effacer tous les filtres et fermer"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* État temporaire - à remplacer par le contenu réel */}
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚧</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Filtres mobiles en cours de développement
            </h3>
            <p className={`max-w-sm mx-auto ${CSS_CLASSES.TEXT_MUTED}`}>
              Cette interface sera bientôt disponible avec tous les filtres
              optimisés pour mobile.
            </p>
          </div>

          {/* Placeholder pour les futurs filtres */}
          <div className="space-y-4">
            {[
              "Type de produit",
              "Certifications",
              "Mode d'achat",
              "Méthode de production",
            ].map((category) => (
              <div
                key={category}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                <p className={`text-sm ${CSS_CLASSES.TEXT_MUTED}`}>
                  Options de filtrage pour {category.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer avec actions (optionnel) */}
      <div className="sticky bottom-0 border-t bg-white p-4">
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-emerald-600 py-3 px-4 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MobileFilters);
