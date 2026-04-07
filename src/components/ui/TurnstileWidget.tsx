"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          action?: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onTokenChange: (token: string) => void;
}

export function TurnstileWidget({
  siteKey,
  onTokenChange,
}: TurnstileWidgetProps) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      onTokenChange("");
      return;
    }

    if (!scriptReady || !window.turnstile) return;

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      theme: "light",
      action: "lead_form",
      callback: (token) => {
        setWidgetError(null);
        onTokenChange(token);
      },
      "error-callback": () => {
        onTokenChange("");
        setWidgetError("Não consegui validar a proteção anti-spam. Tente novamente.");
      },
      "expired-callback": () => {
        onTokenChange("");
        setWidgetError("A verificação expirou. Confirme novamente para enviar.");
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, onTokenChange, scriptReady, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => {
          onTokenChange("");
          setWidgetError("Não foi possível carregar a proteção anti-spam.");
        }}
      />
      <div id={containerId} className="min-h-[65px]" />
      {widgetError ? (
        <p className="text-sm text-red-600">{widgetError}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Esta etapa ajuda a proteger o formulário contra envios automáticos.
        </p>
      )}
    </div>
  );
}
