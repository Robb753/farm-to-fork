"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import Image from "next/image";
import { Trash2, Globe } from "@/utils/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour FileUpload
 */
interface FileInfo {
  name: string;
  size: string;
}

interface ImageItem {
  url: string;
}

interface FileUploadProps {
  /** Fonction callback pour transmettre les fichiers au parent */
  setImages: (files: File[]) => void;
  /** Liste des images existantes (optionnel) */
  imageList?: ImageItem[];
  /** Nombre maximum d'images autorisées */
  maxImages?: number;
  /** Taille maximale par fichier en Mo */
  maxFileSize?: number;
  /** Types de fichiers acceptés */
  acceptedTypes?: string[];
  /** Classe CSS personnalisée */
  className?: string;
  /** Afficher la barre de progression */
  showProgress?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  maxImages: 3,
  maxFileSize: 5, // Mo
  acceptedTypes: [
    "image/png",
    "image/gif",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ],
};

/**
 * Hook pour la gestion de l'état des fichiers
 * ✅ Ici maxImages est vraiment utilisé (plus de "unused")
 */
const useFileUpload = (
  setImages: (files: File[]) => void,
  maxImages: number
) => {
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const isUpdatingRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const notifyParent = useCallback(
    (files: File[]): void => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;
      requestAnimationFrame(() => {
        setImages(files);
        isUpdatingRef.current = false;
      });
    },
    [setImages]
  );

  const simulateProgress = useCallback((): void => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setUploadProgress(0);
    let progress = 0;

    progressIntervalRef.current = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 100);
  }, []);

  // ✅ Si maxImages diminue, on clamp proprement (et on notifie le parent)
  useEffect(() => {
    if (currentFiles.length <= maxImages) return;

    // revoke urls en trop
    const toRemove = imagePreview.slice(maxImages);
    toRemove.forEach((u) => URL.revokeObjectURL(u));

    const clampedFiles = currentFiles.slice(0, maxImages);
    setCurrentFiles(clampedFiles);
    setImagePreview((prev) => prev.slice(0, maxImages));
    setFileInfo((prev) => prev.slice(0, maxImages));
    notifyParent(clampedFiles);

    toast.info(
      `Limite modifiée : ${maxImages} image${maxImages > 1 ? "s" : ""} max`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxImages]); // notifyParent stable via useCallback, ok

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    imagePreview,
    setImagePreview,
    fileInfo,
    setFileInfo,
    uploadProgress,
    setUploadProgress,
    currentFiles,
    setCurrentFiles,
    notifyParent,
    simulateProgress,
  };
};

/**
 * Utilitaires de validation
 */
class FileValidator {
  static validateFiles(
    files: File[],
    currentCount: number,
    maxImages: number,
    maxFileSize: number,
    acceptedTypes: string[]
  ): ValidationResult {
    if (files.length + currentCount > maxImages) {
      return {
        isValid: false,
        error: `Vous pouvez importer un maximum de ${maxImages} images.`,
      };
    }

    const oversizedFiles = files.filter(
      (file) => file.size > maxFileSize * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      return {
        isValid: false,
        error: `Certaines images dépassent la taille maximale de ${maxFileSize} Mo.`,
      };
    }

    const invalidTypeFiles = files.filter(
      (file) => !acceptedTypes.includes(file.type)
    );
    if (invalidTypeFiles.length > 0) {
      return {
        isValid: false,
        error: "Certains fichiers ne sont pas dans un format supporté.",
      };
    }

    return { isValid: true };
  }

  static formatFileSize(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2) + " Mo";
  }

  static createFileInfo(files: File[]): FileInfo[] {
    return files.map((file) => ({
      name: file.name,
      size: FileValidator.formatFileSize(file.size),
    }));
  }
}

/**
 * Composant de prévisualisation d'image
 * ✅ next/image au lieu de <img>
 */
