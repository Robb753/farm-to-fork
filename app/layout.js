import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { CoordinateProvider } from "./contexts/CoordinateContext";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";
import { MapListingProvider } from "./contexts/MapListingContext";
import { LanguageProvider } from "./contexts/Language-context";
import { FiltersProvider } from "./contexts/FiltersContext";
import Script from "next/script";
import Footer from "./_components/layout/Footer";
import ClientModalWrapper from "./_components/ui/ClientModalWrapper";
import UserSyncProvider from "./_components/UserSyncProvider"; // Nouveau composant

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Farm To Fork",
  description: "Connectez-vous directement aux producteurs locaux",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charSet="UTF-8" />
          <link rel="icon" href="/favicon.ico" />
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-NCRFL8R7');`,
            }}
          />
        </head>
        <body className={inter.className}>
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-NCRFL8R7"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>

          {/* Nouveau UserSyncProvider qui remplace les 3 composants précédents */}
          <UserSyncProvider>
            {/* Composants d'interface utilisateur */}
            <Toaster />
            <ClientModalWrapper />

            {/* Providers pour le contexte de l'application */}
            <FiltersProvider>
              <LanguageProvider>
                <CoordinateProvider>
                  <GoogleMapsProvider>
                    <MapListingProvider>
                      <Provider>
                        {/* Contenu principal */}
                        <main className="min-h-screen">{children}</main>
                        <Footer />
                      </Provider>
                    </MapListingProvider>
                  </GoogleMapsProvider>
                </CoordinateProvider>
              </LanguageProvider>
            </FiltersProvider>
          </UserSyncProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
