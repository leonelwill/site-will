"use client";

import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteTheme } from "@/lib/theme";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  Crown,
  Landmark,
  ShieldCheck,
} from "lucide-react";

const stats = [
  { value: "R$ 4 Bi+", label: "Sob custódia" },
  { value: "7.000+", label: "Clientes atendidos" },
  { value: "10", label: "Escritórios no Brasil" },
  { value: "15+ anos", label: "Trajetória Ethimos" },
];

const authorityCards = [
  {
    icon: Crown,
    title: "Ethimos em destaque nacional",
    description:
      "Reconhecimento recente no Ranking BTG Pactual e uma trajetória consistente de crescimento e excelência.",
  },
  {
    icon: Landmark,
    title: "Ecossistema BTG Pactual",
    description:
      "Atendimento com acesso à plataforma, produtos e solidez do maior banco de investimentos da América Latina.",
  },
  {
    icon: ShieldCheck,
    title: "Ambiente regulado e seguro",
    description:
      "Operação vinculada a escritório devidamente registrado na CVM e na ANCORD, com atuação profissional e transparente.",
  },
];

const steps = [
  {
    icon: ClipboardCheck,
    title: "1. Diagnóstico rápido",
    description:
      "Entendemos objetivos, momento de vida, estrutura patrimonial e horizonte de investimento.",
  },
  {
    icon: BriefcaseBusiness,
    title: "2. Direcionamento inicial",
    description:
      "Você recebe um plano de próximos passos para carteira, proteção patrimonial e oportunidades prioritárias.",
  },
  {
    icon: ShieldCheck,
    title: "3. Acompanhamento próximo",
    description:
      "A relação continua com revisões, ajustes de estratégia e suporte ao longo do tempo.",
  },
];

export function AuthoritySection() {
  return (
    <section id="autoridade" className="theme-section-muted py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Estrutura e Credibilidade"
            title="Os sinais de confiança precisam aparecer cedo, com clareza e sem exagero"
            description="Para quem chega pelas redes sociais, autoridade nao vem de promessas vagas. Vem de números, estrutura institucional e um processo de atendimento bem definido."
          />
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.08}>
          <div className="theme-card-surface mt-12 grid gap-4 rounded-[2rem] p-6 shadow-xl shadow-brand-primary/8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="theme-card-soft rounded-2xl px-5 py-4">
                <p className="text-2xl font-bold text-brand-dark">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-3">
            {authorityCards.map((card, index) => (
              <AnimateOnScroll key={card.title} delay={index * 0.08}>
                <div className="theme-card-surface rounded-3xl p-7 shadow-lg shadow-brand-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-primary/10">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/5">
                    <card.icon className="text-brand-primary" size={26} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-dark">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll delay={0.15}>
            <div className={`${siteTheme.dark.surfaceClass} rounded-[2rem] p-8 text-white shadow-2xl shadow-brand-primary/15 sm:p-10`}>
              <Image
                src={siteTheme.dark.logoSrc}
                alt="Ethimos Investimentos"
                width={170}
                height={42}
                className="h-10 w-auto"
              />
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-accent">
                Como funciona
              </p>
              <h3 className="mt-4 text-3xl font-bold leading-tight">
                Um processo simples para sair da intenção e chegar em uma direção prática
              </h3>
              <div className="mt-8 space-y-5">
                {steps.map((step) => (
                  <div
                    key={step.title}
                    className={`${siteTheme.dark.panelClass} rounded-2xl p-5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/20">
                        <step.icon size={20} className="text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{step.title}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="#contato"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent transition-colors hover:text-white"
              >
                Solicitar contato agora
                <ArrowRight size={16} />
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
