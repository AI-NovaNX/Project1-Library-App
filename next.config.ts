import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "library-backend-production-b9cf.up.railway.app",
      },
      {
        protocol: "https",
        hostname: "image.gramedia.net",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "otimages.com",
      },
    ],
  },
};

export default nextConfig;
