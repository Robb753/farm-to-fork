import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { CoordinateProvider } from "./contexts/CoordinateContext";
import Footer from "./_components/Footer"; // Importer le Footer

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Farm To Fork",
  description: "The best way to connect local producers",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Toaster />
          <CoordinateProvider>
            <Provider>{children}</Provider>
            <Footer /> {/* Ajouter le Footer ici */}
          </CoordinateProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
