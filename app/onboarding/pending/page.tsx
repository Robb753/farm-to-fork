"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Clock, Mail, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { supabase } from "@/utils/supabase/client";

const steps = [
  { number: 1, label: "Demande" },
  { number: 2, label: "Votre ferme" },
  { number: 3, label: "Activation" },
];

export default function PendingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [requestStatus, setRequestStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);

  // ✅ Vérifier le statut DANS LA BASE uniquement
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkRequestStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("farmer_requests")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erreur vérification:", error);
          setRequestStatus(null);
          return;
        }

        if (!data) {
          // Aucune demande trouvée, rediriger vers step-1
          router.replace("/onboarding/step-1");
          return;
        }

        setRequestStatus(data.status as "pending" | "approved" | "rejected");
      } catch (err) {
        console.error("Erreur:", err);
        setRequestStatus(null);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRequestStatus();
  }, [isLoaded, user, router]);

  // Afficher un loader pendant la vérification
  if (checkingStatus || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Vérification de votre statut...
          </p>
        </div>
      </div>
    );
  }

  // ✅ Si approuvé, afficher un message différent avec lien
  if (requestStatus === "approved") {
    return (
      <div className="min-h-screen bg-background p-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 text-primary hover:text-primary/80 transition-colors w-fit"
          >
            <Sprout className="w-6 h-6" />
            <span className="font-semibold text-lg">Farm2Fork</span>
          </Link>

          <ProgressIndicator currentStep={1} steps={steps} />

          <Card className="shadow-lg border-2 text-center border-green-200 bg-green-50/50">
            <CardHeader className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-balance text-green-900">
                ✅ Demande approuvée !
              </CardTitle>
              <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto text-green-800">
                Félicitations ! Vous pouvez maintenant continuer et compléter
                votre profil de producteur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold text-lg mb-3 text-green-900">
                  Prochaine étape
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  Cliquez sur le bouton ci-dessous pour compléter les
                  informations de votre ferme (description, produits, etc.)
                </p>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  onClick={() => router.push("/onboarding/step-2")}
                >
                  Continuer vers l'étape 2 →
                </Button>
              </div>

              <div className="bg-green-100 p-4 rounded-lg text-left border border-green-300">
                <p className="text-sm text-green-900">
                  <strong>Un email de confirmation</strong> a été envoyé à{" "}
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Si rejeté
  if (requestStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background p-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 text-primary hover:text-primary/80 transition-colors w-fit"
          >
            <Sprout className="w-6 h-6" />
            <span className="font-semibold text-lg">Farm2Fork</span>
          </Link>

          <Card className="shadow-lg border-2 text-center border-red-200 bg-red-50/50">
            <CardHeader className="space-y-4">
              <CardTitle className="text-3xl text-balance text-red-900">
                Demande non approuvée
              </CardTitle>
              <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto text-red-800">
                Malheureusement, votre demande n'a pas pu être approuvée.
                Contactez-nous pour plus d'informations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Si pending (en attente)
  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 text-primary hover:text-primary/80 transition-colors w-fit"
        >
          <Sprout className="w-6 h-6" />
          <span className="font-semibold text-lg">Farm2Fork</span>
        </Link>

        <ProgressIndicator currentStep={1} steps={steps} />

        <Card className="shadow-lg border-2 text-center">
          <CardHeader className="space-y-4">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl text-balance">
              Demande en attente
            </CardTitle>
            <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto">
              Nous vérifions que vous êtes bien producteur. Vous recevrez un
              email de confirmation sous 24-48h pour compléter votre fiche
              ferme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg space-y-3 text-left">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Et après ?
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Validation de votre demande
                    </p>
                    <p className="text-xs">
                      Notre équipe vérifie que vous êtes bien un producteur
                      agricole (SIRET, activité...)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Réception de l'email
                    </p>
                    <p className="text-xs">
                      Vous recevrez un email avec un lien pour continuer votre
                      inscription
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Compléter votre profil
                    </p>
                    <p className="text-xs">
                      En moins de 5 minutes, racontez votre histoire et publiez
                      votre fiche ferme
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg text-left">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">
                  Vérifiez votre boîte mail :
                </strong>{" "}
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Pensez à vérifier vos spams si vous ne recevez pas d'email dans
                les prochaines heures.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/">Retour à l'accueil</Link>
              </Button>

              <p className="text-xs text-muted-foreground">
                Des questions ? Contactez-nous à{" "}
                <a
                  href="mailto:support@farm2fork.com"
                  className="text-primary hover:underline font-medium"
                >
                  support@farm2fork.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
