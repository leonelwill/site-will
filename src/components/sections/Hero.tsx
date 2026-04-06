"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { contactInfo } from "@/lib/contact";

export function Hero() {
  return (
    <section
      id="inicio"
      className="theme-hero-shell relative flex min-h-screen items-center overflow-hidden pt-24"
    >
      <div className="pattern-overlay-light absolute inset-0" />

      {/* Decorative elements */}
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="absolute bottom-8 left-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-primary/10 bg-white/90 px-4 py-1.5 shadow-sm shadow-brand-primary/5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-brand-gold" />
              <span className="text-sm font-medium text-brand-primary">
                Melhor Escritório BTG Pactual 2025
              </span>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-primary/70">
              Ethimos Investimentos | BTG Pactual
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-brand-dark sm:text-5xl lg:text-6xl">
              Seu patrimônio com{" "}
              <span className="text-brand-primary">direção clara</span>.
              <br />
              Sem ruído, sem produto empurrado.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Assessoria patrimonial para quem busca clareza estratégica, acompanhamento próximo
              e a estrutura da <strong className="text-brand-dark">Ethimos Investimentos</strong>{" "}
              com o ecossistema do <strong className="text-brand-dark">BTG Pactual</strong>.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href={contactInfo.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10"
              >
                <MessageCircle size={18} />
                Falar no WhatsApp
              </a>
              <a
                href="#contato"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/15 bg-white/85 px-8 py-4 text-base font-semibold text-brand-primary transition-all hover:scale-[1.02] hover:border-brand-primary/30 hover:bg-white"
              >
                Solicitar diagnóstico inicial
                <ArrowRight size={18} />
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center gap-4 text-brand-dark/70">
              <div className="flex items-center gap-3 rounded-2xl border border-brand-primary/10 bg-white/90 px-4 py-3 shadow-sm shadow-brand-primary/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/5">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-xs font-medium">CVM Registrado</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-brand-primary/10 bg-white/90 px-4 py-3 shadow-sm shadow-brand-primary/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/5">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-xs font-medium">ANCORD</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-brand-primary/10 bg-white/90 px-4 py-3 shadow-sm shadow-brand-primary/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/5">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-xs font-medium">BTG Pactual</span>
              </div>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto max-w-xl">
              <div className="absolute -inset-6 rounded-[2.25rem] bg-gradient-to-br from-brand-primary/10 via-white/40 to-brand-accent/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-brand-primary/10 backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-gold" />

                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary/65">
                  Patrimônio com direção
                </p>
                <h2 className="mt-5 text-3xl font-bold leading-tight text-brand-dark">
                  Diagnóstico, estratégia e acompanhamento sem complexidade desnecessária.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Um atendimento pensado para quem quer tomar decisões com mais segurança,
                  entender prioridades e organizar o patrimônio com visão de longo prazo.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-brand-primary/10 bg-muted/70 p-5">
                    <p className="text-sm font-semibold text-brand-dark">Atendimento direto</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Conversa objetiva, contato rápido e acompanhamento próximo ao longo do processo.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-primary/10 bg-muted/70 p-5">
                    <p className="text-sm font-semibold text-brand-dark">Estrutura forte por trás</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Ethimos Investimentos e o ecossistema BTG Pactual como base institucional.
                    </p>
                  </div>
                </div>

                <div className="theme-dark-surface mt-8 rounded-2xl px-5 py-4 text-white shadow-xl shadow-brand-primary/15">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-accent">
                        Credencial central
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        Escritório reconhecido em 1º lugar no Ranking BTG Pactual 2025
                      </p>
                    </div>
                    <ArrowRight className="hidden shrink-0 sm:block" size={18} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
