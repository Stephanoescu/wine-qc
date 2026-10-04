import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bodega Control | Poka-Yoke",
  description: "Sistema de Control de Calidad y Recepción de Uva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-marine min-h-screen antialiased selection:bg-gold/30 selection:text-marine-dark`}>
        {children}
      </body>
    </html>
  );
}
