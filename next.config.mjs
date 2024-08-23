/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "reukdkgdlvgdvyuwuaub.supabase.co",
        pathname: "/**", // Permet toutes les images sous ce domaine
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**", // Permet toutes les images sous ce domaine
      },
    ],
  },
};

export default nextConfig;
