// FileUploadEnhanced.jsx
"use client";

import React, { useState } from "react";
import { Trash2, RefreshCcw, Globe } from "@/utils/icons";
import { toast } from "sonner";

function FileUpload({ setImages, imageList }) {
  const [imagePreview, setImagePreview] = useState([]);
  const [fileInfo, setFileInfo] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    if (files.length + imagePreview.length > 3) {
      toast.error("Vous pouvez importer un maximum de 3 images.");
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));
    const info = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " Mo",
    }));

    setImages((prev) => [...(prev || []), ...files]);
    setImagePreview((prev) => [...prev, ...previews]);
    setFileInfo((prev) => [...prev, ...info]);

    simulateProgress();
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 100);
  };

  const removePreview = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setFileInfo((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image retirée de la prévisualisation");
  };

  const resetAll = () => {
    setImagePreview([]);
    setFileInfo([]);
    setImages([]);
    toast.success("Images réinitialisées");
  };

  return (
    <div>
      <input
        id="dropzone-file"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="image/png, image/gif, image/jpeg, image/jpg"
      />

      <div className="flex items-center justify-between w-full mb-2">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
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
              Formats : JPG, PNG, GIF – Max : 5 Mo/image
            </p>
          </div>
        </label>

        {imagePreview.length > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="ml-4 text-sm flex items-center gap-1 text-red-600 hover:text-red-800"
          >
            <Globe size={16} /> Réinitialiser
          </button>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="bg-green-500 h-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3 mt-5">
        {imagePreview.map((src, index) => (
          <div key={index} className="relative group">
            <img
              src={src}
              className="rounded-lg object-cover h-[100px] w-[100px]"
              alt={`preview-${index}`}
            />
            <p className="text-xs text-gray-600 text-center mt-1">
              {fileInfo[index]?.size}
            </p>
            <button
              type="button"
              onClick={() => removePreview(index)}
              className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 opacity-80 hover:opacity-100 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {imageList && imageList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3 mt-5">
          {imageList.map((image, index) => (
            <div key={index}>
              <img
                src={image?.url}
                width={100}
                height={100}
                className="rounded-lg object-cover h-[100px] w-[100px]"
                alt={`uploaded-${index}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
