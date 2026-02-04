import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,


  // Statik export ayarı (Electron için gerekli)
  output: "export",
  distDir: "build/out",

  // image optimizasyonu
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
    ],
  },

  // Turbopack yapılandırması (Next.js 16+ için boş obje hatayı giderir)
  turbopack: {},

  // Webpack yapılandırması - Dosya izleme optimizasyonu
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/build/**',
          '**/electron/**',
          '**/*.tsbuildinfo',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
