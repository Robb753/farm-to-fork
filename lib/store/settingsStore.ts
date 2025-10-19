// lib/store/settingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Translations (on garde la même structure)
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

interface SettingsState {
  currentLanguage: "fr" | "en";
  setLanguage: (lang: "fr" | "en" | { code: "fr" | "en" }) => void;
  t: (key: string) => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      currentLanguage: "fr",

      setLanguage: (lang) => {
        let newLang: "fr" | "en";

        if (typeof lang === "string") {
          newLang = lang;
        } else if (typeof lang === "object" && lang?.code) {
          newLang = lang.code;
        } else {
          return; // Ignore invalid input
        }

        set({ currentLanguage: newLang });
      },

      t: (key: string) => {
        const { currentLanguage } = get();
        return translations[currentLanguage]?.[key] || key;
      },
    }),
    {
      name: "farm2fork-settings",
      partialize: (state) => ({ currentLanguage: state.currentLanguage }),
    }
  )
);

// Selectors pour optimiser les re-renders
export const useCurrentLanguage = () =>
  useSettingsStore((state) => state.currentLanguage);
export const useTranslation = () => useSettingsStore((state) => state.t);
export const useLanguageActions = () =>
  useSettingsStore((state) => ({
    setLanguage: state.setLanguage,
  }));
