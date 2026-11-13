import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 👈 NUEVO: Configuración de SEO para toda la app
export const metadata: Metadata = {
  title: {
    default: "Conecta | Encontrá trabajadores y oficios en Uruguay",
    template: "%s | Conecta" // Si una página tiene su propio título, se le agrega "| Conecta" al final
  },
  description: "La plataforma que conecta trabajadores con empleadores en Uruguay. Publicá tu demanda o encontrá al profesional que necesitás: plomeros, electricistas, diseñadores y más.",
  keywords: ["trabajo", "empleo", "oficios", "Uruguay", "Montevideo", "plomero", "electricista", "marketplace", "trabajadores"],
  authors: [{ name: "Conecta" }],
  creator: "Conecta",
  // Configuración para cuando compartes el link en WhatsApp / Redes
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: "https://conecta.uy", // (Cuando tengas el dominio real, cambialo acá)
    title: "Conecta | Trabajos y Oficios en Uruguay",
    description: "Encontrá al profesional que necesitás o publicá tu demanda. Conectamos trabajadores con empleadores de forma rápida y segura.",
    siteName: "Conecta",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conecta | Trabajos y Oficios en Uruguay",
    description: "Encontrá al profesional que necesitás o publicá tu demanda de forma rápida y segura.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-800 min-h-full flex flex-col w-full overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
