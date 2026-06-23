import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Acessar o Zeno Cloud",
  description:
    "Acesso ao Zeno Cloud — a plataforma de planejamento financeiro da Ethimos para assessores parceiros. Direto no navegador, sem instalação.",
  robots: { index: false, follow: false },
};

// URL do Zeno Cloud. Default = App Hosting do Firebase. Para mascarar com domínio
// próprio (ex.: app.williamleonel.com.br) — sem custo, é só um subdomínio do
// domínio atual + custom domain no Firebase — defina NEXT_PUBLIC_ZENO_CLOUD_URL
// na Vercel. Trocar aqui não exige redeploy de código.
const ZENO_CLOUD_URL =
  process.env.NEXT_PUBLIC_ZENO_CLOUD_URL ??
  "https://zeno-gsuite--zeno-gsuite.us-east4.hosted.app";

const ZenoMark = ({ size = 80 }: { size?: number }) => (
  <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label="Zeno Cloud">
    <rect width="96" height="96" rx="22" fill="#0A2A5E" />
    <rect x="24" y="58" width="14" height="16" rx="2.5" fill="#FFFFFF" />
    <rect x="44" y="48" width="14" height="26" rx="2.5" fill="#FFFFFF" />
    <rect x="64" y="40" width="14" height="34" rx="2.5" fill="#FFFFFF" />
    <path d="M27 63 H35 M27 68 H35" stroke="#0A2A5E" strokeWidth="1.3" />
    <path d="M47 53 H55 M47 58 H55 M47 63 H55 M47 68 H55" stroke="#0A2A5E" strokeWidth="1.3" />
    <path d="M67 45 H75 M67 50 H75 M67 55 H75 M67 60 H75 M67 65 H75" stroke="#0A2A5E" strokeWidth="1.3" />
    <path
      d="M71 22 Q72.4 27.6 77 28 Q72.4 28.4 71 34 Q69.6 28.4 65 28 Q69.6 27.6 71 22 Z"
      fill="#5AA2F2"
    />
  </svg>
);

export default function AccessPage() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary/70 transition-colors hover:text-brand-primary"
        >
          <ArrowLeft size={16} /> Voltar ao site
        </Link>

        <div className="mt-10 flex flex-col items-center text-center">
          <ZenoMark size={80} />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
            Zeno Cloud
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            O Zeno Light foi descontinuado. O planejamento financeiro agora é no{" "}
            <strong className="text-brand-primary">Zeno Cloud</strong> — direto no
            navegador, sem instalar nada.
          </p>

          <a
            href={ZENO_CLOUD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <ExternalLink size={18} /> Acessar o Zeno Cloud
          </a>
        </div>

        <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-xl border border-brand-primary/10 bg-white px-5 py-4 text-sm text-muted-foreground">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-primary" />
          <p>
            Acesso restrito a parceiros internos da Ethimos (login com e-mail
            autorizado). Funciona em qualquer navegador, em qualquer dispositivo, sem
            instalação.
          </p>
        </div>
      </div>
    </section>
  );
}
