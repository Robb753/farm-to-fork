"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function FeedbackHomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Breadcrumb />

      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-green-700">
          Aidez-nous à améliorer Farm To Fork 🌱
        </h1>

        <p className="text-gray-600 text-lg">
          Vos idées, vos suggestions et vos retours sont essentiels pour
          construire une meilleure plateforme.
        </p>

        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/feedback/form">Donner mon avis</Link>
        </Button>

        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-semibold">
            Ce que vos retours ont permis :
          </h2>
          <ul className="list-disc list-inside text-left text-gray-700 space-y-2 mx-auto max-w-md">
            <li>Amélioration de la carte interactive 📍</li>
            <li>Ajout de nouvelles fermes locales 🐑</li>
            <li>Optimisation du temps de chargement 🚀</li>
          </ul>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            Vous pouvez consulter notre{" "}
            <Link href="/legal" className="underline hover:text-green-700">
              Politique de confidentialité
            </Link>{" "}
            pour savoir comment nous protégeons vos données.
          </p>
        </div>
      </div>
    </div>
  );
}
