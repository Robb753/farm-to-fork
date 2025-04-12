"use client";
import Link from "next/link";
import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif font-bold mb-4">Farm To Fork</h3>
            <p className="text-gray-400">
              Connecter les producteurs locaux aux consommateurs à travers
              l'Europe.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4">Découvrir</h4>
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

          <div>
            <h4 className="text-lg font-medium mb-4">À Propos</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Notre Mission
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Comment ça marche
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Durabilité
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">info@farmtofork.eu</li>
              <li className="text-gray-400">+33 1 23 45 67 89</li>
              <li className="flex space-x-4 mt-4">{/* Social icons... */}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© 2025 Farm To Fork. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
