"use client";

import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Quote } from "lucide-react";

const testimonials = [
  {
    text: "A assessoria do William transformou a forma como eu enxergo meus investimentos. Atendimento personalizado e resultados consistentes.",
    name: "Cliente Private",
    role: "Empresário",
  },
  {
    text: "Profissionalismo e dedicação. Me sinto seguro sabendo que meu patrimônio está sendo bem cuidado por uma equipe certificada.",
    name: "Cliente Wealth",
    role: "Médico",
  },
  {
    text: "O planejamento sucessório que fizemos trouxe tranquilidade para toda a família. Recomendo a todos que buscam uma assessoria séria.",
    name: "Cliente Private",
    role: "Empresária",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Depoimentos"
            title="O que Dizem Nossos Clientes"
            description="A confiança dos nossos clientes é o nosso maior ativo."
          />
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimateOnScroll key={index} delay={index * 0.15}>
              <div className="relative h-full rounded-2xl bg-muted/50 border border-border p-8">
                <Quote size={32} className="text-brand-accent/30 mb-4" />
                <p className="text-sm text-brand-dark leading-relaxed italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-primary">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={0.4}>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            * Depoimentos ilustrativos. Por questões de sigilo, não divulgamos nomes de clientes.
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