interface ImagePreviewProps {
  src: string;
  index: number;
  fileInfo: FileInfo;
  onRemove: (index: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  index,
  fileInfo,
  onRemove,
}) => (
  <div className="relative group">
    <div className="relative h-[100px] w-[100px]">
      <Image
        src={src}
        alt={`Aperçu ${index + 1}`}
        fill
        className="rounded-lg object-cover shadow-sm transition-transform group-hover:scale-105"
        sizes="100px"
        unoptimized // ✅ car c'est un blob URL (ObjectURL)
      />
    </div>

    <p
      className="text-xs text-center mt-1 truncate"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      {fileInfo?.size}
    </p>

    <button
      type="button"
      onClick={() => onRemove(index)}
      className="absolute top-1 right-1 rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity shadow-sm"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        color: COLORS.ERROR,
      }}
      title="Supprimer cette image"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

/**
 * Composant de barre de progression
 */
interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <div
    className="w-full h-2 rounded-full overflow-hidden mb-4"
    style={{ backgroundColor: COLORS.BG_GRAY }}
  >
    <div
      className="h-full transition-all duration-200 ease-out"
      style={{
        width: `${progress}%`,
        backgroundColor: COLORS.SUCCESS,
      }}
    />
  </div>
);

/**
 * Zone de drop pour les fichiers
 */
interface DropzoneProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  acceptString: string;
  maxImages: number;
  maxFileSize: number;
}

const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  acceptString,
  maxImages,
  maxFileSize,
}) => (
  <label
    htmlFor="dropzone-file"
    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:scale-[1.01]"
    style={{
      borderColor: COLORS.BORDER,
      backgroundColor: COLORS.BG_GRAY,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
      e.currentTarget.style.borderColor = COLORS.PRIMARY;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
      e.currentTarget.style.borderColor = COLORS.BORDER;
    }}
  >
    <input
      id="dropzone-file"
      type="file"
      multiple
      className="hidden"
      onChange={onFileSelect}
      accept={acceptString}
    />

    <div className="flex flex-col items-center justify-center pt-5 pb-6">
      <svg
        className="w-8 h-8 mb-4"
        style={{ color: COLORS.TEXT_MUTED }}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-2 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
        <span className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
          Cliquez pour importer
        </span>{" "}
        ou glissez-déposez vos images (max {maxImages})
      </p>
      <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
        Formats : JPG, PNG, GIF, WebP – Max : {maxFileSize} Mo/image
      </p>
    </div>
  </label>
);

/**
 * Composant FileUpload principal
 */
