"use client";

import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight, Building2, MapPin, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { contactInfo } from "@/lib/contact";
import { siteTheme } from "@/lib/theme";

const profileItems = [
  {
    icon: Building2,
    title: "Base institucional",
    description: "Atuação vinculada à Ethimos Investimentos, com acesso à estrutura e à plataforma do BTG Pactual.",
  },
  {
    icon: Users,
    title: "Perfil de atendimento",
    description: "Foco em clientes que buscam clareza patrimonial, visão de longo prazo e relacionamento próximo.",
  },
  {
    icon: MapPin,
    title: "Atuação e presença",
    description: "Atendimento com base em Sorocaba, SP, conectado à estrutura nacional da Ethimos.",
  },
  {
    icon: ShieldCheck,
    title: "Forma de trabalhar",
    description: "Diagnóstico, definição de prioridades e acompanhamento contínuo, sem abordagem genérica.",
  },
];

export function AboutMe() {
  return (
    <section id="sobre" className="theme-section py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <AnimateOnScroll>
            <div className={`${siteTheme.dark.surfaceClass} rounded-[2rem] border border-brand-accent/10 p-8 text-white shadow-2xl shadow-brand-primary/15 sm:p-10`}>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-accent">
                Sobre o atendimento
              </p>
              <blockquote className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
                “Minha assessoria começa ouvindo, não vendendo.”
              </blockquote>
              <p className="mt-6 text-base leading-relaxed text-white/72">
                O objetivo é entender momento, prioridades e riscos antes de falar de produto.
                A conversa precisa gerar clareza, não confusão.
              </p>

              <div className={`${siteTheme.dark.panelClass} mt-8 rounded-2xl p-5`}>
                <p className="text-sm leading-relaxed text-white/72">
                  Para quem chega pelas redes sociais, o primeiro contato precisa ser simples,
                  humano e útil desde o início.
                </p>
              </div>

              <a
                href={contactInfo.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition-all hover:scale-[1.02] hover:bg-brand-accent"
              >
                <MessageCircle size={18} />
                Falar no WhatsApp
              </a>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.2}>
            <SectionHeading
              eyebrow="Sobre Mim"
              title="William Leonel"
              description="Uma assessoria patrimonial eficiente combina escuta, estrutura institucional e execução consistente. A proposta aqui é transformar complexidade em próximos passos claros."
              centered={false}
            />

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {profileItems.map((item) => (
                <div
                  key={item.title}
                  className="theme-card-soft rounded-2xl p-6 shadow-sm shadow-brand-primary/5"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary/5">
                    <item.icon size={22} className="text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#contato"
                className="inline-flex items-center gap-2 text-brand-primary font-semibold transition-colors hover:text-brand-dark"
              >
                Solicitar conversa estratégica
                <ArrowRight size={16} />
              </a>
              <p className="text-sm text-muted-foreground">
                Atendimento com base em Sorocaba e estrutura Ethimos para clientes em diferentes regiões.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
