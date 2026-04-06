"use client";

import { useEffect, useState } from "react";
import { MessageCircle, PhoneCall } from "lucide-react";
import { contactInfo } from "@/lib/contact";
import { cn } from "@/lib/utils";

export function StickyContactBar() {
  const [contactInView, setContactInView] = useState(false);

  useEffect(() => {
    const section = document.getElementById("contato");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setContactInView(entry.isIntersecting),
      { threshold: 0.2 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 hidden flex-col gap-3 xl:flex">
        <a
          href={contactInfo.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-black/15 transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle size={18} />
          Falar no WhatsApp
        </a>
        <a
          href="#contato"
          className={cn(
            "inline-flex items-center gap-3 rounded-full border bg-white px-5 py-3 text-sm font-semibold text-brand-primary shadow-xl shadow-brand-primary/10 transition-all hover:-translate-y-0.5",
            contactInView
              ? "border-brand-accent bg-brand-primary text-white"
              : "border-brand-primary/10"
          )}
        >
          <PhoneCall size={18} />
          Solicitar contato
        </a>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-4 py-3 shadow-[0_-14px_30px_rgba(13,22,48,0.08)] backdrop-blur transition-colors xl:hidden",
          contactInView ? "border-brand-accent/40" : "border-brand-primary/10"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <a
            href={contactInfo.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
          <a
            href="#contato"
            className={cn(
              "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition-colors",
              contactInView ? "bg-brand-dark" : "bg-brand-primary"
            )}
          >
            <PhoneCall size={18} />
            Solicitar contato
          </a>
        </div>
      </div>
    </>
  );
}
