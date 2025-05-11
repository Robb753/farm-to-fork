// app/utils/googleMapsLoader.js

/**
 * Utilitaire pour charger l'API Google Maps de façon fiable
 */
export class GoogleMapsLoader {
  // 💡 Lecture dynamique de la clé API pour éviter l'évaluation à build time
  static get apiKey() {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  static isLoading = false;
  static isLoaded = false;
  static callbacks = [];
  static loadError = null;

  /**
   * Charge l'API Google Maps et renvoie une promesse
   */
  static load() {
    return new Promise((resolve, reject) => {
      if (GoogleMapsLoader.isLoaded && window.google && window.google.maps) {
        return resolve(window.google.maps);
      }

      if (GoogleMapsLoader.isLoading) {
        GoogleMapsLoader.callbacks.push({ resolve, reject });
        return;
      }

      if (GoogleMapsLoader.loadError) {
        return reject(GoogleMapsLoader.loadError);
      }

      GoogleMapsLoader.isLoading = true;
      GoogleMapsLoader.callbacks.push({ resolve, reject });

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GoogleMapsLoader.apiKey}&libraries=places&callback=initGoogleMaps`;

      window.initGoogleMaps = () => {
        GoogleMapsLoader.isLoaded = true;
        GoogleMapsLoader.isLoading = false;

        GoogleMapsLoader.callbacks.forEach((cb) =>
          cb.resolve(window.google.maps)
        );
        GoogleMapsLoader.callbacks = [];
      };

      script.onerror = (error) => {
        GoogleMapsLoader.loadError = error;
        GoogleMapsLoader.isLoading = false;

        GoogleMapsLoader.callbacks.forEach((cb) => cb.reject(error));
        GoogleMapsLoader.callbacks = [];

        console.error("Erreur lors du chargement de l'API Google Maps:", error);
      };

      document.head.appendChild(script);
    });
  }

  static checkLoaded() {
    return GoogleMapsLoader.isLoaded && window.google && window.google.maps;
  }
}
