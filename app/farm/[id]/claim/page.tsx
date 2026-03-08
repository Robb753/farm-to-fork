"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, ChevronLeft, Clock } from "lucide-react";
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
  | "pending"
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

      setStep("pending");
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

  if (step === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="pb-2">
            <Clock className="h-14 w-14 text-amber-500 mx-auto mb-2" />
            <CardTitle>Demande soumise !</CardTitle>
            <CardDescription>
              Votre demande de revendication pour{" "}
              <strong>{farm?.name ?? "cette ferme"}</strong> a bien été enregistrée.
              Un administrateur va l&apos;examiner et vous serez notifié par e-mail.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-4">
            <Button asChild variant="outline">
              <Link href={`/farm/${farm?.id}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour à la fiche ferme
              </Link>
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
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-2 text-muted-foreground"
          >
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
            Soumettez une demande de revendication — un administrateur l&apos;examinera
            avant activation.
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
            <p className="font-medium text-foreground">Ce que cette action fait :</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Soumet une demande de revendication à l&apos;équipe</li>
              <li>Après validation, vous accédez à un tableau de bord producteur</li>
              <li>Vous pouvez compléter et publier votre fiche</li>
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
              Soumettre ma demande
            </Button>
          )}
          <p className="text-xs text-muted-foreground text-center">
            La ferme ne sera activée qu&apos;après validation par notre équipe.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
