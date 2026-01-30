import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ESLint uyarılarını build sırasında dikkate alma
  eslint: {
    ignoreDuringBuilds: true,
  },

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
