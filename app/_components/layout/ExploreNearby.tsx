"use client";

import { useTranslation } from "@/lib/store/settingsStore";
import Link from "next/link";
import React from "react";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/* --------------------------------- */
/* Small reusable card for the grid  */
/* --------------------------------- */
type ExploreCardProps = {
  title: string;
  description: string;
  badge: string;
  badgeColorClass: string; // e.g. "text-teal-600"
  href: string;
  icon?: React.ReactNode;
};

const ExploreCard: React.FC<ExploreCardProps> = ({
  title,
  description,
  badge,
  badgeColorClass,
  href,
  icon,
}) => {
  return (
    <div className="p-3">
      <Link
        href={href}
        className="group block focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-3xl"
        aria-label={`${title} – ${description}`}
      >
        <div
          className={cn(
            "relative h-72 rounded-3xl",
            "flex flex-col justify-between",
            "bg-gradient-to-br from-gray-100 to-gray-200",
            "shadow-md transition-all duration-300",
            "hover:-translate-y-0.5 hover:shadow-lg"
          )}
        >
          {/* Badge + icon */}
          <div className="absolute left-4 top-4 flex items-center gap-2">
            {icon ? (
              <div className="rounded-full p-2 ring-1 ring-emerald-100 bg-white/70 backdrop-blur">
                <div className="text-emerald-600">{icon}</div>
              </div>
            ) : null}

            <div
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide",
                "bg-white/30 backdrop-blur-sm shadow-md"
              )}
            >
              <span className={badgeColorClass}>{badge}</span>
            </div>
          </div>

          {/* Content */}
          <div className="mt-16 px-6 pt-6 md:px-8">
            <h3 className="text-2xl md:text-3xl font-medium text-gray-900 mb-1">
              {title}
            </h3>
            <p className="text-sm md:text-base text-gray-600">{description}</p>
          </div>

          {/* CTA */}
          <div className="mt-auto px-6 pb-6 md:px-8">
            <div
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "rounded-full px-5 py-2 text-sm font-medium",
                "transition-all duration-300 shadow-sm",
                "bg-emerald-600 text-white",
                "group-hover:gap-3 group-hover:shadow-md"
              )}
            >
              <span>Découvrir</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

/* ---------------------------- */
/*            Section           */
/* ---------------------------- */
function ExploreNearby(): JSX.Element {
  const t = useTranslation();

  const cards: ExploreCardProps[] = [
    {
      title: "Marchés",
      description:
        "Découvrez les marchés et les événements saisonniers près de chez vous.",
      badge: "À la une",
      badgeColorClass: "text-teal-600",
      href: "/discover/marches",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      title: "Produits",
      description:
        "Les meilleurs produits de votre région, directement du producteur.",
      badge: "Populaire",
      badgeColorClass: "text-rose-600",
      href: "/discover/produits",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6"
          />
        </svg>
      ),
    },
    {
      title: "Producteurs",
      description:
        "Rencontrez les agriculteurs passionnés près de chez vous.",
      badge: "Nouveau",
      badgeColorClass: "text-amber-600",
      href: "/discover/producteurs",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      title: "Ateliers & Dégustations",
      description:
        "Participez à des ateliers culinaires et des dégustations de produits locaux.",
      badge: "Événements",
      badgeColorClass: "text-indigo-600",
      href: PATHS.LISTINGS,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      {/* Title */}
      <div className="mb-12 text-center">
        <h2 className="relative inline-block font-serif text-4xl font-bold text-gray-900">
          {t("explore")}
          {/* gradient underline using COLORS for exact brand control */}
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-0 h-1 w-full rounded-full"
            style={{
              background: `linear-gradient(to right, ${COLORS.PRIMARY}, ${COLORS.SUCCESS})`,
            }}
          />
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Explorez toutes les richesses de votre région et connectez-vous avec
          les producteurs locaux
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <ExploreCard key={`${c.title}-${i}`} {...c} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <div
          className="mx-auto max-w-2xl rounded-2xl border p-8"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}33`,
          }}
        >
          <h3 className="mb-2 text-xl font-semibold text-emerald-700">
            🗺️ Prêt à explorer votre région ?
          </h3>
          <p className="mb-6 text-gray-600">
            Utilisez notre carte interactive pour découvrir tous les producteurs
            et points de vente autour de vous.
          </p>

          <Link
            href={PATHS.LISTINGS}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
              "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
            )}
          >
            Voir la carte complète
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ExploreNearby;
