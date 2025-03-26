/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["reukdkgdlvgdvyuwuaub.supabase.co"], // ✅ Ajout du domaine Supabase
    remotePatterns: [
      {
        protocol: "https",
        hostname: "reukdkgdlvgdvyuwuaub.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com", // ✅ Ajouté ici pour les images Clerk
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev", // 🔁 Si tu utilises aussi clerk.dev
      },
      {
        protocol: "https",
        hostname: "reukdkgdlvgdvyuwuaub.supabase.co", // ✅ Tes images Supabase
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // ✅ Pour les connexions via Google
      },
      {
        protocol: "https",
        hostname: "*.ggpht.com", // ✅ Pour certains profils Google
      },
    ],
  },
};

export default nextConfig;
