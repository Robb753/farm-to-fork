// FileUpload.tsx
"use client";

import React, { useState, useCallback, useRef } from "react";
import { Trash2, Globe } from "@/utils/icons";
import { toast } from "sonner";

// Types pour les informations de fichier
interface FileInfo {
  name: string;
  size: string;
}

// Types pour les images existantes
interface ImageItem {
  url: string;
}

// Types pour les props du composant
interface FileUploadProps {
  setImages: (files: File[]) => void;
  imageList?: ImageItem[];
}

const FileUpload: React.FC<FileUploadProps> = ({ setImages, imageList }) => {
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);

  // Ref pour éviter les appels multiples
  const isUpdatingRef = useRef<boolean>(false);

  // Fonction pour simuler le progrès de l'upload
  const simulateProgress = useCallback((): void => {
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  }, []);

  // Fonction pour notifier le parent avec protection contre les appels multiples
  const notifyParent = useCallback(
    (files: File[]): void => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;

      // Utiliser requestAnimationFrame pour différer l'appel
      requestAnimationFrame(() => {
        setImages(files);
        isUpdatingRef.current = false;
      });
    },
    [setImages]
  );

  // Gestion de l'upload de fichiers
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = Array.from(event.target.files || []);

      // Vérification du nombre maximum d'images
      if (files.length + imagePreview.length > 3) {
        toast.error("Vous pouvez importer un maximum de 3 images.");
        return;
      }

      // Validation des fichiers (taille max 5MB par image)
      const oversizedFiles = files.filter(
        (file) => file.size > 5 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        toast.error("Certaines images dépassent la taille maximale de 5 Mo.");
        return;
      }

      // Création des previews et infos
      const previews = files.map((file) => URL.createObjectURL(file));
      const info: FileInfo[] = files.map((file) => ({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " Mo",
      }));

      const newFiles = [...currentFiles, ...files];

      // Mise à jour groupée des états locaux
      setCurrentFiles(newFiles);
      setImagePreview((prev) => [...prev, ...previews]);
      setFileInfo((prev) => [...prev, ...info]);

      // Notification au parent
      notifyParent(newFiles);

      // Démarrer la simulation du progrès
      simulateProgress();

      // Réinitialiser l'input pour permettre la sélection du même fichier
      event.target.value = "";
    },
    [currentFiles, imagePreview.length, notifyParent, simulateProgress]
  );

  // Suppression d'une prévisualisation
  const removePreview = useCallback(
    (index: number): void => {
      // Nettoyer l'URL de l'objet pour éviter les fuites mémoire
      const urlToRevoke = imagePreview[index];
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }

      const newFiles = currentFiles.filter((_, i) => i !== index);

      // Mise à jour groupée des états locaux
      setImagePreview((prev) => prev.filter((_, i) => i !== index));
      setFileInfo((prev) => prev.filter((_, i) => i !== index));
      setCurrentFiles(newFiles);

      // Notification au parent
      notifyParent(newFiles);

      toast.info("Image retirée de la prévisualisation");
    },
    [currentFiles, imagePreview, notifyParent]
  );

  // Réinitialisation complète
  const resetAll = useCallback((): void => {
    // Nettoyer toutes les URLs d'objets
    imagePreview.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    // Réinitialisation des états locaux
    setImagePreview([]);
    setFileInfo([]);
    setCurrentFiles([]);
    setUploadProgress(0);

    // Notification au parent
    notifyParent([]);

    toast.success("Images réinitialisées");
  }, [imagePreview, notifyParent]);

  // Nettoyage des URLs lors du démontage du composant
  React.useEffect(() => {
    return () => {
      imagePreview.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imagePreview]);

  return (
    <div>
      <input
        id="dropzone-file"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="image/png, image/gif, image/jpeg, image/jpg, image/webp"
      />

      <div className="flex items-center justify-between w-full mb-2">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
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
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Cliquez pour importer</span> ou
              glissez-déposez vos images (max 3)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Formats : JPG, PNG, GIF, WebP – Max : 5 Mo/image
            </p>
          </div>
        </label>

        {imagePreview.length > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="ml-4 text-sm flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
          >
            <Globe size={16} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Barre de progression */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="bg-green-500 h-full transition-all duration-200 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Prévisualisations des nouvelles images */}
      {imagePreview.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3 mt-5">
          {imagePreview.map((src, index) => (
            <div key={`preview-${index}`} className="relative group">
              <img
                src={src}
                className="rounded-lg object-cover h-[100px] w-[100px] shadow-sm"
                alt={`Aperçu ${index + 1}`}
                loading="lazy"
              />
              <p className="text-xs text-gray-600 text-center mt-1 truncate">
                {fileInfo[index]?.size}
              </p>
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 opacity-80 hover:opacity-100 transition-opacity shadow-sm"
                title="Supprimer cette image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Images existantes */}
      {imageList && imageList.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Images actuelles
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
            {imageList.map((image, index) => (
              <div key={`existing-${index}`} className="relative">
                <img
                  src={image?.url}
                  width={100}
                  height={100}
                  className="rounded-lg object-cover h-[100px] w-[100px] shadow-sm"
                  alt={`Image existante ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicateur du nombre d'images */}
      <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
        <span>
          {imagePreview.length} nouvelle{imagePreview.length !== 1 ? "s" : ""}{" "}
          image{imagePreview.length !== 1 ? "s" : ""}
          {imageList && imageList.length > 0 && (
            <>
              {" "}
              + {imageList.length} existante{imageList.length !== 1 ? "s" : ""}
            </>
          )}
        </span>
        <span>Maximum : 3 images</span>
      </div>
    </div>
  );
};

export default FileUpload;
