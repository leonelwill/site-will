import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Baixar o Zeno Light",
  description:
    "Download do Zeno Light — a plataforma de planejamento financeiro da Ethimos para assessores parceiros. Versões para macOS e Windows.",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

const RELEASES_REPO = "leonelwill/zeno-light-releases";

interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface Release {
  tag_name?: string;
  assets?: ReleaseAsset[];
}

async function getLatestRelease(): Promise<Release | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as Release;
  } catch {
    return null;
  }
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

const ZenoLightMark = ({ size = 72 }: { size?: number }) => (
  <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label="Zeno Light">
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

const AppleIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const WindowsIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699m10.949-7.6H24V24l-12.9-1.801" />
  </svg>
);

export default async function DownloadPage() {
  const release = await getLatestRelease();
  const assets = release?.assets ?? [];
  const mac = assets.find((a) => a.name.endsWith(".dmg"));
  const win =
    assets.find((a) => a.name.endsWith("-setup.exe")) ??
    assets.find((a) => a.name.endsWith(".msi"));
  const version = release?.tag_name?.replace("zeno-light-v", "") ?? "";
  const releasesUrl = `https://github.com/${RELEASES_REPO}/releases/latest`;

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary/70 transition-colors hover:text-brand-primary"
        >
          <ArrowLeft size={16} /> Voltar ao site
        </Link>

        <div className="mt-10 flex flex-col items-center text-center">
          <ZenoLightMark size={80} />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
            Zeno Light
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Uma plataforma de planejamento financeiro em testes para utilizar no seu
            computador. Escolha o seu sistema para baixar.
          </p>
          {version ? (
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/10 bg-white/90 px-4 py-1.5 text-sm font-medium text-brand-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-brand-gold" /> Versão {version}
            </span>
          ) : null}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <DownloadCard
            os="mac"
            title="macOS"
            subtitle="Apple Silicon (M1 ou mais novo)"
            url={mac?.browser_download_url ?? releasesUrl}
            size={formatSize(mac?.size)}
            firstRun="1ª abertura: botão-direito no app → Abrir."
          />
          <DownloadCard
            os="windows"
            title="Windows"
            subtitle="Windows 10/11 (64 bits)"
            url={win?.browser_download_url ?? releasesUrl}
            size={formatSize(win?.size)}
            firstRun='1ª abertura: "Mais informações" → "Executar assim mesmo".'
          />
        </div>

        {!mac && !win ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não consegui carregar os instaladores agora.{" "}
            <a href={releasesUrl} className="font-medium text-brand-primary underline">
              Abrir a página de releases
            </a>
            .
          </p>
        ) : null}

        <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-xl border border-brand-primary/10 bg-white px-5 py-4 text-sm text-muted-foreground">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-primary" />
          <p>
            O app ainda não é assinado pela Apple/Microsoft, então na primeira vez o
            sistema pede uma confirmação (instruções em cada cartão). Atualizações
            chegam sozinhas dentro do app. Uso restrito a parceiros internos da Ethimos.
          </p>
        </div>
      </div>
    </section>
  );
}

function DownloadCard({
  os,
  title,
  subtitle,
  url,
  size,
  firstRun,
}: {
  os: "mac" | "windows";
  title: string;
  subtitle: string;
  url: string;
  size: string;
  firstRun: string;
}) {
  const Icon = os === "mac" ? AppleIcon : WindowsIcon;
  return (
    <div className="flex flex-col rounded-2xl border border-brand-primary/10 bg-white p-7 shadow-sm shadow-brand-primary/5 transition-shadow hover:shadow-md hover:shadow-brand-primary/10">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-primary/5 text-brand-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-brand-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <a
        href={url}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        <Download size={18} /> Baixar para {title}
        {size ? <span className="font-normal text-white/60">· {size}</span> : null}
      </a>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{firstRun}</p>
    </div>
  );
}
