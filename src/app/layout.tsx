import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StickyContactBar } from "@/components/layout/StickyContactBar";
import { contactInfo } from "@/lib/contact";

const montserrat = localFont({
  src: [
    {
      path: "../../Montserrat-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../Montserrat-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

const financialServiceSchema = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  name: "William Leonel | Ethimos Investimentos",
  description:
    "Assessoria de investimentos com atendimento patrimonial, estrutura Ethimos Investimentos e ecossistema BTG Pactual.",
  areaServed: "Sorocaba, SP, Brasil",
  email: contactInfo.email,
  telephone: contactInfo.phoneDisplay,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sorocaba",
    addressRegion: "SP",
    addressCountry: "BR",
  },
  sameAs: [
    "https://www.linkedin.com/in/williamleonel/",
    "https://www.instagram.com/william.leonelf/",
    "https://www.youtube.com/@btgpactual",
  ],
};

export const metadata: Metadata = {
  metadataBase,
  title: "William Leonel | Assessor de Investimentos - Ethimos | BTG Pactual",
  description:
    "Assessoria de investimentos personalizada com a solidez da Ethimos Investimentos e o BTG Pactual. Eleito o melhor escritório do maior banco de investimentos da América Latina. Mais de R$ 4 bilhões sob custódia e 7.000+ clientes.",
  keywords:
    "assessor de investimentos, Ethimos Investimentos, BTG Pactual, planejamento financeiro, investimentos, William Leonel, assessoria financeira, wealth management",
  authors: [{ name: "William Leonel" }],
  openGraph: {
    title: "William Leonel | Assessor de Investimentos - Ethimos | BTG Pactual",
    description:
      "Assessoria de investimentos personalizada. Ethimos: eleito o melhor escritório BTG Pactual 2025.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/images/ethimos_investimentos_logo.png",
        width: 1200,
        height: 630,
        alt: "William Leonel | Ethimos Investimentos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "William Leonel | Assessor de Investimentos - Ethimos | BTG Pactual",
    description:
      "Assessoria de investimentos com foco em clareza patrimonial, estrategia e acompanhamento próximo.",
    images: ["/images/ethimos_investimentos_logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background pb-20 text-foreground xl:pb-0">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{localStorage.setItem('site-theme','light');document.documentElement.dataset.siteTheme='light';}catch(e){document.documentElement.dataset.siteTheme='light';}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(financialServiceSchema) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <StickyContactBar />
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
