// app/_components/LanguageSelector.tsx

"use client";

import { useState } from "react";
import { ChevronDown, Check, Globe } from "@/utils/icons";
import {
  useCurrentLanguage,
  useLanguageActions,
} from "@/lib/store/settingsStore";
import { COLORS } from "@/lib/config";

interface Language {
  code: "fr" | "en";
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = useCurrentLanguage();
  const { setLanguage } = useLanguageActions();

  const selectedLanguage =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (language: Language) => {
    setLanguage(language.code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          color: COLORS.TEXT_SECONDARY,
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-4 h-4" />
        <span>
          {selectedLanguage.flag} {selectedLanguage.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: COLORS.TEXT_MUTED }}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop pour fermer en cliquant dehors */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu dropdown */}
          <div
            className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-20"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              border: `1px solid ${COLORS.BORDER}`,
            }}
          >
            {languages.map((language) => (
              <button
                key={language.code}
                className="flex items-center justify-between w-full px-3 py-2 text-left transition-colors first:rounded-t-md last:rounded-b-md"
                onClick={() => handleLanguageChange(language)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                </div>
                {selectedLanguage.code === language.code && (
                  <Check
                    className="w-4 h-4"
                    style={{ color: COLORS.PRIMARY }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
