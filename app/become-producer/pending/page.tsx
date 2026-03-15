"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Sprout, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COLORS } from "@/lib/config";

type RequestStatus = "loading" | "none" | "pending" | "approved" | "rejected";

const POLL_INTERVAL_MS = 30_000;

export default function BecomeProducerPendingPage(): JSX.Element | null {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/onboarding/check-status", {
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.status === 401) {
        router.replace("/sign-in?redirect=/become-producer/pending");
        return;
      }

      const data = await res.json();
      const newStatus: RequestStatus = data.status ?? "none";

      setStatus(newStatus);
      setAdminNote(data.adminNote ?? null);

      // Stop polling once a final state is reached
      if (newStatus === "approved" || newStatus === "rejected") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      if (newStatus === "none") {
        router.replace("/become-producer");
      }
    } catch (err) {
      console.error("[PENDING] Erreur polling:", err);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/sign-in?redirect=/become-producer/pending");
      return;
    }

    // Initial fetch
    fetchStatus();

    // Start polling
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vérification de votre statut...
          </p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  // ── APPROVED ──
  if (status === "approved") {
    return (
      <div
        className="min-h-screen py-12 px-4"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
            style={{ color: COLORS.PRIMARY }}
          >
            <Sprout className="w-6 h-6" />
            <span className="font-semibold text-lg">Farm2Fork</span>
          </Link>

          <Card className="shadow-lg border-2 border-green-200 bg-green-50/50 text-center">
            <CardHeader className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">
                Demande approuvée !
              </CardTitle>
              <CardDescription className="text-base text-green-800">
                Félicitations ! Votre compte producteur est activé. Vous pouvez
                maintenant créer votre fiche ferme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-5 rounded-lg border-2 border-green-200">
                <p className="text-sm text-green-900 mb-4">
                  Un email de confirmation a été envoyé à{" "}
                  <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
                </p>
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 font-semibold"
                  onClick={() => router.push("/dashboard")}
                >
                  Accéder à mon dashboard →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── REJECTED ──
  if (status === "rejected") {
    return (
      <div
        className="min-h-screen py-12 px-4"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
            style={{ color: COLORS.PRIMARY }}
          >
            <Sprout className="w-6 h-6" />
            <span className="font-semibold text-lg">Farm2Fork</span>
          </Link>

          <Card className="shadow-lg border-2 border-red-200 bg-red-50/50 text-center">
            <CardHeader className="space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: `${COLORS.ERROR}20` }}
              >
                <XCircle className="w-10 h-10" style={{ color: COLORS.ERROR }} />
              </div>
              <CardTitle className="text-2xl text-red-900">
                Demande non approuvée
              </CardTitle>
              <CardDescription className="text-base text-red-800">
                Malheureusement, votre demande n&apos;a pas pu être approuvée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminNote && (
                <div className="bg-white p-4 rounded-lg border border-red-200 text-left">
                  <p className="text-sm font-medium text-red-900 mb-1">
                    Message de l&apos;équipe :
                  </p>
                  <p className="text-sm text-red-800">{adminNote}</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => router.push("/become-producer")}
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    color: COLORS.BG_WHITE,
                  }}
                >
                  Soumettre une nouvelle demande
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Retour à l&apos;accueil</Link>
                </Button>
              </div>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                Des questions ?{" "}
                <a
                  href="mailto:support@farm2fork.com"
                  className="hover:underline font-medium"
                  style={{ color: COLORS.PRIMARY }}
                >
                  Contactez-nous
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── PENDING (default) ──
  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
          style={{ color: COLORS.PRIMARY }}
        >
          <Sprout className="w-6 h-6" />
          <span className="font-semibold text-lg">Farm2Fork</span>
        </Link>

        <Card className="shadow-lg border-2 text-center">
          <CardHeader className="space-y-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: COLORS.PRIMARY_BG }}
            >
              <Clock className="w-10 h-10" style={{ color: COLORS.PRIMARY }} />
            </div>
            <CardTitle className="text-2xl">
              Demande en cours d&apos;examen
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Nous vérifions votre profil producteur. Vous recevrez un email
              de confirmation sous 24-48h.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              className="p-4 rounded-lg text-left"
              style={{ backgroundColor: COLORS.BG_GRAY }}
            >
              <p
                className="text-sm font-medium mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Email surveillé :
              </p>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Pensez à vérifier vos spams.
              </p>
            </div>

            <Button size="lg" className="w-full" asChild>
              <Link href="/explore">Explorer les fermes en attendant</Link>
            </Button>

            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Des questions ?{" "}
              <a
                href="mailto:support@farm2fork.com"
                className="hover:underline font-medium"
                style={{ color: COLORS.PRIMARY }}
              >
                Contactez-nous
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
