"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const defaultHours = {
  Monday: "Fermé",
  Tuesday: "9h00 - 18h00",
  Wednesday: "9h00 - 18h00",
  Thursday: "9h00 - 18h00",
  Friday: "9h00 - 18h00",
  Saturday: "9h00 - 17h00",
  Sunday: "Fermé",
};

export default function OpeningHoursCard({ listing }) {
  const hours = listing?.opening_hours || defaultHours;

  const orderedDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const dayLabels = {
    Monday: "Lundi",
    Tuesday: "Mardi",
    Wednesday: "Mercredi",
    Thursday: "Jeudi",
    Friday: "Vendredi",
    Saturday: "Samedi",
    Sunday: "Dimanche",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <Calendar className="h-5 w-5 mr-2" />
          Horaires d'ouverture
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {orderedDays.map((day) => (
            <div className="flex justify-between" key={day}>
              <span>{dayLabels[day]}</span>
              <span className="text-muted-foreground">{hours[day]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