const FileUpload: React.FC<FileUploadProps> = ({
  setImages,
  imageList = [],
  maxImages = DEFAULT_CONFIG.maxImages,
  maxFileSize = DEFAULT_CONFIG.maxFileSize,
  acceptedTypes = DEFAULT_CONFIG.acceptedTypes,
  className = "",
  showProgress = true,
}) => {
  // ✅ accept string basé sur acceptedTypes (pas un constant fixe)
  const acceptString = useMemo(() => acceptedTypes.join(", "), [acceptedTypes]);

  const {
    imagePreview,
    setImagePreview,
    fileInfo,
    setFileInfo,
    uploadProgress,
    currentFiles,
    setCurrentFiles,
    notifyParent,
    simulateProgress,
  } = useFileUpload(setImages, maxImages);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      const validation = FileValidator.validateFiles(
        files,
        imagePreview.length,
        maxImages,
        maxFileSize,
        acceptedTypes
      );

      if (!validation.isValid) {
        toast.error(validation.error);
        event.target.value = "";
        return;
      }

      const previews = files.map((file) => URL.createObjectURL(file));
      const info = FileValidator.createFileInfo(files);
      const newFiles = [...currentFiles, ...files];

      setCurrentFiles(newFiles);
      setImagePreview((prev) => [...prev, ...previews]);
      setFileInfo((prev) => [...prev, ...info]);

      notifyParent(newFiles);

      if (showProgress) simulateProgress();

      event.target.value = "";

      toast.success(
        `${files.length} image${files.length > 1 ? "s" : ""} ajoutée${files.length > 1 ? "s" : ""}`
      );
    },
    [
      acceptedTypes,
      currentFiles,
      imagePreview.length,
      maxFileSize,
      maxImages,
      notifyParent,
      setCurrentFiles,
      setFileInfo,
      setImagePreview,
      showProgress,
      simulateProgress,
    ]
  );

  const removePreview = useCallback(
    (index: number): void => {
      const urlToRevoke = imagePreview[index];
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);

      const newFiles = currentFiles.filter((_, i) => i !== index);

      setImagePreview((prev) => prev.filter((_, i) => i !== index));
      setFileInfo((prev) => prev.filter((_, i) => i !== index));
      setCurrentFiles(newFiles);

      notifyParent(newFiles);
      toast.info("Image retirée de la prévisualisation");
    },
    [
      currentFiles,
      imagePreview,
      notifyParent,
      setCurrentFiles,
      setFileInfo,
      setImagePreview,
    ]
  );

  const resetAll = useCallback((): void => {
    imagePreview.forEach((url) => URL.revokeObjectURL(url));

    setImagePreview([]);
    setFileInfo([]);
    setCurrentFiles([]);
    notifyParent([]);

    toast.success("Images réinitialisées");
  }, [
    imagePreview,
    notifyParent,
    setCurrentFiles,
    setFileInfo,
    setImagePreview,
  ]);

  useEffect(() => {
    return () => {
      imagePreview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreview]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop et bouton de reset */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Dropzone
            onFileSelect={handleFileUpload}
            acceptString={acceptString}
            maxImages={maxImages}
            maxFileSize={maxFileSize}
          />
        </div>

        {imagePreview.length > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: COLORS.ERROR + "30",
              color: COLORS.ERROR,
              backgroundColor: COLORS.ERROR + "10",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.ERROR + "20";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.ERROR + "10";
            }}
          >
            <Globe size={16} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Barre de progression */}
      {showProgress && uploadProgress > 0 && uploadProgress < 100 && (
        <ProgressBar progress={uploadProgress} />
      )}

      {/* Prévisualisations des nouvelles images */}
      {imagePreview.length > 0 && (
        <div>
          <h4
            className="text-sm font-medium mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Nouvelles images ({imagePreview.length})
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
            {imagePreview.map((src, index) => (
              <ImagePreview
                key={`preview-${index}`}
                src={src}
                index={index}
                fileInfo={fileInfo[index]}
                onRemove={removePreview}
              />
            ))}
          </div>
        </div>
      )}

      {/* Images existantes */}
      {imageList.length > 0 && (
        <div>
          <h4
            className="text-sm font-medium mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Images actuelles ({imageList.length})
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
            {imageList.map((image, index) => (
              <div key={`existing-${index}`} className="relative">
                <div className="relative h-[100px] w-[100px]">
                  <Image
                    src={image.url}
                    alt={`Image existante ${index + 1}`}
                    fill
                    className="rounded-lg object-cover shadow-sm"
                    sizes="100px"
                    // ✅ si tes URLs viennent de Supabase Storage / remote,
                    // tu peux enlever "unoptimized" SI next.config.js images.remotePatterns est configuré
                    unoptimized
                  />
                </div>

                <div
                  className="absolute top-1 left-1 px-1 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: COLORS.INFO,
                    color: COLORS.TEXT_WHITE,
                  }}
                >
                  Actuelle
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicateur du nombre d'images */}
      <div
        className="flex justify-between items-center pt-3 border-t text-xs"
        style={{
          borderColor: COLORS.BORDER,
          color: COLORS.TEXT_MUTED,
        }}
      >
        <span>
          {imagePreview.length} nouvelle{imagePreview.length !== 1 ? "s" : ""}{" "}
          image{imagePreview.length !== 1 ? "s" : ""}
          {imageList.length > 0 && (
            <>
              {" "}
              + {imageList.length} existante{imageList.length !== 1 ? "s" : ""}
            </>
          )}
        </span>
        <span>Maximum : {maxImages} images</span>
      </div>

      {/* Résumé des limites */}
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          backgroundColor: COLORS.INFO + "10",
          borderColor: COLORS.INFO + "30",
        }}
      >
        <div className="flex flex-wrap gap-4">
          <span>📁 Formats : JPG, PNG, GIF, WebP</span>
          <span>📏 Taille max : {maxFileSize} Mo/image</span>
          <span>🔢 Limite : {maxImages} images</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

export type { FileUploadProps, FileInfo, ImageItem, ValidationResult };
