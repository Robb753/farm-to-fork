// app/layout.jsx
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import Script from "next/script";
import Provider from "./Provider";
import AppLoadingNotifier from "@/utils/AppLoadingNotifier";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Farm To Fork",
  description: "Connectez-vous directement aux producteurs locaux",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          {/* Script GTM dans body */}
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

          {/* Noscript pour GTM */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-NCRFL8R7"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>

          <Provider>
            <AppLoadingNotifier />
            {children}
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
