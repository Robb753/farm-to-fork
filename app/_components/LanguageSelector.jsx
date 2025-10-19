"use client";

import { ChevronDown, Check, Globe } from "@/utils/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCurrentLanguage,
  useLanguageActions,
} from "@/lib/store/settingsStore";

const languages = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function LanguageSelector() {
  const currentLanguage = useCurrentLanguage();
  const { setLanguage } = useLanguageActions();

  // Trouve la langue sélectionnée ou utilise français par défaut
  const selectedLanguage =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (language) => {
    setLanguage(language.code);
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
