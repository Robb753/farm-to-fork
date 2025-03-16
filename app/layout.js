import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { CoordinateProvider } from "./contexts/CoordinateContext";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext"; // Importer le GoogleMapsProvider
import { MapListingProvider } from "./contexts/MapListingContext";
import Footer from "./_components/Footer"; // Importer le Footer
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Farm To Fork",
  description: "The best way to connect local producers",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
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
          {/* Noscript pour les navigateurs sans JS */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-NCRFL8R7"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
          <Toaster />
          <CoordinateProvider>
            <GoogleMapsProvider>
              <MapListingProvider>
                <Provider>{children}</Provider>
                <Footer />
              </MapListingProvider>
            </GoogleMapsProvider>
          </CoordinateProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
