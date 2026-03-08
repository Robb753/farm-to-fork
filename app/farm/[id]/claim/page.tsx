"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, ChevronLeft, CheckCircle } from "lucide-react";
import { useSupabaseWithClerk } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FarmInfo {
  id: number;
  name: string | null;
  address: string | null;
  osm_id: number | null;
  clerk_user_id: string | null;
}

type ClaimStep =
  | "loading"
  | "ready"
  | "submitting"
  | "success"
  | "error"
  | "not-found";

export default function ClaimFarmPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabaseWithClerk();

  const [farm, setFarm] = useState<FarmInfo | null>(null);
  const [step, setStep] = useState<ClaimStep>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const idParam = params?.id;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!idParam || typeof idParam !== "string") {
        if (!cancelled) setStep("not-found");
        return;
      }

      const parsedId = parseInt(idParam, 10);
      if (Number.isNaN(parsedId)) {
        if (!cancelled) setStep("not-found");
        return;
      }

      const { data, error } = await supabase
        .from("listing")
        .select("id, name, address, osm_id, clerk_user_id")
        .eq("id", parsedId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        setStep("not-found");
        return;
      }

      if (!data.osm_id) {
        router.replace(`/farm/${parsedId}`);
        return;
      }

      if (data.clerk_user_id) {
        setErrorMsg("Cette ferme a déjà été revendiquée.");
        setStep("error");
        return;
      }

      setFarm(data as FarmInfo);
      setStep("ready");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [idParam, supabase, router]);

  const handleClaim = async () => {
    if (!farm) return;

    if (!isUserLoaded || !user) {
      router.push(`/sign-in?redirect_url=/farm/${farm.id}/claim`);
      return;
    }

    setStep("submitting");

    try {
      const res = await fetch("/api/claim-farm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: farm.id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message ?? "Une erreur est survenue.");
        setStep("error");
        return;
      }

      setStep("success");
    } catch (err) {
      console.error("[CLAIM] Erreur réseau:", err);
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
      setStep("error");
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (step === "not-found") {
    notFound();
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="pb-2">
            <CheckCircle className="h-14 w-14 text-green-600 mx-auto mb-2" />
            <CardTitle>Ferme revendiquée !</CardTitle>
            <CardDescription>
              Votre ferme est maintenant liée à votre compte. Vous pouvez
              compléter votre fiche producteur depuis votre tableau de bord.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild>
              <Link href="/dashboard">Mon tableau de bord</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/farm/${farm?.id}`}>Voir ma fiche ferme</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="text-4xl mb-2">⚠️</div>
            <CardTitle className="text-xl">Impossible de revendiquer</CardTitle>
            <CardDescription>{errorMsg}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/explore">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour à la carte
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 mb-2 text-muted-foreground">
            <Link href={`/farm/${farm?.id}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voir la fiche ferme
            </Link>
          </Button>
          <Badge
            variant="warning"
            size="sm"
            icon={<MapPin className="h-3 w-3" />}
            className="w-fit mb-1"
          >
            Ferme pré-enregistrée OSM
          </Badge>
          <CardTitle>C&apos;est votre ferme ?</CardTitle>
          <CardDescription>
            Revendiquez cette fiche pour la gérer et la compléter.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/50 p-4 space-y-1">
            <p className="font-semibold text-foreground text-lg">
              {farm?.name ?? "Ferme sans nom"}
            </p>
            {farm?.address && (
              <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                {farm.address}
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Ce que cette action fait :
            </p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Lie votre compte à cette fiche ferme</li>
              <li>Vous donne accès à un tableau de bord producteur</li>
              <li>Vous permet de compléter et publier votre fiche</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          {!isUserLoaded || !user ? (
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href={`/sign-in?redirect_url=/farm/${farm?.id}/claim`}>
                Connexion pour revendiquer
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleClaim}
              disabled={step === "submitting"}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {step === "submitting" && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Revendiquer cette ferme
            </Button>
          )}
          <p className="text-xs text-muted-foreground text-center">
            La ferme ne sera pas publiée automatiquement — vous devrez
            l&apos;activer depuis votre tableau de bord.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
