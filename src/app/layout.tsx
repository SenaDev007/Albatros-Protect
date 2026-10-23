import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Albatros — Retrouvez vos appareils perdus ou volés",
  description:
    "Service béninois de recherche et de récupération d'appareils (pilote Cotonou) : enregistrez vos appareils, signalez une perte ou un vol, suivez vos démarches. Localisation honnête : chaque position affiche sa source, son heure et sa précision.",
  keywords: [
    "Agent Albatros",
    "Bénin",
    "Cotonou",
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
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
