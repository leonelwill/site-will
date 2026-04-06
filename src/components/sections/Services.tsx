"use client";

import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ArrowRight,
  LineChart,
  Landmark,
  Umbrella,
  Globe,
  Building,
  HeartHandshake,
  Calculator,
  CreditCard,
} from "lucide-react";

const featuredServices = [
  {
    icon: LineChart,
    title: "Assessoria de Investimentos",
    description:
      "Se você já investe ou quer começar melhor, eu ajudo a organizar a carteira, ajustar rota e entender o que faz sentido para o seu momento.",
    goal: "Organizar carteira atual",
  },
  {
    icon: Landmark,
    title: "Planejamento Financeiro",
    description:
      "Aqui a conversa vai além do produto: olhamos patrimônio, objetivos, reserva, aposentadoria e o que precisa ser priorizado primeiro.",
    goal: "Planejar aposentadoria",
  },
  {
    icon: HeartHandshake,
    title: "Planejamento Sucessório",
    description:
      "Para quem quer proteger a família e organizar melhor a transmissão do patrimônio, eu ajudo a transformar um tema delicado em plano concreto.",
    goal: "Estruturar patrimônio familiar",
  },
];

const supportServices = [
  {
    icon: Calculator,
    title: "Previdência e Aposentadoria",
  },
  {
    icon: Building,
    title: "Investimentos para Empresas",
  },
  {
    icon: Umbrella,
    title: "Seguros e Proteção",
  },
  {
    icon: Globe,
    title: "Câmbio e Internacional",
  },
  {
    icon: CreditCard,
    title: "Crédito e Financiamento",
  },
];

export function Services() {
  return (
    <section id="servicos" className="theme-section py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Serviços"
            title="Esses são os assuntos que mais aparecem nas conversas que eu conduzo"
            description="Cada frente atende um momento diferente, mas todas partem da mesma base: entender seu contexto antes de decidir qualquer movimento."
          />
        </AnimateOnScroll>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {featuredServices.map((service, index) => (
            <AnimateOnScroll key={service.title} delay={index * 0.05}>
              <div className="theme-card-surface group relative flex h-full flex-col rounded-[1.75rem] p-7 shadow-lg shadow-brand-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-primary/10">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/5 transition-colors group-hover:bg-brand-accent/20">
                  <service.icon
                    size={24}
                    className="text-brand-primary transition-colors group-hover:text-brand-accent"
                  />
                </div>

                <h3 className="mb-2 text-lg font-bold text-brand-dark">
                  {service.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>

                <a
                  href={`/?goal=${encodeURIComponent(service.goal)}#contato`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-dark"
                >
                  Saiba mais
                  <ArrowRight size={15} />
                </a>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={0.2}>
          <div className="theme-card-soft mt-10 rounded-[1.75rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-primary/70">
              Também oferecemos
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {supportServices.map((service) => (
                <div
                  key={service.title}
                  className="theme-card-surface flex items-center gap-3 rounded-2xl px-4 py-4 text-sm text-brand-dark shadow-sm shadow-brand-primary/5"
                >
                  <service.icon size={18} className="shrink-0 text-brand-primary" />
                  <span>{service.title}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
