import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "ViralRepo.AI — Transformez les repos IA en vidéos virales",
  description:
    "Détectez les dépôts GitHub IA en pleine explosion, générez un script vidéo viral en un clic avec l'IA, et exportez une vidéo verticale prête à publier — voix off, avatar et miniatures inclus.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
