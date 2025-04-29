"use client";

import { ChevronDown, Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "../contexts/Language-context"; // ✅ Vérifie que le nom du fichier est correct

const languages = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();

  // ✅ Vérification : Si `currentLanguage` est `null`, on affiche une valeur par défaut
  const selectedLanguage = currentLanguage || languages[0];

  const handleLanguageChange = (language) => {
    if (setLanguage) {
      setLanguage(language);
    } else {
      console.error("Erreur: `setLanguage` n'est pas défini.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors">
          <Globe className="w-4 h-4" />
          <span>
            {selectedLanguage.flag} {selectedLanguage.name}
          </span>
          <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className="flex items-center justify-between px-3 py-2 cursor-pointer transition hover:bg-gray-100"
            onClick={() => handleLanguageChange(language)}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {selectedLanguage.code === language.code && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
