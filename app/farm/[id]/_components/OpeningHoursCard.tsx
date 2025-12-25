"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "@/utils/icons";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec horaires d'ouverture
 */
type ListingWithHours = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant OpeningHoursCard
 */
interface OpeningHoursCardProps {
  listing?: ListingWithHours | null;
  className?: string;
}

/**
 * Interface pour les horaires d'ouverture
 */
interface OpeningHours {
  [key: string]: string;
}

/**
 * Interface pour un jour avec ses détails
 */
interface DayInfo {
  key: string;
  label: string;
  hours: string;
  isToday: boolean;
  isOpen: boolean;
  isClosed: boolean;
  isSpecial: boolean;
}

/**
 * Interface pour le statut d'ouverture actuel
 */
interface OpenStatus {
  isCurrentlyOpen: boolean;
  nextChange: string | null;
  statusText: string;
  statusColor: "green" | "red" | "orange" | "gray";
}

/**
 * Horaires par défaut pour une ferme typique
 */
const DEFAULT_HOURS: OpeningHours = {
  Monday: "Fermé",
  Tuesday: "9h00 - 18h00",
  Wednesday: "9h00 - 18h00",
  Thursday: "9h00 - 18h00",
  Friday: "9h00 - 18h00",
  Saturday: "9h00 - 17h00",
  Sunday: "Fermé",
};

/**
 * Correspondance jours anglais → français
 */
const DAY_LABELS: Record<string, string> = {
  Monday: "Lundi",
  Tuesday: "Mardi",
  Wednesday: "Mercredi",
  Thursday: "Jeudi",
  Friday: "Vendredi",
  Saturday: "Samedi",
  Sunday: "Dimanche",
};

/**
 * Ordre des jours de la semaine (Lundi = 0)
 */
const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Composant d'affichage des horaires d'ouverture d'une ferme
 *
 * Features:
 * - Affichage des horaires avec jour actuel mis en évidence
 * - Calcul du statut d'ouverture en temps réel
 * - Prédiction de la prochaine ouverture/fermeture
 * - Gestion des horaires spéciaux et exceptions
 * - Design moderne avec badges de statut
 * - Support de formats d'horaires multiples
 *
 * @param listing - Données du listing avec horaires
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Card des horaires d'ouverture
 */
