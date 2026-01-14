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

type ListingWithHours = Database["public"]["Tables"]["listing"]["Row"];

interface OpeningHoursCardProps {
  listing?: ListingWithHours | null;
  className?: string;
}

interface OpeningHours {
  [key: string]: string;
}

interface DayInfo {
  key: string;
  label: string;
  hours: string;
  isToday: boolean;
  isOpen: boolean;
  isClosed: boolean;
  isSpecial: boolean;
}

interface OpenStatus {
  isCurrentlyOpen: boolean;
  nextChange: string | null;
  statusText: string;
  statusColor: "green" | "red" | "orange" | "gray";
}

const DEFAULT_HOURS: OpeningHours = {
  Monday: "Fermé",
  Tuesday: "9h00 - 18h00",
  Wednesday: "9h00 - 18h00",
  Thursday: "9h00 - 18h00",
  Friday: "9h00 - 18h00",
  Saturday: "9h00 - 17h00",
  Sunday: "Fermé",
};

const DAY_LABELS: Record<string, string> = {
  Monday: "Lundi",
  Tuesday: "Mardi",
  Wednesday: "Mercredi",
  Thursday: "Jeudi",
  Friday: "Vendredi",
  Saturday: "Samedi",
  Sunday: "Dimanche",
};

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* ------------------------------------------------------------------ */
/* ✅ Helpers stables (hors composant) : pas de deps, pas de regex unsafe */
/* ------------------------------------------------------------------ */

function containsClosedWord(s: string): boolean {
  return s.toLowerCase().includes("fermé");
}

/** Parse "9h00", "09:00", "9", "9h" => minutes depuis minuit */
function parseTimeToMinutes(raw: string): number | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, "");

  // Normalise "9h00" / "9h" -> "9:00"
  const normalized = t.includes("h") ? t.replace("h", ":") : t;

  // Formats acceptés : "9", "09", "9:00", "09:00"
  const [hhStr, mmStr] = normalized.split(":");
  if (!hhStr) return null;

  // Vérifs strictes sans regex “lourde”
  const hh = Number(hhStr);
  if (!Number.isInteger(hh) || hh < 0 || hh > 23) return null;

  const mm = mmStr === undefined || mmStr === "" ? 0 : Number(mmStr);
  if (!Number.isInteger(mm) || mm < 0 || mm > 59) return null;

  return hh * 60 + mm;
}

/** Parse "9h00 - 18h00" / "09:00-17:30" / "9 - 18" */
function parseHoursRange(
  hoursString: string
): { start: number; end: number } | null {
  if (!hoursString || containsClosedWord(hoursString)) return null;

  // Cherche un séparateur simple : "-", "–", "—"
  const idx = hoursString.search(/[–—-]/);
  if (idx === -1) return null;

  const left = hoursString.slice(0, idx).trim();
  const right = hoursString.slice(idx + 1).trim();

  const start = parseTimeToMinutes(left);
  const end = parseTimeToMinutes(right);

  if (start === null || end === null) return null;
  return { start, end };
}

function formatHhMmFromMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export default function OpeningHoursCard({
  listing,
  className,
}: OpeningHoursCardProps): JSX.Element {
  const openingHours: OpeningHours = useMemo(() => {
    if (!listing?.opening_hours) return DEFAULT_HOURS;

    if (
      typeof listing.opening_hours === "object" &&
      listing.opening_hours !== null
    ) {
      return { ...DEFAULT_HOURS, ...listing.opening_hours };
    }

    if (typeof listing.opening_hours === "string") {
      try {
        const parsed = JSON.parse(listing.opening_hours);
        if (typeof parsed === "object" && parsed !== null) {
          return { ...DEFAULT_HOURS, ...parsed };
        }
      } catch {
        // ignore
      }
    }

    return DEFAULT_HOURS;
  }, [listing?.opening_hours]);

  const today = useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay(); // 0=Dimanche
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Lundi=0
    return DAY_ORDER[adjustedIndex];
  }, []);

  const openStatus: OpenStatus = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayHours = openingHours[today];

    const parsedToday = parseHoursRange(todayHours);

    if (!parsedToday) {
      // Fermé aujourd’hui -> prochain jour d'ouverture
      let nextOpenDayLabel: string | null = null;

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (DAY_ORDER.indexOf(today) + i) % 7;
        const nextDay = DAY_ORDER[nextDayIndex];
        const nextDayHours = openingHours[nextDay];

        if (parseHoursRange(nextDayHours)) {
          nextOpenDayLabel = DAY_LABELS[nextDay];
          break;
        }
      }

      return {
        isCurrentlyOpen: false,
        nextChange: nextOpenDayLabel ? `Ouvert ${nextOpenDayLabel}` : null,
        statusText: "Fermé aujourd'hui",
        statusColor: "red",
      };
    }

    if (
      currentMinutes >= parsedToday.start &&
      currentMinutes <= parsedToday.end
    ) {
      return {
        isCurrentlyOpen: true,
        nextChange: `Ferme à ${formatHhMmFromMinutes(parsedToday.end)}`,
        statusText: "Ouvert maintenant",
        statusColor: "green",
      };
    }

    if (currentMinutes < parsedToday.start) {
      return {
        isCurrentlyOpen: false,
        nextChange: `Ouvre à ${formatHhMmFromMinutes(parsedToday.start)}`,
        statusText: "Fermé actuellement",
        statusColor: "orange",
      };
    }

    const tomorrowIndex = (DAY_ORDER.indexOf(today) + 1) % 7;
    const tomorrow = DAY_ORDER[tomorrowIndex];

    return {
      isCurrentlyOpen: false,
      nextChange: `Ouvre ${DAY_LABELS[tomorrow]}`,
      statusText: "Fermé pour aujourd'hui",
      statusColor: "red",
    };
  }, [openingHours, today]);

  const daysInfo: DayInfo[] = useMemo(() => {
    return DAY_ORDER.map((day) => {
      const hours = openingHours[day];
      const isTodayDay = day === today;
      const isClosed = !hours || containsClosedWord(hours);
      const isSpecial = hours.includes("Sur RDV") || hours.includes("Variable");

      return {
        key: day,
        label: DAY_LABELS[day],
        hours,
        isToday: isTodayDay,
        isOpen: !isClosed,
        isClosed,
        isSpecial,
      };
    });
  }, [openingHours, today]);

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

        {openStatus.nextChange && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {openStatus.nextChange}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
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

              {!day.isClosed && (
                <div className="h-2 w-2 bg-green-400 rounded-full" />
              )}
              {day.isClosed && (
                <div className="h-2 w-2 bg-red-400 rounded-full" />
              )}
              {day.isSpecial && (
                <div className="h-2 w-2 bg-orange-400 rounded-full" />
              )}
            </div>
          </div>
        ))}

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
