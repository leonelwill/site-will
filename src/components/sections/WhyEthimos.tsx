"use client";

import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Trophy, Award, Clock, Building2, Crown, ShieldCheck } from "lucide-react";

const differentials = [
  {
    icon: Trophy,
    title: "1\u00BA Lugar - Melhor Escritório BTG Pactual 2025",
    description:
      "Eleito o melhor escritório do maior banco de investimentos da América Latina, dentre aproximadamente 160 escritórios em todo o Brasil.",
    highlight: true,
  },
  {
    icon: Award,
    title: "2\u00BA Lugar Ranking BTG 2024 + 4 Prêmios",
    description:
      "Segundo lugar no Ranking BTG Pactual 2024 e 4 prêmios no BTG Summit 2024. Trajetória consistente de reconhecimento e excelência.",
  },
  {
    icon: Clock,
    title: "15+ Anos de História",
    description:
      "Fundada em Campinas, a Ethimos construiu uma trajetória sólida de confiança e resultados com presença nacional.",
  },
  {
    icon: Building2,
    title: "BTG Pactual",
    description:
      "Parceria com o maior banco de investimentos da América Latina, oferecendo acesso a produtos exclusivos e expertise global.",
  },
  {
    icon: Crown,
    title: "65%+ Clientes Alta Renda",
    description:
      "Especialização em clientes Private e Wealth, com atendimento diferenciado para patrimônios qualificados.",
  },
  {
    icon: ShieldCheck,
    title: "Equipe Certificada",
    description:
      "Time com certificações CPA-10, CPA-20, CEA, CFP e CGA — garantindo excelência técnica em cada recomendação.",
  },
];

export function WhyEthimos() {
  return (
    <section id="ethimos" className="py-24 bg-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Por que a Ethimos"
            title="Reconhecimento que Comprova Excelência"
            description="Uma trajetória de resultados e prêmios que reflete o compromisso com cada cliente."
          />
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {differentials.map((item, index) => (
            <AnimateOnScroll key={item.title} delay={index * 0.1}>
              <div
                className={`relative h-full rounded-2xl p-8 transition-all hover:shadow-xl hover:-translate-y-1 ${
                  item.highlight
                    ? "bg-brand-dark text-white border border-brand-accent/20 shadow-lg"
                    : "bg-white border border-border"
                }`}
              >
                {item.highlight && (
                  <div className="absolute -top-3 left-8 gold-gradient text-brand-dark text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                    Destaque
                  </div>
                )}

                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    item.highlight ? "bg-brand-accent/20" : "bg-brand-primary/5"
                  }`}
                >
                  <item.icon
                    size={28}
                    className={item.highlight ? "text-brand-accent" : "text-brand-primary"}
                  />
                </div>

                <h3
                  className={`text-lg font-bold mb-3 ${
                    item.highlight ? "text-white" : "text-brand-dark"
                  }`}
                >
                  {item.title}
                </h3>

                <p
                  className={`text-sm leading-relaxed ${
                    item.highlight ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
