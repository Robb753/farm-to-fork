"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, ChevronLeft, CheckCircle } from "lucide-react";
import { useSupabaseWithClerk } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";

interface FarmInfo {
  id: number;
  name: string | null;
  address: string | null;
  osm_id: number | null;
  clerk_user_id: string | null;
}

type PageState = "loading" | "ready" | "submitting" | "success" | "error" | "not-found";

export default function ClaimFarmPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabaseWithClerk();

  const [farm, setFarm] = useState<FarmInfo | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const idParam = params?.id;

  const loadFarm = useCallback(async () => {
    if (!idParam || typeof idParam !== "string") {
      setPageState("not-found");
      return;
    }
    const parsedId = parseInt(idParam, 10);
    if (isNaN(parsedId)) {
      setPageState("not-found");
      return;
    }

    const { data, error } = await supabase
      .from("listing")
      .select("id, name, address, osm_id, clerk_user_id")
      .eq("id", parsedId)
      .single();

    if (error || !data) {
      setPageState("not-found");
      return;
    }

    if (!data.osm_id) {
      // Pas une ferme OSM → rediriger vers la page normale
      router.replace(`/farm/${parsedId}`);
      return;
    }

    if (data.clerk_user_id) {
      setErrorMsg("Cette ferme a déjà été revendiquée.");
      setPageState("error");
      return;
    }

    setFarm(data as FarmInfo);
    setPageState("ready");
  }, [idParam, supabase, router]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  const handleClaim = async () => {
    if (!farm) return;
    if (!isUserLoaded || !user) {
      router.push(`/sign-in?redirect_url=/farm/${farm.id}/claim`);
      return;
    }

    setPageState("submitting");

    try {
      const res = await fetch("/api/claim-farm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: farm.id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message ?? "Une erreur est survenue.");
        setPageState("error");
        return;
      }

      setPageState("success");
    } catch (err) {
      console.error("[CLAIM] Erreur réseau:", err);
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
      setPageState("error");
    }
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (pageState === "not-found") {
    notFound();
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="h-14 w-14 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Ferme revendiquée !</h1>
          <p className="text-gray-600">
            Votre ferme est maintenant liée à votre compte. Vous pouvez
            compléter votre fiche producteur depuis votre tableau de bord.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              Mon tableau de bord
            </Link>
            <Link
              href={`/farm/${farm?.id}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Voir ma fiche ferme
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900">Impossible de revendiquer</h1>
          <p className="text-gray-600">{errorMsg}</p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour à la carte
          </Link>
        </div>
      </div>
    );
  }

  // pageState === "ready"
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6">
        {/* Retour */}
        <Link
          href={`/farm/${farm?.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voir la fiche ferme
        </Link>

        {/* Titre */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium mb-3">
            <MapPin className="h-3 w-3" />
            Ferme pré-enregistrée OSM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            C&apos;est votre ferme ?
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Revendiquez cette fiche pour la gérer et la compléter.
          </p>
        </div>

        {/* Infos ferme */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
          <p className="font-semibold text-gray-900 text-lg">
            {farm?.name ?? "Ferme sans nom"}
          </p>
          {farm?.address && (
            <p className="text-sm text-gray-500 flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
              {farm.address}
            </p>
          )}
        </div>

        {/* Ce qui se passe */}
        <div className="space-y-2 text-sm text-gray-600">
          <p className="font-medium text-gray-700">Ce que cette action fait :</p>
          <ul className="space-y-1 pl-4 list-disc">
            <li>Lie votre compte à cette fiche ferme</li>
            <li>Vous donne accès à un tableau de bord producteur</li>
            <li>Vous permet de compléter et publier votre fiche</li>
          </ul>
        </div>

        {/* CTA */}
        {!isUserLoaded || !user ? (
          <Link
            href={`/sign-in?redirect_url=/farm/${farm?.id}/claim`}
            className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            Connexion pour revendiquer
          </Link>
        ) : (
          <button
            onClick={handleClaim}
            disabled={pageState === "submitting"}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {pageState === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
            Revendiquer cette ferme
          </button>
        )}

        <p className="text-xs text-gray-400 text-center">
          La ferme ne sera pas publiée automatiquement — vous devrez l&apos;activer
          depuis votre tableau de bord.
        </p>
      </div>
    </div>
  );
}
