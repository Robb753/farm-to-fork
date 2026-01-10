"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

type Role = "user" | "farmer" | "admin";

export default function SuccessPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Normalise le rôle (évite les undefined / casing)
  const role = useMemo(() => {
    const raw = user?.publicMetadata?.role;
    if (typeof raw !== "string") return null;
    const normalized = raw.toLowerCase();
    return (
      normalized === "user" || normalized === "farmer" || normalized === "admin"
        ? normalized
        : null
    ) as Role | null;
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;

    // Pas connecté -> sign-in
    if (!user) {
      setIsRedirecting(true);
      router.replace("/sign-in"); // replace = pas d'historique “inutilisable”
      return;
    }

    // Pas farmer -> home
    if (role !== "farmer") {
      setIsRedirecting(true);
      router.replace("/");
      return;
    }
  }, [isLoaded, user, role, router]);

  // Loader tant que: pas chargé OU redirection
  if (!isLoaded || isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {isRedirecting ? "Redirection..." : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  // Safety: si jamais role null (cas edge), on évite de render
  if (!user || role !== "farmer") return null;

  return (
    <div className="min-h-screen bg-background p-4 py-12 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 text-primary hover:text-primary/80 transition-colors w-fit mx-auto"
        >
          <Sprout className="w-6 h-6" />
          <span className="font-semibold text-lg">Farm2Fork</span>
        </Link>

        <Card className="shadow-lg border-2 text-center">
          <CardHeader className="space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-4xl text-balance">
              Félicitations !
            </CardTitle>
            <CardDescription className="text-base leading-relaxed max-w-xl mx-auto">
              Votre ferme est maintenant publiée et visible sur Farm2Fork. Les
              clients peuvent vous découvrir et commander vos produits.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-muted rounded-lg text-left">
                <h3 className="font-semibold mb-2">Prochaines étapes</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Consultez votre tableau de bord</li>
                  <li>• Gérez vos commandes</li>
                  <li>• Mettez à jour vos produits</li>
                </ul>
              </div>

              <div className="p-6 bg-muted rounded-lg text-left">
                <h3 className="font-semibold mb-2">Besoin d&apos;aide ?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Guide de démarrage</li>
                  <li>• Centre d&apos;aide</li>
                  <li>• Support producteur</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/dashboard/farms">
                  Accéder à mon tableau de bord
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="sm:w-auto bg-transparent"
                asChild
              >
                <Link href="/">Voir ma fiche publique</Link>
              </Button>
            </div>

            {/* NOTE: boutons de partage = UI only pour l’instant */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Partagez votre ferme avec votre communauté :
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  {/* svg ok */}
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>

                <Button variant="outline" size="sm" className="gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </Button>

                <Button variant="outline" size="sm" className="gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0z" />
                  </svg>
                  Instagram
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Merci de rejoindre la communauté Farm2Fork ! 🌱
          </p>
        </div>
      </div>
    </div>
  );
}
