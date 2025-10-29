"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "@/utils/icons"; // Assurez-vous que le chemin est correct
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RequestConfirmationPage() {
  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Demande envoyée avec succès !
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Merci de votre intérêt pour devenir producteur sur Farm to Fork.
            Notre équipe examinera votre demande dans les plus brefs délais.
          </p>

          <p className="text-gray-600">
            Vous recevrez une notification par email dès que votre demande sera
            traitée.
          </p>

          <div className="py-4 px-4 bg-green-50 rounded-lg border border-green-100 text-sm text-green-800 mt-6">
            <p>
              <strong>Que se passe-t-il ensuite ?</strong>
            </p>
            <ul className="list-disc pl-5 mt-2 text-left">
              <li>Notre équipe examine votre demande (1-2 jours ouvrés)</li>
              <li>Vous recevez un email de confirmation</li>
              <li>Une fois approuvé, vous pourrez ajouter vos produits</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-2">
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">
              Retour à l'accueil
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
