/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // LiteAPI hotel images
      { protocol: "https", hostname: "**.liteapi.travel" },
      { protocol: "https", hostname: "**.hotelbeds.com" },
      { protocol: "https", hostname: "photos.hotelbeds.com" },
      { protocol: "https", hostname: "**.expedia.com" },
      { protocol: "https", hostname: "**.priceline.com" },
    ],
    unoptimized: false,
  },
  eslint: {
    // Warnings don't fail production builds — only errors do
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
