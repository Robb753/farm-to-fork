"use client";

import Link from "next/link";
import {
  Mail,
  Instagram,
  Linkedin,
  X as TwitterX,
  MessageCircle,
} from "@/utils/icons";
import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8">
          {/* Bloc 1 - Farm To Fork */}
          <div>
            <h3 className="text-xl font-serif font-bold mb-4">Farm To Fork</h3>
            <p className="text-gray-400">
              Connecter les producteurs locaux aux consommateurs à travers
              l'Europe.
            </p>
          </div>

          {/* Bloc 2 - Découvrir */}
          <div>
            <h4 className="text-lg font-medium mb-4">
              <Link
                href="/discover"
                className="hover:text-white transition-colors"
              >
                Découvrir
              </Link>
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/discover/producteurs"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Producteurs
                </Link>
              </li>
              <li>
                <Link
                  href="/discover/produits"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Produits
                </Link>
              </li>
              <li>
                <Link
                  href="/discover/marches"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Marchés
                </Link>
              </li>
            </ul>
          </div>

          {/* Bloc 3 - À Propos */}
          <div>
            <h4 className="text-lg font-medium mb-4">
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                À Propos
              </Link>
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about/missions"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Notre Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/about/how"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link
                  href="/about/durability"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Durabilité
                </Link>
              </li>
            </ul>
          </div>

          {/* Bloc 4 - Contact */}
          <div>
            <h4 className="text-lg font-medium mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a
                  href="mailto:info@farmtofork.fr"
                  className="hover:text-white"
                >
                  info@farmtofork.fr
                </a>
              </li>
            </ul>

            {/* Réseaux sociaux */}
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition transform hover:scale-110"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition transform hover:scale-110"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition transform hover:scale-110"
              >
                <TwitterX className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer bas */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm gap-4 text-center">
          <p>
            © {new Date().getFullYear()} Farm To Fork. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/feedback"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Donnez votre avis
            </Link>
            <Link
              href="/legal/mentions-legales"
              className="hover:text-white transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="/legal/privacy-policy"
              className="hover:text-white transition-colors"
            >
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
