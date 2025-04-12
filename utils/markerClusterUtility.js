// utils/markerClusterUtility.js
/**
 * Utilitaire pour gérer le clustering des marqueurs sur la carte
 * Permet d'améliorer les performances avec un grand nombre de marqueurs
 */

/**
 * Regroupe les marqueurs qui sont trop proches les uns des autres
 * @param {Array} markers - Liste des marqueurs/listings avec coordonnées {lat, lng}
 * @param {number} pixelDistance - Distance en pixels pour regrouper les marqueurs (défaut: 60)
 * @param {GoogleMap} map - Instance de la carte Google Maps
 * @returns {Array} Markers regroupés avec propriété 'cluster' le cas échéant
 */
export const clusterMarkers = (markers, map, pixelDistance = 60) => {
  if (!markers || !map || !markers.length) return [];
  
  // Convertir lat/lng en position de pixel sur la carte pour chaque marqueur
  const projection = map.getProjection();
  if (!projection) return markers;
  
  const zoom = map.getZoom();
  const bounds = map.getBounds();
  if (!bounds) return markers;
  
  // Ignorer le clustering si le zoom est élevé (vue rapprochée)
  if (zoom >= 15) return markers.map(marker => ({...marker, cluster: null}));
  
  // Convertir lat/lng en pixels
  const pixelPositions = markers.map(marker => {
    const latLng = new google.maps.LatLng(
      marker.lat,
      marker.lng
    );
    const worldPoint = projection.fromLatLngToPoint(latLng);
    return {
      id: marker.id,
      pixel: {
        x: Math.floor(worldPoint.x * Math.pow(2, zoom)),
        y: Math.floor(worldPoint.y * Math.pow(2, zoom))
      },
      marker
    };
  });
  
  // Trouver les clusters
  const clusters = [];
  const processed = new Set();
  
  pixelPositions.forEach(point => {
    if (processed.has(point.id)) return;
    
    const cluster = {
      center: point.pixel,
      count: 1,
      markers: [point.marker],
      ids: [point.id]
    };
    
    processed.add(point.id);
    
    // Trouver les points voisins pour ce cluster
    pixelPositions.forEach(otherPoint => {
      if (processed.has(otherPoint.id)) return;
      
      const distance = Math.sqrt(
        Math.pow(point.pixel.x - otherPoint.pixel.x, 2) + 
        Math.pow(point.pixel.y - otherPoint.pixel.y, 2)
      );
      
      if (distance <= pixelDistance) {
        cluster.count++;
        cluster.markers.push(otherPoint.marker);
        cluster.ids.push(otherPoint.id);
        processed.add(otherPoint.id);
        
        // Recalculer le centre du cluster
        cluster.center = {
          x: Math.floor((cluster.center.x * (cluster.count - 1) + otherPoint.pixel.x) / cluster.count),
          y: Math.floor((cluster.center.y * (cluster.count - 1) + otherPoint.pixel.y) / cluster.count)
        };
      }
    });
    
    clusters.push(cluster);
  });
  
  // Convertir les clusters en points LatLng et préparer le résultat
  const result = [];
  
  clusters.forEach(cluster => {
    if (cluster.count === 1) {
      // Pas de cluster pour un marqueur unique
      result.push({
        ...cluster.markers[0],
        cluster: null
      });
    } else {
      // Convertir le centre du cluster de pixels en LatLng
      const pointCluster = new google.maps.Point(
        cluster.center.x / Math.pow(2, zoom),
        cluster.center.y / Math.pow(2, zoom)
      );
      
      const latLngCluster = projection.fromPointToLatLng(pointCluster);
      
      // Ajouter un marqueur de cluster et les marqueurs individuels
      const clusterInfo = {
        position: {
          lat: latLngCluster.lat(),
          lng: latLngCluster.lng()
        },
        count: cluster.count,
        items: cluster.markers,
        ids: cluster.ids
      };
      
      // Ajouter le marqueur de cluster
      result.push({
        id: `cluster-${cluster.ids.join('-')}`,
        isCluster: true,
        cluster: clusterInfo,
        position: clusterInfo.position,
        // Conserver les coordonnées pour la compatibilité
        coordinates: {
          lat: clusterInfo.position.lat,
          lng: clusterInfo.position.lng
        },
        // Pour compatibilité avec le reste du code
        lat: clusterInfo.position.lat,
        lng: clusterInfo.position.lng
      });
      
      // Ajouter les marqueurs individuels avec leur info de cluster
      cluster.markers.forEach(marker => {
        result.push({
          ...marker,
          cluster: clusterInfo,
          isClusterMember: true
        });
      });
    }
  });
  
  return result;
};

/**
 * Crée un élément de marqueur de cluster
 * @param {Object} cluster - Information du cluster
 * @returns {HTMLElement} Élément DOM pour le marqueur de cluster
 */
export const createClusterMarkerElement = (cluster) => {
  const element = document.createElement('div');
  element.className = 'marker-cluster';
  element.innerHTML = `
    <div class="flex items-center justify-center bg-green-600 text-white rounded-full w-10 h-10 shadow-lg">
      <span class="text-sm font-semibold">${cluster.count}</span>
    </div>
  `;
  
  return element;
};

/**
 * Trouve les listings visibles dans les limites de la carte
 * @param {Array} listings - Tous les listings
 * @param {LatLngBounds} bounds - Limites actuelles de la carte
 * @returns {Array} Listings visibles dans les limites
 */
export const getListingsInBounds = (listings, bounds) => {
  if (!listings || !bounds) return [];
  
  return listings.filter(listing => {
    const lat = listing.coordinates?.lat || listing.lat;
    const lng = listing.coordinates?.lng || listing.lng;
    
    if (!lat || !lng) return false;
    
    const position = new google.maps.LatLng(lat, lng);
    return bounds.contains(position);
  });
};

/**
 * Calcule la distance entre deux points en kilomètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
};

/**
 * Trie les listings par distance par rapport à un point central
 */
export const sortListingsByDistance = (listings, centerLat, centerLng) => {
  return [...listings].sort((a, b) => {
    const aLat = a.coordinates?.lat || a.lat;
    const aLng = a.coordinates?.lng || a.lng;
    const bLat = b.coordinates?.lat || b.lat;
    const bLng = b.coordinates?.lng || b.lng;
    
    if (!aLat || !aLng) return 1;
    if (!bLat || !bLng) return -1;
    
    const distA = calculateDistance(centerLat, centerLng, aLat, aLng);
    const distB = calculateDistance(centerLat, centerLng, bLat, bLng);
    
    return distA - distB;
  });
};