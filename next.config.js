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
    minimumCacheTTL: 60 * 60 * 24 * 365,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Rewrites ---------------------------------------------------------------
  async rewrites() {
    return [];
  },

  // Redirections -----------------------------------------------------------
  async redirects() {
    return [
      {
        source: "/view-listing/:id",
        destination: "/farm/:id",
        permanent: true,
      },
      {
        source: "/view-listing/:id/boutique",
        destination: "/farm/:id/shop",
        permanent: true,
      },
      {
        source: "/view-listing/:id/panier",
        destination: "/farm/:id/cart",
        permanent: true,
      },
      {
        source: "/shop/:farmId",
        destination: "/farm/:farmId",
        permanent: true,
      },
      {
        source: "/shop/:farmId/boutique",
        destination: "/farm/:farmId/shop",
        permanent: true,
      },
      {
        source: "/shop/:farmId/panier",
        destination: "/farm/:farmId/cart",
        permanent: true,
      },
      {
        source: "/shop/commande/:orderId",
        destination: "/order/:orderId/confirmation",
        permanent: true,
      },
      {
        source: "/shop/ma-commande/:orderId",
        destination: "/order/:orderId",
        permanent: true,
      },
      {
        source: "/producteurs",
        destination: "/discover/producteurs",
        permanent: true,
      },
      {
        source: "/factor-one",
        destination: "/sign-in",
        permanent: false,
      },
    ];
  },

  // Next.js 15 -------------------------------------------------------------
  serverExternalPackages: ["@supabase/supabase-js"],

  // Experimental -----------------------------------------------------------
  experimental: {
    // Partial Prerendering: stream a static shell immediately while dynamic
    // content (listings, map data) is fetched. Enable per-route with:
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
    ],
  },

  // Global -----------------------------------------------------------------
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Headers de sécurité ----------------------------------------------------
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://*.clerk.com",
      "https://*.clerk.accounts.dev",
    ].join(" ");

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      [
        "connect-src 'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://api.clerk.com",
        "https://*.clerk.com",
        "https://*.clerk.accounts.dev",
        "https://clerk-telemetry.com",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://*.tiles.mapbox.com",
      ].join(" "),
      [
        "img-src 'self' data: blob:",
        "https://img.clerk.com",
        "https://images.clerk.dev",
        "https://reukdkgdlvgdvyuwuaub.supabase.co",
        "https://lh3.googleusercontent.com",
        "https://*.ggpht.com",
      ].join(" "),
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
// Export principal --------------------------------------------------------
// -------------------------------------------------------------------------
module.exports = (phase) => {
  const isProdBuild = phase === PHASE_PRODUCTION_BUILD;

  return withBundleAnalyzer({
    ...baseConfig,

    webpack(config, { isServer }) {
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
              mapbox: {
                test: /[\\/]node_modules[\\/](mapbox-gl)[\\/]/,
                name: "mapbox",
                priority: 35,
                chunks: "all",
                reuseExistingChunk: true,
              },
            },
          },
        };
      }

      config.resolve.alias = {
        ...config.resolve.alias,
        react$: require.resolve("react"),
        "react-dom$": require.resolve("react-dom"),
        "react/jsx-runtime$": require.resolve("react/jsx-runtime"),
      };

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
