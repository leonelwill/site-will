"use client";

import { Counter } from "@/components/ui/Counter";

const stats = [
  { end: 4, prefix: "R$ ", suffix: " Bi+", label: "Sob Custódia", duration: 1500 },
  { end: 7000, suffix: "+", label: "Clientes Atendidos", duration: 2000 },
  { end: 1, suffix: "&ordm;", label: "Melhor Escritório BTG 2025", duration: 1000 },
  { end: 160, suffix: "+", label: "Especialistas Certificados", duration: 1800 },
  { end: 10, label: "Escritórios no Brasil", duration: 1200 },
];

export function SocialProof() {
  return (
    <section className="relative -mt-12 z-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-brand-primary/10 bg-white/95 px-8 py-12 shadow-2xl shadow-brand-primary/10 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {stats.map((stat) => (
              <Counter
                key={stat.label}
                end={stat.end}
                prefix={stat.prefix}
                suffix={stat.suffix?.replace("&ordm;", "\u00BA")}
                label={stat.label}
                duration={stat.duration}
                light
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
