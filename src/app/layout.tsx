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

export const metadata: Metadata = {
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
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
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
