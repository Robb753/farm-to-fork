"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function ReviewsTab({ listing }) {
  const reviews = listing?.reviews || [];

  if (!reviews.length) {
    return (
      <div className="p-4 bg-white rounded-md border text-gray-500 text-sm">
        Aucun avis n’a encore été laissé pour cette ferme.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, idx) => (
        <Card key={idx} className="border border-gray-200">
          <CardHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-green-800">
                {review.name || "Utilisateur anonyme"}
              </CardTitle>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                    fill={i < review.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">{review.date}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
