import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ClientLayout from "./ClientLayout";
import type { Metadata } from "next";

/** Props du layout */
interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "Farm to Fork",
    template: "%s | Farm to Fork",
  },
  description: "Connecter producteurs et consommateurs locaux 🍃",
  keywords: [
    "agriculture locale",
    "producteurs",
    "consommateurs",
    "alimentation durable",
    "circuits courts",
    "farm to fork",
    "europe",
  ],
  authors: [{ name: "Farm to Fork Team" }],
  creator: "Farm to Fork",
  publisher: "Farm to Fork",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://farmtofork.fr"
  ),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: "Farm to Fork",
    description: "Connecter producteurs et consommateurs locaux 🍃",
    siteName: "Farm to Fork",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Farm to Fork - Agriculture locale et durable",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm to Fork",
    description: "Connecter producteurs et consommateurs locaux 🍃",
    creator: "@farmtofork_fr",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "en-US": "/en",
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: "bg-green-600 hover:bg-green-700",
          socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50",
          footerActionText: "text-gray-600",
          footerActionLink: "text-green-600 hover:text-green-700",
        },
      }}
      localization={{ locale: "fr-FR" }}
    >
      <html lang="fr" suppressHydrationWarning>
        <head>
          <link
            rel="preload"
            href="/fonts/inter-var.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />

          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />

          {/* Google Analytics (safe encoding) */}
          {process.env.NODE_ENV === "production" &&
            process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
                    process.env.NEXT_PUBLIC_GA_ID
                  )}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${encodeURIComponent(
                        process.env.NEXT_PUBLIC_GA_ID
                      )}');
                    `,
                  }}
                />
              </>
            )}
        </head>

        <body
          className="min-h-screen bg-white text-gray-900 antialiased"
          suppressHydrationWarning
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded-md z-50"
          >
            Aller au contenu principal
          </a>

          <ClientLayout>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ClientLayout>

          <div id="modal-root" />
          <div id="tooltip-root" />

          {/* Service Worker */}
          {process.env.NODE_ENV === "production" && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js');
                    });
                  }
                `,
              }}
            />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}

export type { RootLayoutProps };
