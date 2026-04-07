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
  const [isVerifying, setIsVerifying] = useState(true);
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
        setIsVerifying(false);
        setWidgetError(null);
        onTokenChange(token);
      },
      "error-callback": () => {
        setIsVerifying(false);
        onTokenChange("");
        setWidgetError(
          "A proteção anti-spam não conseguiu concluir a verificação. Recarregue a página e, se continuar, confira o domínio configurado no Turnstile."
        );
      },
      "expired-callback": () => {
        setIsVerifying(false);
        onTokenChange("");
        setWidgetError("A verificação expirou. Confirme novamente para enviar.");
      },
    });

    const verificationTimeout = window.setTimeout(() => {
      setIsVerifying((current) => {
        if (!current) return current;

        onTokenChange("");
        setWidgetError(
          "A verificação está demorando mais do que o normal. Se estiver em produção, confira os hostnames do widget no Cloudflare Turnstile."
        );
        return false;
      });
    }, 12000);

    return () => {
      window.clearTimeout(verificationTimeout);
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
        onLoad={() => {
          setScriptReady(true);
          setIsVerifying(true);
          setWidgetError(null);
        }}
        onError={() => {
          setIsVerifying(false);
          onTokenChange("");
          setWidgetError(
            "Não foi possível carregar a proteção anti-spam. Verifique conexão, bloqueadores de script ou a configuração do widget."
          );
        }}
      />
      <div id={containerId} className="min-h-[65px]" />
      {widgetError ? (
        <p className="text-sm text-red-600">{widgetError}</p>
      ) : isVerifying ? (
        <p className="text-xs text-muted-foreground">
          Verificando proteção anti-spam...
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Verificação concluída. Esta etapa ajuda a proteger o formulário contra envios automáticos.
        </p>
      )}
    </div>
  );
}
