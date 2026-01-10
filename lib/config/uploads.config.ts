// lib/config/uploads.config.ts
// Configuration pour les uploads de fichiers

// ==================== LIMITES DE TAILLE ====================

/**
 * Limites de taille pour les fichiers uploadés
 */
export const FILE_SIZE_LIMITS = {
  /**
   * Taille maximale par fichier (5MB)
   */
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

  /**
   * Taille maximale totale pour tous les fichiers (15MB)
   */
  MAX_TOTAL_SIZE: 15 * 1024 * 1024, // 15MB

  /**
   * Taille maximale pour un avatar (2MB)
   */
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB

  /**
   * Taille maximale pour un document PDF (10MB)
   */
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Limites en format lisible (pour affichage)
 */
export const FILE_SIZE_LIMITS_READABLE = {
  MAX_FILE_SIZE: "5 MB",
  MAX_TOTAL_SIZE: "15 MB",
  MAX_AVATAR_SIZE: "2 MB",
  MAX_DOCUMENT_SIZE: "10 MB",
} as const;

// ==================== TYPES DE FICHIERS ACCEPTÉS ====================

/**
 * Types MIME acceptés pour les images
 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/**
 * Extensions d'images acceptées (pour affichage)
 */
export const ACCEPTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
] as const;

/**
 * Types MIME acceptés pour les documents
 */
export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AcceptedDocumentType = (typeof ACCEPTED_DOCUMENT_TYPES)[number];

/**
 * Extensions de documents acceptées (pour affichage)
 */
export const ACCEPTED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

// ==================== LIMITES DE QUANTITÉ ====================

/**
 * Nombre maximum de fichiers uploadables
 */
export const FILE_COUNT_LIMITS = {
  /**
   * Nombre maximum d'images par listing
   */
  MAX_IMAGES_PER_LISTING: 10,

  /**
   * Nombre minimum d'images requis pour un listing
   */
  MIN_IMAGES_PER_LISTING: 1,

  /**
   * Nombre maximum de documents par demande producteur
   */
  MAX_DOCUMENTS_PER_REQUEST: 5,
} as const;

// ==================== CONFIGURATION DE COMPRESSION ====================

/**
 * Configuration pour la compression d'images
 */
export const IMAGE_COMPRESSION_CONFIG = {
  /**
   * Qualité de compression JPEG (0-100)
   */
  quality: 85,

  /**
   * Largeur maximale en pixels
   */
  maxWidth: 1920,

  /**
   * Hauteur maximale en pixels
   */
  maxHeight: 1080,

  /**
   * Convertir les images en WebP pour réduire la taille
   */
  convertToWebP: true,

  /**
   * Conserver les métadonnées EXIF
   */
  preserveExif: false,
} as const;

/**
 * Configuration pour les thumbnails
 */
export const THUMBNAIL_CONFIG = {
  /**
   * Largeur des thumbnails
   */
  width: 300,

  /**
   * Hauteur des thumbnails
   */
  height: 300,

  /**
   * Qualité des thumbnails
   */
  quality: 80,

  /**
   * Mode de redimensionnement
   */
  fit: "cover" as const, // cover | contain | fill
} as const;

// ==================== VALIDATION ====================

/**
 * Fonctions de validation des fichiers
 */
export const FILE_VALIDATORS = {
  /**
   * Vérifier si un fichier est une image valide
   */
  isValidImage: (file: File): boolean => {
    return ACCEPTED_IMAGE_TYPES.includes(file.type as AcceptedImageType);
  },

  /**
   * Vérifier si un fichier est un document valide
   */
  isValidDocument: (file: File): boolean => {
    return ACCEPTED_DOCUMENT_TYPES.includes(file.type as AcceptedDocumentType);
  },

  /**
   * Vérifier la taille d'un fichier
   */
  isValidSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  },

  /**
   * Vérifier la taille totale de plusieurs fichiers
   */
  isValidTotalSize: (files: File[], maxTotalSize: number): boolean => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize <= maxTotalSize;
  },

  /**
   * Vérifier le nombre de fichiers
   */
  isValidCount: (files: File[], maxCount: number): boolean => {
    return files.length <= maxCount;
  },
} as const;

// ==================== MESSAGES D'ERREUR ====================

/**
 * Messages d'erreur pour les uploads
 */
