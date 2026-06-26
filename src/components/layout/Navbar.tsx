"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteTheme } from "@/lib/theme";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Autoridade", href: "#autoridade" },
  { label: "Sobre", href: "#sobre" },
  { label: "Serviços", href: "#servicos" },
  { label: "Contato", href: "#contato" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "theme-header fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-brand-primary/10 shadow-lg shadow-brand-primary/5 backdrop-blur-xl"
          : "border-brand-primary/10 backdrop-blur-md"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo + acesso Zeno Cloud */}
          <div className="flex items-center gap-3 sm:gap-5">
            <a href="#inicio" className="flex items-center gap-3">
              <Image
                src={siteTheme.light.logoSrc}
                alt="Ethimos Investimentos"
                width={160}
                height={40}
                className={cn(
                  "theme-logo-light h-10 w-auto transition-all duration-300",
                  scrolled && "h-9"
                )}
                priority
              />
              <Image
                src={siteTheme.dark.logoSrc}
                alt="Ethimos Investimentos"
                width={160}
                height={40}
                className={cn(
                  "theme-logo-dark h-10 w-auto transition-all duration-300",
                  scrolled && "h-9"
                )}
                priority
              />
            </a>

            {/* Botão Zeno Cloud (interno Ethimos) — efeito "líquido" no hover: o branco
                espalha do centro empurrando o azul p/ as bordas; texto vira azul e pulsa. */}
            <a
              href="/cloud"
              aria-label="Acessar o Zeno Cloud (interno Ethimos)"
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-brand-primary bg-brand-primary px-3.5 py-1.5 leading-tight shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-brand-primary/20"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 scale-0 rounded-[42%] bg-white transition-transform duration-500 ease-out group-hover:scale-[1.8]"
              />
              <span className="relative z-10 text-sm font-extrabold text-white transition-colors duration-300 group-hover:animate-pulse group-hover:text-brand-primary sm:text-base">
                Zeno Cloud
              </span>
              <span className="relative z-10 mt-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-white/80 transition-colors duration-300 group-hover:text-brand-primary/70">
                interno Ethimos
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
              className="text-sm font-medium text-brand-dark/80 transition-colors hover:text-brand-primary"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contato"
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-lg hover:shadow-brand-primary/15"
            >
              Solicitar contato
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full bg-brand-primary/8 p-2 text-brand-dark md:hidden"
            aria-label="Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="theme-mobile-menu rounded-b-2xl border border-brand-primary/10 pb-6 shadow-xl shadow-brand-primary/10 backdrop-blur-xl md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-brand-dark/88 transition-colors hover:text-brand-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="px-4 pt-2">
              <a
                href="#contato"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-full bg-brand-primary px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Solicitar contato
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
