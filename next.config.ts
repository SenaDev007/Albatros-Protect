import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" est requis par le build de la plateforme locale ; Vercel
  // ignore simplement cette option (son runtime gère sa propre sortie).
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["preview-chat-718aa619-443a-42a2-9974-3bce334a1f0e.space-z.ai", "*.space-z.ai"],
  // Vercel : embarquer la base SQLite de démarrage (db/custom.db) dans les
  // fonctions serverless. Au premier démarrage de chaque instance, elle est
  // copiée vers /tmp (seul répertoire inscriptible) — voir src/lib/db.ts.
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
};

export default nextConfig;
