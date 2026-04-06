"use client";

import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Calculator, PiggyBank, TrendingUp, ArrowRight } from "lucide-react";

const tools = [
  {
    icon: PiggyBank,
    title: "Simulador de Aposentadoria",
    description:
      "Descubra quanto você precisa investir hoje para ter a aposentadoria dos seus sonhos. Simule diferentes cenários e prazos.",
    color: "from-blue-500/10 to-brand-primary/10",
    coming: false,
  },
  {
    icon: TrendingUp,
    title: "Planejamento Patrimonial",
    description:
      "Organize seus ativos, passivos e projete o crescimento do seu patrimônio ao longo dos próximos anos.",
    color: "from-brand-accent/10 to-blue-400/10",
    coming: false,
  },
  {
    icon: Calculator,
    title: "Finanças Pessoais",
    description:
      "Controle suas receitas e despesas, identifique oportunidades de economia e otimize seus investimentos mensais.",
    color: "from-brand-gold/10 to-amber-400/10",
    coming: false,
  },
];

export function Calculators() {
  return (
    <section id="ferramentas" className="py-24 hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 pattern-overlay" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Ferramentas Gratuitas"
            title="Calculadoras para seu Planejamento"
            description="Utilize nossas ferramentas gratuitas para simular e planejar seus investimentos. Conheça o poder do planejamento financeiro."
            light
          />
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <AnimateOnScroll key={tool.title} delay={index * 0.15}>
              <div className="group relative h-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 transition-all hover:bg-white/10 hover:border-brand-accent/30 hover:shadow-2xl">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-6`}>
                  <tool.icon size={28} className="text-brand-accent" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{tool.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-6">{tool.description}</p>

                <button className="inline-flex items-center gap-2 text-brand-accent font-semibold text-sm hover:text-white transition-colors group/btn">
                  Acessar Ferramenta
                  <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={0.4}>
          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm">
              Mais ferramentas em breve. Deixe seu contato para ser notificado.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
