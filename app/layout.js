import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import Provider from "./Provider"; // Importez votre composant Provider

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
          <Provider>{children}</Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
