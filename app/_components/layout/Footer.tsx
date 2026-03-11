"use client";

import Link from "next/link";
import React from "react";
import {
  Mail,
  Instagram,
  Linkedin,
  X as TwitterX,
  MessageCircle,
} from "@/utils/icons";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour le Footer
 */
interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

interface SocialLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface FooterSectionProps {
  title: string;
  titleHref?: string;
  children: React.ReactNode;
}

/**
 * Composant de lien de footer avec styles cohérents
 */
const FooterLink: React.FC<FooterLinkProps> = ({ 
  href, 
  children, 
  className = "",
  external = false 
}) => {
  const linkProps = external ? {
    target: "_blank" as const,
    rel: "noopener noreferrer" as const,
  } : {};

  return (
    <Link
      href={href}
      className={`transition-colors hover:text-white ${className}`}
      {...linkProps}
    >
      {children}
    </Link>
  );
};

/**
 * Composant de lien social avec icône
 */
const SocialLink: React.FC<SocialLinkProps> = ({ href, icon: Icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="transition-all duration-200 transform hover:scale-110 hover:text-white"
    style={{ color: COLORS.TEXT_MUTED }}
    aria-label={label}
  >
    <Icon className="w-6 h-6" />
  </a>
);

/**
 * Composant de section de footer avec titre
 */
const FooterSection: React.FC<FooterSectionProps> = ({ 
  title, 
  titleHref, 
  children 
}) => (
  <div>
    <h4 className="text-lg font-medium mb-4">
      {titleHref ? (
        <FooterLink href={titleHref}>
          {title}
        </FooterLink>
      ) : (
        title
      )}
    </h4>
    {children}
  </div>
);

/**
 * Configuration des liens sociaux
 */
const SOCIAL_LINKS: SocialLinkProps[] = [
  {
    href: "https://www.linkedin.com/company/farmtofork",
    icon: Linkedin,
    label: "Suivez-nous sur LinkedIn",
  },
  {
    href: "https://www.instagram.com/farmtofork.fr",
    icon: Instagram,
    label: "Suivez-nous sur Instagram",
  },
  {
    href: "https://twitter.com/farmtofork_fr",
    icon: TwitterX,
    label: "Suivez-nous sur Twitter/X",
  },
];

/**
 * Configuration des liens de navigation
 */
const FOOTER_SECTIONS = {
  discover: {
    title: "Découvrir",
    href: "/discover",
    links: [
      { href: "/discover/producteurs", label: "Producteurs" },
      { href: "/discover/produits", label: "Produits" },
      { href: "/discover/marches", label: "Marchés" },
    ],
  },
  about: {
    title: "À Propos",
    href: "/about",
    links: [
      { href: "/about/missions", label: "Notre Mission" },
      { href: "/about/how", label: "Comment ça marche" },
      { href: "/about/durability", label: "Durabilité" },
    ],
  },
} as const;

/**
 * Composant Footer principal de Farm To Fork
 * 
 * Features:
 * - Navigation structurée par sections
 * - Liens sociaux avec accessibilité
 * - Design system intégré avec COLORS
 * - Responsive design mobile-first
 * - Accessibilité ARIA complète
 * - Liens externes sécurisés
 * - Animation des interactions
 * - Copyright dynamique
 * 
 * @returns Composant Footer complet
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="py-12"
      style={{ 
        backgroundColor: COLORS.BG_DARK || "#111827",
        color: COLORS.TEXT_WHITE || "#ffffff"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Navigation principale */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8">
          
          {/* Section marque */}
          <div>
            <h3 
              className="text-xl font-serif font-bold mb-4"
              style={{ color: COLORS.TEXT_WHITE }}
            >
              Farm To Fork
            </h3>
            <p 
              className="leading-relaxed"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              Connecter les producteurs locaux aux consommateurs à travers
              l'Europe pour une alimentation plus durable et transparente.
            </p>
          </div>

          {/* Section Découvrir */}
          <FooterSection 
            title={FOOTER_SECTIONS.discover.title}
            titleHref={FOOTER_SECTIONS.discover.href}
          >
            <ul className="space-y-2">
              {FOOTER_SECTIONS.discover.links.map((link) => (
                <li key={link.href}>
                  <FooterLink 
                    href={link.href}
                    className="text-gray-400"
                  >
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </FooterSection>

          {/* Section À Propos */}
          <FooterSection 
            title={FOOTER_SECTIONS.about.title}
            titleHref={FOOTER_SECTIONS.about.href}
          >
            <ul className="space-y-2">
              {FOOTER_SECTIONS.about.links.map((link) => (
                <li key={link.href}>
                  <FooterLink 
                    href={link.href}
                    className="text-gray-400"
                  >
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </FooterSection>

          {/* Section Contact */}
          <div>
            <h4 className="text-lg font-medium mb-4">Contact</h4>
            
            {/* Email de contact */}
            <div className="mb-6">
              <div 
                className="flex items-center gap-2"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a
                  href="mailto:info@farmtofork.fr"
                  className="hover:text-white transition-colors"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  info@farmtofork.fr
                </a>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div>
              <h5 className="text-sm font-medium mb-3">Suivez-nous</h5>
              <div className="flex space-x-4">
                {SOCIAL_LINKS.map((social) => (
                  <SocialLink
                    key={social.href}
                    href={social.href}
                    icon={social.icon}
                    label={social.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer bas avec mentions légales */}
        <div 
          className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-center"
          style={{ 
            borderColor: COLORS.BORDER_DARK || "#374151",
            color: COLORS.TEXT_MUTED 
          }}
        >
          {/* Copyright */}
          <p className="text-sm">
            © {currentYear} Farm To Fork. Tous droits réservés.
          </p>

          {/* Liens légaux */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <FooterLink
              href="/feedback"
              className="flex items-center gap-1 text-gray-400"
            >
              <MessageCircle className="w-4 h-4" />
              Donnez votre avis
            </FooterLink>
            
            <FooterLink
              href="/legal/mentions-legales"
              className="text-gray-400"
            >
              Mentions légales
            </FooterLink>
            
            <FooterLink
              href="/legal/privacy-policy"
              className="text-gray-400"
            >
              Politique de confidentialité
            </FooterLink>
            
            <FooterLink
              href="/legal/cookies"
              className="text-gray-400"
            >
              Gestion des cookies
            </FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;