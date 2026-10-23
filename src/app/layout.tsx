import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

// §4.1 — Police principale : Inter ; technique : JetBrains Mono (identifiants, références)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// URL publique du site (Vercel fournit VERCEL_URL ; remplaçable par NEXT_PUBLIC_SITE_URL)
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Albatros Protect — Protéger. Localiser. Récupérer.",
  description:
    "Plateforme béninoise de protection, de recherche et de récupération d'appareils (pilote Parakou) : préparez vos appareils avant l'incident, signalez une perte ou un vol, consultez les observations disponibles avec leur source, leur heure et leur précision réelle.",
  keywords: [
    "Albatros Protect",
    "Bénin",
    "Parakou",
    "appareil perdu",
    "vol téléphone",
    "IMEI",
    "récupération",
  ],
  // Favicons générés par RealFaviconGenerator depuis le logo officiel
  // (bouclier GPS + albatros) — fichiers dans public/
  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Albatros Protect",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "Albatros Protect",
    locale: "fr_FR",
    url: "/",
    title: "Albatros Protect — Protéger. Localiser. Récupérer.",
    description:
      "Déclarez un appareil perdu ou volé, suivez les observations réelles et les démarches vers opérateurs et autorités (Bénin, pilote Parakou).",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Albatros Protect — albatros en vol devant un bouclier GPS, rouge et noir",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Albatros Protect — Protéger. Localiser. Récupérer.",
    description:
      "Plateforme béninoise de protection et de récupération d'appareils (pilote Parakou).",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {/* §2.3 — modes clair et sombre obligatoires, adaptés séparément */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
