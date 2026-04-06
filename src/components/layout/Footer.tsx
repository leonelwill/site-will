import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { ReactNode } from "react";
import { contactInfo } from "@/lib/contact";

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface SocialLink {
  icon: () => ReactNode;
  href: string;
  label: string;
}

const socialLinks: SocialLink[] = [
  { icon: LinkedinIcon, href: "https://www.linkedin.com/in/williamleonel/", label: "LinkedIn" },
  { icon: InstagramIcon, href: "https://www.instagram.com/william.leonelf/", label: "Instagram" },
  { icon: YoutubeIcon, href: "https://www.youtube.com/@btgpactual", label: "YouTube" },
];

const quickLinks = [
  { label: "Autoridade", href: "#autoridade" },
  { label: "Sobre Mim", href: "#sobre" },
  { label: "Serviços", href: "#servicos" },
  { label: "Contato", href: "#contato" },
];

export function Footer() {
  return (
    <footer className="border-t border-brand-primary/10 bg-white text-brand-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="min-w-0 lg:col-span-1">
            <Image
              src="/images/ethimos_investimentos_logo.png"
              alt="Ethimos Investimentos"
              width={240}
              height={64}
              className="mb-4 h-14 w-auto"
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Assessoria de investimentos personalizada com a solidez do maior banco de investimentos da América Latina.
            </p>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-primary/10 bg-muted text-brand-primary transition-all hover:bg-brand-primary hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="min-w-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-primary">
              Navegação
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="min-w-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-primary">
              Contato
            </h3>
            <ul className="space-y-3">
              <li className="flex min-w-0 items-start gap-3 text-sm text-muted-foreground">
                <Mail size={16} className="mt-0.5 shrink-0 text-brand-primary" />
                <a
                  href={contactInfo.emailHref}
                  className="min-w-0 break-all transition-colors hover:text-brand-primary"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex min-w-0 items-start gap-3 text-sm text-muted-foreground">
                <Phone size={16} className="mt-0.5 shrink-0 text-brand-primary" />
                <a href={contactInfo.phoneHref} className="transition-colors hover:text-brand-primary">
                  {contactInfo.phoneDisplay}
                </a>
              </li>
              <li className="flex min-w-0 items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-primary" />
                <span>{contactInfo.location}</span>
              </li>
            </ul>
          </div>

          {/* BTG Pactual */}
          <div className="min-w-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-primary">
              Parceiro
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Escritório credenciado ao <strong className="text-brand-dark">BTG Pactual</strong>, o maior banco de investimentos da América Latina.
            </p>
            <div className="mt-4 rounded-lg border border-brand-primary/10 bg-muted px-4 py-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Ethimos Investimentos - Agente Autônomo de Investimentos credenciado ao BTG Pactual S.A.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 border-t border-brand-primary/10 pt-8">
          <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground">
            A Ethimos Investimentos Ltda. é uma empresa de Agentes Autônomos de Investimentos devidamente registrada na CVM e na ANCORD.
            Os investimentos apresentados podem não ser adequados para todos os investidores. Rentabilidade passada não representa garantia
            de rentabilidade futura. Os investimentos em títulos e valores mobiliários apresentam riscos inerentes, como risco de crédito,
            risco de mercado e risco de liquidez. Não há garantia de retorno do capital investido.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} William Leonel - Ethimos Investimentos | BTG Pactual. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
