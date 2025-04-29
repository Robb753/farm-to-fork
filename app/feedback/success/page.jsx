"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function FeedbackSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <Breadcrumb />

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-green-600">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-green-700">
          Merci pour votre retour ! 🙏
        </h1>
        <p className="text-gray-600">
          Nous apprécions votre aide pour améliorer Farm To Fork.
        </p>

        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
