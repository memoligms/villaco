import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/VPS dağıtımı için minimal, bağımsız çalışan sunucu çıktısı (.next/standalone)
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
