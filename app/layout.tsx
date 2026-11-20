import type { Metadata, Viewport } from "next";
import { Gelasio, Carlito } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const gelasio = Gelasio({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--fonte-gelasio" });
const carlito = Carlito({ subsets: ["latin"], weight: ["400", "700"], variable: "--fonte-carlito" });

export const metadata: Metadata = {
  title: { default: "Planejamento Estratégico 2027 | CEP", template: "%s · Planejamento Estratégico 2027 | CEP" },
  description: "Planejamento estratégico da advocacia patrimonial — Clube da Estratégia Patrimonial.",
  robots: { index: false },
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#0b0b0d" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const grande = (await cookies()).get("cep-fonte")?.value === "1";
  return (
    <html lang="pt-BR" className={`${gelasio.variable} ${carlito.variable}${grande ? " grande" : ""}`}>
      <body>{children}</body>
    </html>
  );
}
