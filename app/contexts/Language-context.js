"use client";

import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const translations = {
  fr: {
    welcome: "Bienvenue sur Farm To Fork",
    connect:
      "Trouvez des producteurs près de chez vous. 📍 Entrez une ville pour commencer.",
    explore: "Explorer à proximité",
    philosophy: "Notre Philosophie",
    quality: "Qualité Européenne",
    quality_desc: "Nous valorisons les standards de qualité européens.",
    terroir: "Terroir Local",
    terroir_desc: "Nous célébrons la diversité des terroirs européens.",
    tradition: "Tradition & Innovation",
    tradition_desc: "Nous respectons les traditions agricoles.",
  },
  en: {
    welcome: "Welcome to Farm To Fork",
    connect: "Find producers near you. 📍 Enter a city to get started.",
    explore: "Explore Nearby",
    philosophy: "Our Philosophy",
    quality: "European Quality",
    quality_desc: "We uphold European quality standards.",
    terroir: "Local Terroir",
    terroir_desc: "Celebrating the uniqueness of European terroirs.",
    tradition: "Tradition & Innovation",
    tradition_desc: "Respecting traditions while embracing innovation.",
  },
};

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState("fr");

  const t = (key) => translations?.[currentLanguage]?.[key] || key;

  const setLanguage = (lang) => {
    if (typeof lang === "string") {
      setCurrentLanguage(lang);
    } else if (typeof lang === "object" && lang?.code) {
      setCurrentLanguage(lang.code);
    }
  };

  return (
    <LanguageContext.Provider value={{ t, currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
