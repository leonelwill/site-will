"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ArrowRight,
  Building2,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
  Users,
} from "lucide-react";
import { contactInfo } from "@/lib/contact";
import { siteTheme } from "@/lib/theme";

const profileItems = [
  {
    icon: Building2,
    title: "Com quem eu trabalho",
    description:
      "Atuo pela Ethimos Investimentos, com acesso a uma estrutura robusta e à plataforma do BTG Pactual.",
  },
  {
    icon: Users,
    title: "Como gosto de atender",
    description:
      "Prefiro relações próximas, conversas francas e um atendimento que respeita o momento de cada cliente.",
  },
  {
    icon: MapPin,
    title: "De onde eu atuo",
    description:
      "Estou em Sorocaba, mas atendo clientes de diferentes regiões com o suporte da estrutura nacional da Ethimos.",
  },
  {
    icon: ShieldCheck,
    title: "O que você pode esperar",
    description:
      "Nada de recomendação genérica: primeiro eu entendo o contexto, depois organizo prioridades e acompanho a execução.",
  },
];

export function AboutMe() {
  const [showPortrait, setShowPortrait] = useState(true);

  return (
    <section id="sobre" className="theme-section py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <AnimateOnScroll>
            <div className={`${siteTheme.dark.surfaceClass} rounded-[2rem] border border-brand-accent/10 p-8 text-white shadow-2xl shadow-brand-primary/15 sm:p-10`}>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-accent">
                Minha forma de trabalhar
              </p>

              <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center">
                <div className="mx-auto flex flex-col gap-4 md:mx-0">
                  {showPortrait ? (
                    <>
                      <div className="relative h-36 w-36 overflow-hidden rounded-[2rem] border border-white/12 bg-brand-accent/10 sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                        <Image
                          src="/api/private-photo/william-about2"
                          alt="William Leonel"
                          fill
                          sizes="(min-width: 1024px) 192px, (min-width: 640px) 160px, 144px"
                          className="object-cover"
                          priority={false}
                          loading="lazy"
                          onError={() => setShowPortrait(false)}
                        />
                      </div>
                      <div className="relative h-36 w-36 overflow-hidden rounded-[2rem] border border-white/12 bg-brand-accent/10 sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                        <Image
                          src="/api/private-photo/william-about"
                          alt="William Leonel sorrindo"
                          fill
                          sizes="(min-width: 1024px) 192px, (min-width: 640px) 160px, 144px"
                          className="object-cover"
                          priority={false}
                          loading="lazy"
                          onError={() => setShowPortrait(false)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border border-white/12 bg-brand-accent/20 text-3xl font-semibold text-white sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                      WL
                    </div>
                  )}
                </div>

                <div className="relative flex-1">
                  <Quote
                    className="absolute -left-2 -top-3 h-10 w-10 text-brand-accent/35 sm:h-12 sm:w-12"
                    aria-hidden="true"
                  />
                  <div className={`${siteTheme.dark.panelClass} relative rounded-[1.75rem] p-6 sm:p-7`}>
                    <div className="absolute left-8 top-full hidden h-4 w-4 -translate-y-1/2 rotate-45 bg-white/10 md:block" />
                    <blockquote className="pr-2 text-2xl font-bold leading-tight sm:text-3xl">
                      &ldquo;Eu gosto de começar entendendo a pessoa antes de olhar para a
                      carteira.&rdquo;
                    </blockquote>
                    <p className="mt-4 text-base leading-relaxed text-white/72">
                      Quando alguém chega até mim, a prioridade é entender o momento, os objetivos
                      e as decisões que precisam ser tomadas agora. A estratégia vem depois disso.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-base leading-relaxed text-white/72">
                Foi assim que escolhi construir meu atendimento: com proximidade, critério e uma
                conversa que faz sentido para a realidade de quem está do outro lado.
              </p>

              <div className={`${siteTheme.dark.panelClass} mt-6 rounded-2xl p-5`}>
                <p className="text-sm leading-relaxed text-white/72">
                  Se você me acompanha nas redes, aqui no site a proposta é a mesma: falar de forma
                  objetiva, sem complicar o que já é importante por natureza.
                </p>
              </div>

              <a
                href={contactInfo.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition-all hover:scale-[1.02] hover:bg-brand-accent"
              >
                <MessageCircle size={18} />
                Falar comigo no WhatsApp
              </a>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.2}>
            <SectionHeading
              eyebrow="Sobre Mim"
              title="William Leonel"
              description="Acredito em uma assessoria que une proximidade no atendimento com seriedade na execução. Meu papel é ajudar você a organizar o patrimônio com mais contexto, critério e tranquilidade."
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
                className="inline-flex items-center gap-2 font-semibold text-brand-primary transition-colors hover:text-brand-dark"
              >
                Solicitar avaliação inicial
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
