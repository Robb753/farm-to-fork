// app/utils/googleMapsLoader.js

/**
 * Utilitaire pour charger l'API Google Maps de façon fiable
 */
export class GoogleMapsLoader {
  static apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  static isLoading = false;
  static isLoaded = false;
  static callbacks = [];
  static loadError = null;

  /**
   * Charge l'API Google Maps et renvoie une promesse
   */
  static load() {
    return new Promise((resolve, reject) => {
      // Si déjà chargé, retourner immédiatement
      if (GoogleMapsLoader.isLoaded && window.google && window.google.maps) {
        return resolve(window.google.maps);
      }

      // Si en cours de chargement, ajouter à la file d'attente
      if (GoogleMapsLoader.isLoading) {
        GoogleMapsLoader.callbacks.push({ resolve, reject });
        return;
      }

      // Si une erreur précédente, rejeter
      if (GoogleMapsLoader.loadError) {
        return reject(GoogleMapsLoader.loadError);
      }

      // Commencer le chargement
      GoogleMapsLoader.isLoading = true;
      GoogleMapsLoader.callbacks.push({ resolve, reject });

      // Créer un élément script pour charger l'API
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GoogleMapsLoader.apiKey}&libraries=places&callback=initGoogleMaps`;

      // Fonction de callback globale
      window.initGoogleMaps = () => {
        GoogleMapsLoader.isLoaded = true;
        GoogleMapsLoader.isLoading = false;

        // Résoudre toutes les promesses en attente
        GoogleMapsLoader.callbacks.forEach((callback) =>
          callback.resolve(window.google.maps)
        );
        GoogleMapsLoader.callbacks = [];
      };

      // Gestion des erreurs
      script.onerror = (error) => {
        GoogleMapsLoader.loadError = error;
        GoogleMapsLoader.isLoading = false;

        // Rejeter toutes les promesses en attente
        GoogleMapsLoader.callbacks.forEach((callback) =>
          callback.reject(error)
        );
        GoogleMapsLoader.callbacks = [];

        console.error("Erreur lors du chargement de l'API Google Maps:", error);
      };

      // Ajouter le script au document
      document.head.appendChild(script);
    });
  }

  /**
   * Vérifie si l'API est chargée
   */
  static checkLoaded() {
    return GoogleMapsLoader.isLoaded && window.google && window.google.maps;
  }
}
