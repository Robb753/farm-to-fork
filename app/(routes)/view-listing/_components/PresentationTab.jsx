"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PresentationTab({ listing }) {
  return (
    <div className="space-y-6 p-4 bg-white rounded-md shadow-sm border border-gray-100">
      {/* Description de la ferme */}
      {listing?.description && (
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            Présentation
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      )}

      {/* Certifications */}
      {Array.isArray(listing?.certifications) &&
        listing.certifications.length > 0 && (
          <div>
            <Separator className="my-4" />
            <h4 className="text-md font-medium text-gray-800 mb-2">
              Certifications
            </h4>
            <div className="flex flex-wrap gap-2">
              {listing.certifications.map((cert, index) => (
                <Badge
                  key={index}
                  className="bg-emerald-100 text-emerald-700 border border-emerald-200"
                >
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

      {/* Méthodes de production */}
      {Array.isArray(listing?.production_methods) &&
        listing.production_methods.length > 0 && (
          <div>
            <Separator className="my-4" />
            <h4 className="text-md font-medium text-gray-800 mb-2">
              Méthodes de production
            </h4>
            <div className="flex flex-wrap gap-2">
              {listing.production_methods.map((method, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-700 border border-blue-200"
                >
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
