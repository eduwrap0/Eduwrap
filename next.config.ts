import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  async redirects() {
    return [
      { source: "/index", destination: "/", permanent: true },
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/courses/generative-ai", destination: "/courses/artificial-intelligence-machine-learning", permanent: true },
      { source: "/courses/advanced-computer", destination: "/courses/basic-computer-course", permanent: true },
      { source: "/courses/diploma-in-computer-application-dca", destination: "/courses/basic-computer-course", permanent: true },
      { source: "/:path*.php", destination: "/:path*", permanent: true },
      { source: "/:slug-course", destination: "/courses/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
