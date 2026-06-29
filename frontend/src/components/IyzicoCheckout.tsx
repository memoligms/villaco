"use client";

import { useEffect, useRef, useState } from "react";
import { initializePayment } from "@/lib/api";
import { useT } from "@/lib/i18n/LanguageContext";

interface Props {
  reservationCode: string;
}

export function IyzicoCheckout({ reservationCode }: Props) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await initializePayment(reservationCode);
        if (cancelled) return;

        if (!result.checkoutFormContent) {
          setStatus("error");
          setErrorMessage(t.payment.formError);
          return;
        }

        renderCheckoutForm(result.checkoutFormContent, containerRef.current);
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(t.common.errorGeneric);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationCode]);

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorMessage ?? t.payment.formError}
      </div>
    );
  }

  return (
    <div>
      {status === "loading" ? <p className="text-sm text-slate-500">{t.payment.formPreparing}</p> : null}
      <div id="iyzipay-checkout-form" ref={containerRef} className="responsive" />
    </div>
  );
}

function renderCheckoutForm(html: string, container: HTMLDivElement | null) {
  if (!container) return;
  container.innerHTML = "";

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("script").forEach((oldScript) => {
    const script = document.createElement("script");
    Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
    script.text = oldScript.textContent ?? "";
    template.content.replaceChild(script, oldScript);
  });

  container.appendChild(template.content);
}
