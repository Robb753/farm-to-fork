import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ClientLayout from "./ClientLayout";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

/** Props du layout */
interface RootLayoutProps {
  children: React.ReactNode;
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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
        variables: {
          colorPrimary: "#16a34a",
          colorText: "#111827",
          colorTextSecondary: "#6b7280",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#111827",
          borderRadius: "0.75rem",
          fontFamily: "inherit",
        },
        elements: {
          card: "shadow-sm border border-gray-100 rounded-2xl",
          headerTitle: "text-xl font-semibold text-gray-900",
          headerSubtitle: "text-sm text-gray-500",
          socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 rounded-xl",
          formButtonPrimary: "bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium",
          formFieldInput: "border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500",
          footerActionLink: "text-green-600 hover:text-green-700 font-medium",
          identityPreviewEditButton: "text-green-600 hover:text-green-700",
        },
      }}
      localization={{ locale: "fr-FR" }}
    >
      <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </head>

        <body
          className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}
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

        {/* Google Analytics — lazyOnload defers until page is fully interactive */}
        {process.env.NODE_ENV === "production" &&
          process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                strategy="lazyOnload"
              />
              <Script id="ga-config" strategy="lazyOnload">
                {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
              </Script>
            </>
          )}
      </html>
    </ClerkProvider>
  );
}

export type { RootLayoutProps };
