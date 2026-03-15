"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ShoppingCart, Sprout, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

export default function WelcomePage(): JSX.Element | null {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    const role = user?.publicMetadata?.role as string | undefined;
    if (role === "farmer") {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: COLORS.PRIMARY }}
        />
      </div>
    );
  }

  if (!isSignedIn) return null;

  const role = user?.publicMetadata?.role as string | undefined;
  if (role === "farmer") return null;

  const handleConsumerClick = () => {
    setIsRedirecting(true);
    router.push("/explore");
  };

  const handleProducerClick = () => {
    setIsRedirecting(true);
    router.push("/become-producer");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
            style={{ color: COLORS.PRIMARY }}
          >
            <Sprout className="w-7 h-7" />
            <span className="font-bold text-xl">Farm2Fork</span>
          </Link>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Bienvenue sur Farm2Fork !
          </h1>
          <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
            Comment souhaitez-vous utiliser la plateforme ?
          </p>
        </div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Consumer card */}
          <button
            onClick={handleConsumerClick}
            disabled={isRedirecting}
            className={cn(
              "group relative flex flex-col items-center text-center p-8 rounded-2xl border-2",
              "transition-all duration-200 cursor-pointer",
              "hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: "#EFF6FF" }}
            >
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Je suis consommateur
            </h2>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Je veux commander des produits locaux directement auprès des
              fermes près de chez moi.
            </p>
            <span
              className={cn(
                "px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200",
                "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {isRedirecting ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : (
                "Commencer"
              )}
            </span>
          </button>

          {/* Producer card */}
          <button
            onClick={handleProducerClick}
            disabled={isRedirecting}
            className={cn(
              "group relative flex flex-col items-center text-center p-8 rounded-2xl border-2",
              "transition-all duration-200 cursor-pointer",
              "hover:shadow-lg hover:-translate-y-0.5",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER;
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: COLORS.PRIMARY_BG }}
            >
              <Sprout
                className="w-8 h-8"
                style={{ color: COLORS.PRIMARY }}
              />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Je suis producteur
            </h2>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Je veux vendre mes produits locaux et connecter directement avec
              des consommateurs engagés.
            </p>
            <span
              className={cn(
                "px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200",
                "text-white"
              )}
              style={{ backgroundColor: COLORS.PRIMARY }}
            >
              {isRedirecting ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : (
                "Devenir producteur"
              )}
            </span>
          </button>
        </div>

        {/* Footer note */}
        <p
          className="text-center text-sm mt-8"
          style={{ color: COLORS.TEXT_MUTED }}
        >
          Vous pouvez toujours changer d&apos;avis plus tard depuis votre profil.
        </p>
      </div>
    </div>
  );
}
