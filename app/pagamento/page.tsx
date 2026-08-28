"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type PaymentData = {
  orderId: string;
  readingId: string;
  offerName: string;
  amount: number;
  status: "pending" | "paid" | "expired" | "failed";
  paid: boolean;
  expiresAt: string | null;
  pixCopyPaste: string | null;
  qrCodeBase64: string | null;
};

function qrSource(value: string | null) {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value}`;
}

function formatRemaining(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PaymentPage() {
  const [orderId, setOrderId] = useState("");
  const [readingId, setReadingId] = useState("love");
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const redirecting = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = params.get("orderId") || "";
    const currentReadingId = params.get("id") || "love";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderId(currentOrderId);
    setReadingId(currentReadingId);

    if (!currentOrderId) {
      setError("Não encontramos esta mesa. Volte aos caminhos e comece uma nova leitura.");
      return;
    }

    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/payment/status?orderId=${encodeURIComponent(currentOrderId)}`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Não foi possível consultar o Pix.");
        if (!active) return;
        setPayment(payload as PaymentData);
        if (payload.status === "paid" && !redirecting.current) {
          redirecting.current = true;
          window.setTimeout(() => {
            window.location.assign(`/resultado?id=${encodeURIComponent(payload.readingId || currentReadingId)}&orderId=${encodeURIComponent(currentOrderId)}`);
          }, 1100);
        }
      } catch (pollError) {
        if (active) setError(pollError instanceof Error ? pollError.message : "Não foi possível consultar o Pix.");
      }
    };

    poll();
    const interval = window.setInterval(poll, 3500);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearInterval(clock);
    };
  }, []);

  const expirationTimestamp = payment?.expiresAt ? Date.parse(payment.expiresAt) : Number.NaN;
  const remaining = Number.isFinite(expirationTimestamp) ? Math.max(0, expirationTimestamp - now) : null;

  async function copyPix() {
    if (!payment?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(payment.pixCopyPaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o código Pix e copie manualmente.");
    }
  }

  const status = payment?.status;
  const showCheckout = payment && status === "pending";

  return <main className="payment-page">
    <div className="payment-page-bg" />
    <div className="payment-card-preview" aria-hidden="true">
      {["lua", "dois-copas", "estrela", "justica", "mundo"].map((card, index) => <img key={card} src={`/assets/tarot-cards/${card}.png`} alt="" style={{ "--preview-index": index } as CSSProperties} />)}
    </div>
    <header className="payment-top"><Link href={`/leitura?id=${encodeURIComponent(readingId)}`} className="back-link">← revisar respostas</Link><img src="/assets/mega-tarot-logo.png" alt="Mega Tarot" /></header>

    <section className="payment-shell" aria-live="polite">
      {showCheckout && <>
        <div className="payment-copy"><p className="eyebrow-light">a sua mesa está pronta</p><h1>Desbloqueie<br /><em>o que as cartas viram.</em></h1><p>O resultado foi construído a partir das suas 12 escolhas. Faça o Pix para revelar as cinco cartas e a mensagem central da sua leitura.</p><div className="payment-offer"><span>{payment.offerName}</span><strong>R$ {payment.amount.toFixed(2).replace(".", ",")}</strong></div></div>
        <div className="payment-panel"><div className="payment-panel-heading"><span className="payment-lock">✦</span><div><p className="eyebrow-light">pagamento único · Pix</p><h2>Abra sua leitura</h2></div></div>{payment.qrCodeBase64 ? <img className="payment-qr" src={qrSource(payment.qrCodeBase64)} alt="QR Code para pagar sua leitura" /> : <div className="payment-qr payment-qr-empty">Gerando seu QR Code...</div>}<p className="payment-timer">Este Pix expira em <strong>{remaining === null ? "--:--" : formatRemaining(remaining)}</strong></p><button className="payment-copy-button" onClick={copyPix}>{copied ? "Código Pix copiado ✓" : "Copiar código Pix"}</button>{payment.pixCopyPaste && <details className="payment-code-details"><summary>Ver código Pix</summary><code>{payment.pixCopyPaste}</code></details>}<div className="payment-waiting"><span className="payment-pulse" />Aguardando a confirmação do pagamento<span className="payment-dots">...</span></div></div>
      </>}

      {!payment && !error && <div className="payment-message"><div className="loading-orbit">✦</div><p className="eyebrow-light">preparando a mesa</p><h1>Gerando seu Pix<span>...</span></h1><p>Um instante enquanto protegemos suas cartas.</p></div>}
      {error && !payment && <div className="payment-message"><div className="payment-error-sigil">!</div><p className="eyebrow-light">a mesa precisa de atenção</p><h1>Não foi possível<br /><em>abrir o pagamento.</em></h1><p>{error}</p><Link className="gold-cta payment-retry" href={`/leitura?id=${encodeURIComponent(readingId)}`}>Voltar à leitura <span>↗</span></Link></div>}
      {payment && status === "paid" && <div className="payment-message"><div className="payment-success-sigil">✓</div><p className="eyebrow-light">pagamento confirmado</p><h1>Suas cartas<br /><em>estão despertando.</em></h1><p>Estamos abrindo o resultado personalizado da sua mesa.</p></div>}
      {payment && (status === "expired" || status === "failed") && <div className="payment-message"><div className="payment-error-sigil">!</div><p className="eyebrow-light">pix encerrado</p><h1>Vamos abrir<br /><em>uma nova mesa?</em></h1><p>Este código Pix não está mais disponível. Suas respostas continuam salvas nesta sessão.</p><Link className="gold-cta payment-retry" href={`/leitura?id=${encodeURIComponent(payment.readingId || readingId)}`}>Gerar novo Pix <span>✦</span></Link></div>}
    </section>
    <p className="payment-order">pedido {orderId ? orderId.slice(0, 8).toUpperCase() : "—"} · ambiente seguro</p>
  </main>;
}
