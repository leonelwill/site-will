"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import {
  ArrowRight,
  CheckCircle,
  Clock3,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { contactInfo } from "@/lib/contact";
import { siteTheme } from "@/lib/theme";

const patrimonioRanges = [
  "Até R$ 100 mil",
  "R$ 100 mil a R$ 500 mil",
  "R$ 500 mil a R$ 1 milhão",
  "R$ 1 milhão a R$ 5 milhões",
  "Acima de R$ 5 milhões",
];

const goals = [
  "Organizar carteira atual",
  "Planejar aposentadoria",
  "Estruturar patrimônio familiar",
  "Avaliar oportunidades no BTG",
];

const contactPreferences = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Ligação", value: "phone" },
  { label: "E-mail", value: "email" },
] as const;

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  patrimonio: string;
  goal: string;
  contactPreference: (typeof contactPreferences)[number]["value"];
  message: string;
}

export function ContactCTA() {
  const searchParams = useSearchParams();
  const goalFromQuery = searchParams.get("goal");
  const initialGoal = goals.includes(goalFromQuery ?? "") ? goalFromQuery! : goals[0];

  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    patrimonio: "",
    goal: initialGoal,
    contactPreference: contactPreferences[0].value,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormState("success");
        setErrorMessage("");
        setFormData({
          name: "",
          email: "",
          phone: "",
          patrimonio: "",
          goal: initialGoal,
          contactPreference: contactPreferences[0].value,
          message: "",
        });
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(
          data?.error ||
            "No momento, não foi possível concluir o envio. Por favor, tente novamente em instantes."
        );
        setFormState("error");
      }
    } catch {
      setErrorMessage(
        "No momento, não foi possível concluir o envio. Por favor, tente novamente em instantes."
      );
      setFormState("error");
    }
  };

  return (
    <section id="contato" className="hero-gradient relative overflow-hidden py-24">
      <div className="pattern-overlay absolute inset-0" />

      {/* Decorative */}
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <AnimateOnScroll>
            <div>
              <Image
                src={siteTheme.dark.logoSrc}
                alt="Ethimos Investimentos"
                width={180}
                height={44}
                className="mb-6 h-10 w-auto"
              />
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-accent">
                Vamos conversar
              </p>
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                Se fizer sentido para você, me conte seu momento e eu{" "}
                <span className="text-brand-accent">entro em contato</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/65">
                Pode ser para revisar a carteira, organizar o patrimônio, pensar em aposentadoria
                ou simplesmente entender por onde começar. Você me passa o básico e eu retorno
                pelo canal que preferir.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className={`${siteTheme.dark.panelClass} rounded-2xl p-5`}>
                  <div className="flex items-center gap-3 text-white">
                    <Clock3 size={20} className="shrink-0 text-brand-accent" />
                    <span className="font-semibold">Retorno diligente</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Leio cada contato com cuidado e priorizo resposta em até 1 dia útil.
                  </p>
                </div>
                <div className={`${siteTheme.dark.panelClass} rounded-2xl p-5`}>
                  <div className="flex items-center gap-3 text-white">
                    <ShieldCheck size={20} className="shrink-0 text-brand-accent" />
                    <span className="font-semibold">Contato seguro</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Suas informações ficam em ambiente profissional, com a descrição e o sigilo que o tema pede.
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-white/72">
                  <CheckCircle size={20} className="shrink-0 text-brand-accent" />
                  <span>O primeiro contato serve para eu entender seu momento e os próximos passos mais urgentes</span>
                </div>
                <div className="flex items-center gap-3 text-white/72">
                  <CheckCircle size={20} className="shrink-0 text-brand-accent" />
                  <span>Faz sentido para quem quer organizar patrimônio, revisar carteira ou ganhar mais clareza para decidir</span>
                </div>
                <div className="flex items-center gap-3 text-white/72">
                  <CheckCircle size={20} className="shrink-0 text-brand-accent" />
                  <span>Se preferir agilizar, você também pode me chamar direto no WhatsApp</span>
                </div>
              </div>

              <a
                href={contactInfo.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition-all hover:bg-brand-accent hover:text-brand-dark"
              >
                <MessageCircle size={18} />
                Falar comigo no WhatsApp
              </a>
            </div>
          </AnimateOnScroll>

          {/* Form */}
          <AnimateOnScroll delay={0.2}>
            <div className="rounded-[2rem] border border-brand-primary/10 bg-white/92 p-8 shadow-2xl shadow-brand-primary/10 backdrop-blur sm:p-10">
              {formState === "success" ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark">Contato solicitado com sucesso</h3>
                  <p className="mt-2 text-muted-foreground">
                    Obrigado. Em breve você receberá meu retorno pelo canal selecionado.
                  </p>
                  <button
                    onClick={() => setFormState("idle")}
                    className="mt-6 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors"
                  >
                    Enviar nova solicitação
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="rounded-2xl border border-brand-primary/10 bg-muted/70 p-4">
                    <p className="text-sm font-semibold text-brand-dark">
                      Informações iniciais
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Após o envio, o retorno será realizado com base no seu objetivo principal e no canal selecionado.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-dark mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-dark mb-1.5">
                      WhatsApp ou telefone *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      placeholder={contactInfo.phoneDisplay}
                    />
                  </div>

                  <div>
                    <label htmlFor="patrimonio" className="block text-sm font-medium text-brand-dark mb-1.5">
                      Patrimônio para investir
                    </label>
                    <select
                      id="patrimonio"
                      value={formData.patrimonio}
                      onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                      className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-brand-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                    >
                      <option value="">Selecione uma faixa</option>
                      {patrimonioRanges.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>

                  <details className="group rounded-2xl border border-brand-primary/10 bg-muted/45 px-4 py-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-brand-primary">
                      Deseja detalhar seu contexto? <span className="text-muted-foreground">(opcional)</span>
                    </summary>

                    <div className="mt-5 space-y-5">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1.5">
                          E-mail
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                          placeholder="seu@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-dark mb-2">
                          Objetivo principal
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {goals.map((goal) => {
                            const isActive = formData.goal === goal;

                            return (
                              <button
                                key={goal}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setFormData({ ...formData, goal })}
                                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                                  isActive
                                    ? "border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/15"
                                    : "border-border bg-white text-brand-dark hover:border-brand-primary/25 hover:bg-muted/60"
                                }`}
                              >
                                {goal}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-dark mb-2">
                          Canal preferido para retorno
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {contactPreferences.map((option) => {
                            const isActive = formData.contactPreference === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() =>
                                  setFormData({ ...formData, contactPreference: option.value })
                                }
                                className={`rounded-full border px-4 py-3 text-sm font-medium transition-all ${
                                  isActive
                                    ? "border-brand-primary bg-brand-primary text-white"
                                    : "border-border bg-white text-brand-dark hover:border-brand-primary/25 hover:bg-muted/60"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-brand-dark mb-1.5">
                          Algo importante para eu considerar?
                        </label>
                        <textarea
                          id="message"
                          rows={3}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                          placeholder="Ex.: já invisto hoje, quero revisar carteira, foco em aposentadoria..."
                        />
                      </div>
                    </div>
                  </details>

                  {formState === "error" && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-base font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {formState === "loading" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Solicitar contato
                      </>
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
                    <p>Suas informações são tratadas com total sigilo e segurança.</p>
                    <a
                      href={contactInfo.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-brand-primary transition-colors hover:text-brand-dark"
                    >
                      Optar por WhatsApp
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </form>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
