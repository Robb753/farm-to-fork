"use client";

import { useTranslation } from "@/lib/store/settingsStore";
import Link from "next/link";
import React from "react";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * ExploreNearby corrigé avec espacement forcé et fallbacks CSS
 */
function ExploreNearby(): JSX.Element {
  const t = useTranslation();

  const cards = [
    {
      title: "Marchés",
      description: "Découvrez les marchés et les événements saisonniers près de chez vous.",
      badge: "À la une",
      badgeColor: "text-teal-600",
      link: "/discover/marches",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      title: "Produits",
      description: "Les meilleurs produits de votre région, directement du producteur.",
      badge: "Populaire",
      badgeColor: "text-rose-600",
      link: "/discover/produits",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6"
          />
        </svg>
      ),
    },
    {
      title: "Producteurs",
      description: "Rencontrez les agriculteurs passionnés près de chez vous.",
      badge: "Nouveau",
      badgeColor: "text-amber-600",
      link: "/discover/producteurs",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      title: "Ateliers & Dégustations",
      description: "Participez à des ateliers culinaires et des dégustations de produits locaux.",
      badge: "Événements",
      badgeColor: "text-indigo-600",
      link: PATHS.LISTINGS,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section 
      className="px-4 py-16 md:px-8 max-w-7xl mx-auto"
      style={{
        padding: '4rem 1rem',
        maxWidth: '80rem',
        margin: '0 auto',
      }}
    >
      {/* Titre avec design amélioré */}
      <div className="text-center mb-12" style={{ marginBottom: '3rem' }}>
        <h2 
          className="text-4xl font-serif font-bold mb-4 relative inline-block"
          style={{ 
            color: COLORS.TEXT_PRIMARY,
            fontSize: '2.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}
        >
          {t("explore")}
          <div 
            className="absolute -bottom-2 left-0 w-full h-1 rounded-full"
            style={{
              position: 'absolute',
              bottom: '-0.5rem',
              left: '0',
              width: '100%',
              height: '0.25rem',
              borderRadius: '9999px',
              background: `linear-gradient(to right, ${COLORS.PRIMARY}, ${COLORS.SUCCESS})`,
            }}
          />
        </h2>
        <p 
          className="text-lg max-w-2xl mx-auto"
          style={{ 
            color: COLORS.TEXT_SECONDARY,
            fontSize: '1.125rem',
            maxWidth: '42rem',
            margin: '0 auto',
          }}
        >
          Explorez toutes les richesses de votre région et connectez-vous avec les producteurs locaux
        </p>
      </div>

      {/* Grid des cartes avec ESPACEMENT FORCÉ */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: '1.5rem',
          margin: '2rem 0',
        }}
        data-cards-grid="4-cols"
      >
        {/* CSS responsive intégré */}
        <style jsx>{`
          @media (min-width: 768px) {
            [data-cards-grid="4-cols"] {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (min-width: 1024px) {
            [data-cards-grid="4-cols"] {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
        `}</style>

        {cards.map((card, index) => (
          <div 
            key={index}
            className="relative"
            style={{
              margin: '0.75rem',
              padding: '0.5rem',
            }}
          >
            <Link 
              href={card.link} 
              className="group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-3xl block"
            >
              <div 
                className="relative overflow-hidden rounded-3xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-72 flex flex-col justify-between p-6 md:p-8"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.BG_GRAY} 0%, #EAEAEA 100%)`,
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  height: '18rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '2rem',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-0.25rem)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Badge en haut avec icône */}
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {card.icon && (
                    <div 
                      className="p-2 rounded-full"
                      style={{ 
                        backgroundColor: `${COLORS.PRIMARY}20`,
                        padding: '0.5rem',
                        borderRadius: '50%',
                      }}
                    >
                      <div style={{ color: COLORS.PRIMARY }}>
                        {card.icon}
                      </div>
                    </div>
                  )}
                  <div 
                    className="px-3 py-1 text-xs font-semibold rounded-full shadow-md uppercase tracking-wide select-none bg-white bg-opacity-20 backdrop-blur-sm"
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <span className={card.badgeColor}>{card.badge}</span>
                  </div>
                </div>

                {/* Contenu principal */}
                <div className="mt-12" style={{ marginTop: '3rem' }}>
                  <h3 
                    className="text-2xl md:text-3xl font-medium mb-2"
                    style={{ 
                      color: COLORS.TEXT_PRIMARY,
                      fontSize: '1.875rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {card.title}
                  </h3>
                  <p 
                    className="text-sm md:text-base"
                    style={{ 
                      color: COLORS.TEXT_SECONDARY,
                      fontSize: '1rem',
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                {/* Bouton Découvrir aligné en bas */}
                <div 
                  className="mt-auto px-5 py-2 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center gap-2 text-sm group-hover:gap-3 group-hover:shadow-md"
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    color: COLORS.BG_WHITE,
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    marginTop: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
                    e.currentTarget.style.gap = '0.75rem';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                    e.currentTarget.style.gap = '0.5rem';
                  }}
                >
                  Découvrir
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{
                      width: '1rem',
                      height: '1rem',
                      transition: 'transform 0.3s ease',
                    }}
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
            </Link>
          </div>
        ))}
      </div>

      {/* Section call-to-action */}
      <div 
        className="mt-16 text-center"
        style={{ 
          marginTop: '4rem',
          textAlign: 'center',
        }}
      >
        <div 
          className="max-w-2xl mx-auto p-8 rounded-2xl border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
            maxWidth: '42rem',
            margin: '0 auto',
            padding: '2rem',
            borderRadius: '1rem',
            border: `1px solid ${COLORS.PRIMARY}33`,
          }}
        >
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ 
              color: COLORS.PRIMARY,
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
            }}
          >
            🗺️ Prêt à explorer votre région ?
          </h3>
          <p 
            className="mb-6"
            style={{ 
              color: COLORS.TEXT_SECONDARY,
              marginBottom: '1.5rem',
            }}
          >
            Utilisez notre carte interactive pour découvrir tous les producteurs et points de vente autour de vous.
          </p>
          <Link 
            href={PATHS.LISTINGS}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Voir la carte complète
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ExploreNearby;