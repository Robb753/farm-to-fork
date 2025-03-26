"use client";

import { useLanguage } from "@/app/contexts/Language-context";
import React from "react";


function EuropeanFeatures() {
  const { t } = useLanguage(); // ✅ Utilisation de `t`

  return (
    <section className="px-4 py-12 md:px-6 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto mb-10 mt-10">
        {/* Titre principal 
        <h2 className="text-4xl font-serif font-bold text-gray-900 text-center">
          {t("")}
        </h2>
        */}

        {/* Grid des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureItem
            title={t("quality")}
            description={t("quality_desc")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            }
          />
          <FeatureItem
            title={t("terroir")}
            description={t("terroir_desc")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <FeatureItem
            title={t("tradition")}
            description={t("tradition_desc")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

// ✅ Composant modulaire pour chaque élément
function FeatureItem({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mb-4 shadow-md">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default EuropeanFeatures;
