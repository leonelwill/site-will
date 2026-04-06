"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-brand-primary/10 bg-white/95 shadow-lg shadow-brand-primary/5 backdrop-blur-xl"
          : "border-transparent bg-white/90 backdrop-blur-md"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-3">
            <Image
              src="/images/logo_ethimos_blue.png"
              alt="Ethimos Investimentos"
              width={160}
              height={40}
              className={cn(
                "h-10 w-auto transition-all duration-300",
                scrolled && "h-9"
              )}
              priority
            />
          </a>

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
              Fale Comigo
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-brand-dark md:hidden"
            aria-label="Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="rounded-b-2xl border border-brand-primary/10 bg-white/95 pb-6 shadow-xl shadow-brand-primary/10 backdrop-blur-xl md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-brand-dark/80 transition-colors hover:text-brand-primary"
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
                Fale Comigo
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
