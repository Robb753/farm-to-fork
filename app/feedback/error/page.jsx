"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function FeedbackErrorPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <Breadcrumb />

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-red-600">
          <svg
            className="h-16 w-16 mx-auto"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-red-700">
          Oups, une erreur est survenue 😕
        </h1>
        <p className="text-gray-600">
          Nous n'avons pas pu traiter votre message. Veuillez réessayer dans un
          instant.
        </p>

        <Button asChild className="bg-red-600 hover:bg-red-700">
          <Link href="/feedback">Réessayer</Link>
        </Button>
      </div>
    </div>
  );
}