export default function OpeningHoursCard({
  listing,
  className,
}: OpeningHoursCardProps): JSX.Element {
  /**
   * Parse et normalise les horaires d'ouverture
   */
  const openingHours: OpeningHours = useMemo(() => {
    if (!listing?.opening_hours) {
      return DEFAULT_HOURS;
    }

    // Si c'est déjà un objet
    if (
      typeof listing.opening_hours === "object" &&
      listing.opening_hours !== null
    ) {
      return { ...DEFAULT_HOURS, ...listing.opening_hours };
    }

    // Si c'est une string JSON
    if (typeof listing.opening_hours === "string") {
      try {
        const parsed = JSON.parse(listing.opening_hours);
        if (typeof parsed === "object" && parsed !== null) {
          return { ...DEFAULT_HOURS, ...parsed };
        }
      } catch {
        // Parsing failed, use defaults
      }
    }

    return DEFAULT_HOURS;
  }, [listing?.opening_hours]);

  /**
   * Obtient le jour actuel de la semaine
   */
  const today = useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Dimanche, 1 = Lundi, ...
    // Convertir pour avoir Lundi = 0
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAY_ORDER[adjustedIndex];
  }, []);

  /**
   * Parse les horaires pour déterminer si c'est ouvert maintenant
   */
  const parseHours = (
    hoursString: string
  ): { start: number; end: number } | null => {
    if (!hoursString || hoursString.toLowerCase().includes("fermé")) {
      return null;
    }

    // Regex pour capturer les horaires (ex: "9h00 - 18h00", "09:00-17:30")
    const timeRegex = /(\d{1,2})[h:]?(\d{2})?\s*[-–]\s*(\d{1,2})[h:]?(\d{2})?/;
    const match = hoursString.match(timeRegex);

    if (!match) return null;

    const startHour = parseInt(match[1]);
    const startMin = parseInt(match[2] || "0");
    const endHour = parseInt(match[3]);
    const endMin = parseInt(match[4] || "0");

    const start = startHour * 60 + startMin; // Minutes depuis minuit
    const end = endHour * 60 + endMin;

    return { start, end };
  };

  /**
   * Calcule le statut d'ouverture actuel
   */
  const openStatus: OpenStatus = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayHours = openingHours[today];

    const parsedToday = parseHours(todayHours);

    if (!parsedToday) {
      // Fermé aujourd'hui, chercher le prochain jour d'ouverture
      let nextOpenDay = null;
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (DAY_ORDER.indexOf(today) + i) % 7;
        const nextDay = DAY_ORDER[nextDayIndex];
        const nextDayHours = openingHours[nextDay];

        if (parseHours(nextDayHours)) {
          nextOpenDay = DAY_LABELS[nextDay];
          break;
        }
      }

      return {
        isCurrentlyOpen: false,
        nextChange: nextOpenDay ? `Ouvert ${nextOpenDay}` : null,
        statusText: "Fermé aujourd'hui",
        statusColor: "red",
      };
    }

    // Ouvert aujourd'hui, vérifier l'heure actuelle
    if (
      currentMinutes >= parsedToday.start &&
      currentMinutes <= parsedToday.end
    ) {
      const closingHour = Math.floor(parsedToday.end / 60);
      const closingMin = parsedToday.end % 60;

      return {
        isCurrentlyOpen: true,
        nextChange: `Ferme à ${closingHour}h${closingMin.toString().padStart(2, "0")}`,
        statusText: "Ouvert maintenant",
        statusColor: "green",
      };
    } else if (currentMinutes < parsedToday.start) {
      const openingHour = Math.floor(parsedToday.start / 60);
      const openingMin = parsedToday.start % 60;

      return {
        isCurrentlyOpen: false,
        nextChange: `Ouvre à ${openingHour}h${openingMin.toString().padStart(2, "0")}`,
        statusText: "Fermé actuellement",
        statusColor: "orange",
      };
    } else {
      // Fermé pour aujourd'hui, chercher demain
      const tomorrowIndex = (DAY_ORDER.indexOf(today) + 1) % 7;
      const tomorrow = DAY_ORDER[tomorrowIndex];
      const tomorrowLabel = DAY_LABELS[tomorrow];

      return {
        isCurrentlyOpen: false,
        nextChange: `Ouvre ${tomorrowLabel}`,
        statusText: "Fermé pour aujourd'hui",
        statusColor: "red",
      };
    }
  }, [openingHours, today, parseHours]);

  /**
   * Prépare les données des jours avec informations enrichies
   */
  const daysInfo: DayInfo[] = useMemo(() => {
    return DAY_ORDER.map((day) => {
      const hours = openingHours[day];
      const isToday = day === today;
      const isClosed = !hours || hours.toLowerCase().includes("fermé");
      const isSpecial = hours.includes("Sur RDV") || hours.includes("Variable");

      return {
        key: day,
        label: DAY_LABELS[day],
        hours,
        isToday,
        isOpen: !isClosed,
        isClosed,
        isSpecial,
      };
    });
  }, [openingHours, today]);

  /**
   * Obtient l'icône de statut selon l'état d'ouverture
   */
  const getStatusIcon = (color: OpenStatus["statusColor"]) => {
    switch (color) {
      case "green":
        return <CheckCircle className="h-4 w-4" />;
      case "red":
        return <XCircle className="h-4 w-4" />;
      case "orange":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  /**
   * Obtient les classes de couleur pour les badges
   */
  const getStatusClasses = (color: OpenStatus["statusColor"]) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800 border-green-200";
      case "red":
        return "bg-red-100 text-red-800 border-red-200";
      case "orange":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-green-700 text-lg">
            <Calendar className="h-5 w-5 mr-2" />
            Horaires d'ouverture
          </CardTitle>

          {/* Badge de statut actuel */}
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1 font-medium",
              getStatusClasses(openStatus.statusColor)
            )}
          >
            {getStatusIcon(openStatus.statusColor)}
            <span className="text-xs">{openStatus.statusText}</span>
          </Badge>
        </div>

        {/* Prochaine ouverture/fermeture */}
        {openStatus.nextChange && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {openStatus.nextChange}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Liste des jours */}
        {daysInfo.map((day) => (
          <div
            key={day.key}
            className={cn(
              "flex items-center justify-between py-2 px-3 rounded-lg transition-colors",
              day.isToday
                ? "bg-green-50 border border-green-200"
                : "hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium",
                  day.isToday ? "text-green-800" : "text-gray-700"
                )}
              >
                {day.label}
              </span>

              {day.isToday && (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-700 text-xs px-2 py-0 h-5"
                >
                  Aujourd'hui
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm",
                  day.isToday
                    ? "text-green-700 font-medium"
                    : day.isClosed
                      ? "text-red-600"
                      : "text-gray-600"
                )}
              >
                {day.hours}
              </span>

              {/* Indicateur visuel */}
              {!day.isClosed && (
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              )}
              {day.isClosed && (
                <div className="h-2 w-2 bg-red-400 rounded-full"></div>
              )}
              {day.isSpecial && (
                <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
              )}
            </div>
          </div>
        ))}

        {/* Message informatif */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4">
          <p className="text-blue-800 text-xs text-center">
            💡 <strong>Conseil :</strong> Contactez la ferme pour confirmer les
            horaires, ils peuvent varier selon les saisons
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