export const UPLOAD_ERROR_MESSAGES = {
  FILE_TOO_LARGE: `La taille d'un fichier ne doit pas dépasser ${FILE_SIZE_LIMITS_READABLE.MAX_FILE_SIZE}`,
  TOTAL_SIZE_TOO_LARGE: `La taille totale ne doit pas dépasser ${FILE_SIZE_LIMITS_READABLE.MAX_TOTAL_SIZE}`,
  INVALID_IMAGE_TYPE: `Formats acceptés: ${ACCEPTED_IMAGE_EXTENSIONS.join(", ")}`,
  INVALID_DOCUMENT_TYPE: `Formats acceptés: ${ACCEPTED_DOCUMENT_EXTENSIONS.join(", ")}`,
  TOO_MANY_FILES: `Vous ne pouvez pas uploader plus de ${FILE_COUNT_LIMITS.MAX_IMAGES_PER_LISTING} fichiers`,
  UPLOAD_FAILED: "Erreur lors de l'upload du fichier",
  COMPRESSION_FAILED: "Erreur lors de la compression de l'image",
  NETWORK_ERROR: "Erreur réseau, veuillez réessayer",
} as const;

// ==================== CHEMINS DE STOCKAGE ====================

/**
 * Templates de chemins pour le stockage des fichiers
 */
export const STORAGE_PATHS = {
  /**
   * Chemin pour les images de listing
   * Template: {userId}/{listingId}/{timestamp}_{filename}
   */
  listingImage: (userId: string, listingId: string, filename: string): string => {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${userId}/${listingId}/${timestamp}_${sanitizedFilename}`;
  },

  /**
   * Chemin pour les avatars
   * Template: {userId}/avatar_{timestamp}.{ext}
   */
  avatar: (userId: string, extension: string): string => {
    const timestamp = Date.now();
    return `${userId}/avatar_${timestamp}.${extension}`;
  },

  /**
   * Chemin pour les documents
   * Template: {userId}/documents/{timestamp}_{filename}
   */
  document: (userId: string, filename: string): string => {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${userId}/documents/${timestamp}_${sanitizedFilename}`;
  },
} as const;

// ==================== HELPERS ====================

/**
 * Fonctions utilitaires pour les uploads
 */
export const UPLOAD_HELPERS = {
  /**
   * Formater la taille d'un fichier en format lisible
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  },

  /**
   * Obtenir l'extension d'un fichier
   */
  getFileExtension: (filename: string): string => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  },

  /**
   * Générer un nom de fichier unique (cryptographically secure)
   */
  generateUniqueFilename: (originalFilename: string): string => {
    const timestamp = Date.now();

    // Use crypto.getRandomValues for cryptographically secure random generation
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes)
      .map((byte) => byte.toString(36))
      .join('')
      .substring(0, 6);

    const extension = UPLOAD_HELPERS.getFileExtension(originalFilename);
    const nameWithoutExt = originalFilename.replace(`.${extension}`, "");
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");

    return `${sanitized}_${timestamp}_${random}.${extension}`;
  },

  /**
   * Vérifier si un fichier est une image
   */
  isImage: (file: File): boolean => {
    return file.type.startsWith("image/");
  },

  /**
   * Créer une prévisualisation d'image
   */
  createImagePreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!UPLOAD_HELPERS.isImage(file)) {
        reject(new Error("Le fichier n'est pas une image"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },
} as const;

// ==================== EXPORT GROUPÉ ====================

/**
 * Configuration complète pour les uploads
 */
export const UPLOAD_CONFIG = {
  sizeLimits: FILE_SIZE_LIMITS,
  sizeLimitsReadable: FILE_SIZE_LIMITS_READABLE,
  acceptedImageTypes: ACCEPTED_IMAGE_TYPES,
  acceptedImageExtensions: ACCEPTED_IMAGE_EXTENSIONS,
  acceptedDocumentTypes: ACCEPTED_DOCUMENT_TYPES,
  acceptedDocumentExtensions: ACCEPTED_DOCUMENT_EXTENSIONS,
  countLimits: FILE_COUNT_LIMITS,
  compression: IMAGE_COMPRESSION_CONFIG,
  thumbnail: THUMBNAIL_CONFIG,
  validators: FILE_VALIDATORS,
  errorMessages: UPLOAD_ERROR_MESSAGES,
  storagePaths: STORAGE_PATHS,
  helpers: UPLOAD_HELPERS,
} as const;
