const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const baseConfig = {
  // Images -----------------------------------------------------------------
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "reukdkgdlvgdvyuwuaub.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.ggpht.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 an
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ✅ NOUVEAU : Rewrites pour gérer les routes Clerk
  async rewrites() {
    return [
      {
        source: "/sign-in/:path*",
        destination: "/",
      },
      {
        source: "/sign-up/:path*",
        destination: "/",
      },
      // Gestion des routes d'authentification Clerk
      {
        source: "/sso-callback",
        destination: "/",
      },
      {
        source: "/verify",
        destination: "/",
      },
    ];
  },

  // ✅ NOUVEAU : Redirections pour nettoyer les URLs
  async redirects() {
    return [
      // Redirection des anciennes routes avec hash vers les nouvelles
      {
        source: "/factor-one",
        destination: "/sign-in",
        permanent: false,
      },
    ];
  },

  // 🔧 CORRIGÉ : Packages externes pour Next.js 15 -----------------------
  serverExternalPackages: ["@supabase/supabase-js"],

  // Expérimental -----------------------------------------------------------
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-label",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-toast",
      "lucide-react",
      "recharts",
      "framer-motion",
    ],
  },

  // Global -----------------------------------------------------------------
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // 🔧 SUPPRIMÉ : swcMinify est activé par défaut en Next.js 15
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Headers de sécurité ----------------------------------------------------
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/css/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

// -------------------------------------------------------------------------
// Export principal (avec phases et bundle-analyzer) ------------------------
// -------------------------------------------------------------------------
module.exports = (phase) => {
  const isProdBuild = phase === PHASE_PRODUCTION_BUILD;

  return withBundleAnalyzer({
    ...baseConfig,

    // Webpack --------------------------------------------------------------
    webpack(config, { isServer, webpack }) {
      // Optimisations spécifiques au build client de production
      if (isProdBuild && !isServer) {
        config.optimization = {
          ...config.optimization,
          usedExports: true,
          sideEffects: false,
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendors",
                priority: 10,
                reuseExistingChunk: true,
              },
              radixUI: {
                test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                name: "radix-ui",
                priority: 20,
                reuseExistingChunk: true,
              },
              googleMaps: {
                test: /[\\/]node_modules[\\/](@react-google-maps|@googlemaps)[\\/]/,
                name: "google-maps",
                priority: 30,
                reuseExistingChunk: true,
              },
              clerk: {
                test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                name: "clerk",
                priority: 25,
                reuseExistingChunk: true,
              },
              charts: {
                test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
                name: "charts",
                priority: 15,
                reuseExistingChunk: true,
              },
            },
          },
        };
      }

      // Forcer une seule version de React (exactes uniquement)
      config.resolve.alias = {
        ...config.resolve.alias,
        react$: require.resolve("react"),
        "react-dom$": require.resolve("react-dom"),
        "react/jsx-runtime$": require.resolve("react/jsx-runtime"),
      };

      // Supprimer les polyfills inutiles côté client
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          http: false,
          https: false,
          zlib: false,
          path: false,
          os: false,
          querystring: false,
        };
      }

      return config;
    },
  });
};
