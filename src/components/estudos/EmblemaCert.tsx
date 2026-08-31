import type { CertSlug } from "@/lib/estudos";

/**
 * Emblema da certificação — desenho ORIGINAL, não o selo oficial da ANBIMA/CFP
 * Board (marca de terceiro; reproduzi-la aqui seria uso indevido). Cada uma
 * ganha uma marca geométrica própria, na linguagem do Zeno Concept: escudo de
 * cantos suaves, anel de contorno, sigla em Montserrat e um grafismo que diz o
 * que a prova mede.
 *
 * Tudo em SVG e em `currentColor` + os tokens de cor do escopo `.estudos`:
 * escala sem borrar, acompanha claro/escuro e não pesa nenhum byte de rede.
 */

interface Marca {
  sigla: string;
  /** Uma linha, minúscula — vai sob a sigla dentro do emblema. */
  legenda: string;
  /** Token de cor de identidade (definido em globals.css, escopo .estudos). */
  token: string;
  /** Grafismo interno: o que distingue uma prova da outra. */
  grafismo: "pilares" | "camadas" | "ramos" | "orbita";
}

// A legenda diz o NÍVEL/PAPEL da prova, nunca o nome da entidade certificadora:
// "ANBIMA" dentro de um escudo faria o emblema original parecer o selo oficial
// deles — exatamente o que este desenho existe para evitar.
const MARCAS: Record<CertSlug, Marca> = {
  cpa: { sigla: "CPA", legenda: "Profissional", token: "var(--est-cert-cpa)", grafismo: "pilares" },
  "cpro-i": {
    sigla: "C·Pro",
    legenda: "Iniciante",
    token: "var(--est-cert-cpro-i)",
    grafismo: "camadas",
  },
  "cpro-r": {
    sigla: "C·Pro",
    legenda: "Relacionamento",
    token: "var(--est-cert-cpro-r)",
    grafismo: "ramos",
  },
  cfp: { sigla: "CFP", legenda: "Planejador", token: "var(--est-cert-cfp)", grafismo: "orbita" },
};

/** Grafismos: linhas finas, sempre dentro do escudo (viewBox 0 0 64 72). */
function Grafismo({ tipo }: { tipo: Marca["grafismo"] }) {
  const traco = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const };
  switch (tipo) {
    // CPA — estrutura do sistema financeiro: três pilares sob uma trave.
    case "pilares":
      return (
        <g {...traco} opacity="0.55">
          <path d="M20 21h24" />
          <path d="M23 25v8M32 25v8M41 25v8" />
        </g>
      );
    // C-Pro I — produtos empilhados: camadas de mesma base, larguras diferentes.
    case "camadas":
      return (
        <g {...traco} opacity="0.55">
          <path d="M21 22h22" />
          <path d="M24 27h16" />
          <path d="M27 32h10" />
        </g>
      );
    // C-Pro R — a árvore de decisão que a prova cobra: um nó que se abre em dois.
    case "ramos":
      return (
        <g {...traco} opacity="0.55">
          <path d="M32 20v5" />
          <path d="M32 25c0 4-7 4-7 8" />
          <path d="M32 25c0 4 7 4 7 8" />
          <circle cx="32" cy="19" r="1.8" fill="currentColor" stroke="none" />
        </g>
      );
    // CFP — o plano em torno da pessoa: órbita fechada em volta de um centro.
    case "orbita":
      return (
        <g {...traco} opacity="0.55">
          <ellipse cx="32" cy="26" rx="12" ry="6" />
          <circle cx="32" cy="26" r="2.4" fill="currentColor" stroke="none" />
        </g>
      );
  }
}

export default function EmblemaCert({
  cert,
  size = 64,
  className,
}: {
  cert: CertSlug;
  size?: number;
  className?: string;
}) {
  const marca = MARCAS[cert] ?? MARCAS.cpa;
  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      className={className}
      style={{ color: marca.token }}
      role="img"
      aria-label={`Emblema da certificação ${marca.sigla}`}
    >
      {/* Escudo: fundo tingido da cor da certificação + anel de contorno. */}
      <path
        d="M32 2.5 58.5 12v26.5C58.5 54 47.5 65 32 69.5 16.5 65 5.5 54 5.5 38.5V12L32 2.5Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.55"
      />
      {/* Anel interno: dá o peso de "selo" sem imitar selo de ninguém. */}
      <path
        d="M32 8 53 15.5v22.7C53 50.6 44 59.7 32 63.6 20 59.7 11 50.6 11 38.2V15.5L32 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity="0.3"
      />
      <Grafismo tipo={marca.grafismo} />
      <text
        x="32"
        y="48"
        textAnchor="middle"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.3"
        fontFamily="inherit"
      >
        {marca.sigla}
      </text>
      <text
        x="32"
        y="57.5"
        textAnchor="middle"
        fill="currentColor"
        fillOpacity="0.7"
        fontSize="5.4"
        fontWeight="600"
        letterSpacing="0.6"
        fontFamily="inherit"
        style={{ textTransform: "uppercase" }}
      >
        {marca.legenda.toUpperCase()}
      </text>
    </svg>
  );
}
