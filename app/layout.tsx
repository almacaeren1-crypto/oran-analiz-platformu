import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oran Analiz Platformu",
  description: "Futbol oran ve maç analiz platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
