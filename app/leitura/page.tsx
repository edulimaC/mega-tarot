"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackFormCompleted, trackReadingViewed } from "../../lib/marketing-pixels";

const themes: Record<string, { title: string; label: string; intro: string }> = {
  feelings: { label: "Sentimentos ocultos", title: "O que ele sente, mas não demonstra?", intro: "Uma leitura para separar intuição, desejo e aquilo que ficou preso nas entrelinhas." },
  return: { label: "Reencontro", title: "Existe chance de alguém voltar?", intro: "Vamos olhar para o ciclo que ficou aberto e para o que precisaria mudar antes de um reencontro." },
  third: { label: "Terceira energia", title: "Há uma energia entre vocês?", intro: "Uma investigação simbólica sobre influências externas, sem alimentar suposições ou ansiedade." },
  next: { label: "Próximo movimento", title: "Qual será o próximo passo dele?", intro: "Mapeie os sinais da aproximação e o movimento mais provável para os próximos dias." },
  love: { label: "Caminho do amor", title: "Onde o amor pede passagem?", intro: "Uma jornada para reconhecer padrões, medos e escolhas que estão pedindo uma nova direção." },
  decision: { label: "Encruzilhada", title: "Insisto ou viro a página?", intro: "Clareza para escolher sem confundir esperança com espera e sem abandonar o que você sente." },
  near: { label: "Próximas semanas", title: "Que novidade se aproxima?", intro: "Uma fotografia intuitiva das oportunidades, encontros e conversas que podem se aproximar." },
  block: { label: "Padrão repetido", title: "Qual ciclo está pedindo fim?", intro: "Nomeie a ferida que se repete e descubra qual limite pode abrir espaço para uma nova história." },
  message: { label: "Recado da intuição", title: "Qual recado sua intuição traz?", intro: "Quando a pergunta ainda não encontrou palavras, começamos pelo que seu corpo já sabe." },
};

const questions = [
  ["Quando você pensa nessa situação, qual sensação chega primeiro?", ["Uma saudade tranquila", "Ansiedade e urgência", "Curiosidade", "Cansaço emocional"]],
  ["Qual foi o último sinal concreto que fez você escolher esta leitura?", ["Uma mensagem", "Um silêncio diferente", "Um encontro inesperado", "Uma lembrança que voltou"]],
  ["Se essa história pudesse revelar uma verdade hoje, o que você gostaria de saber?", ["O que a pessoa sente", "Se existe futuro", "O que está impedindo", "Qual atitude tomar"]],
  ["Como você costuma agir quando não recebe a resposta que esperava?", ["Espero mais um pouco", "Pergunto diretamente", "Me afasto para me proteger", "Finjo que não me importo"]],
  ["O que você sente que está oferecendo mais do que recebe?", ["Tempo e presença", "Paciência", "Iniciativa", "Não sinto desequilíbrio"]],
  ["Qual cenário descreve melhor a comunicação entre vocês agora?", ["Flui com naturalidade", "Acontece e some", "Existe tensão", "Está completamente parada"]],
  ["Que medo aparece quando você imagina a resposta mais honesta?", ["Descobrir que acabou", "Perder o controle", "Ter de escolher", "Não ser correspondida"]],
  ["Qual lembrança ainda influencia suas decisões nesta história?", ["Um momento de conexão", "Uma decepção", "Uma promessa", "Uma despedida"]],
  ["O que você não quer mais repetir em uma relação?", ["Esperar por migalhas", "Não ser ouvida", "Me anular", "Confundir intensidade com segurança"]],
  ["Se você pudesse mudar apenas uma atitude sua, qual seria?", ["Colocar limites", "Falar o que sinto", "Parar de antecipar problemas", "Me permitir recomeçar"]],
  ["Qual palavra descreve o que seu coração realmente procura?", ["Reciprocidade", "Paz", "Coragem", "Fechamento"]],
  ["Ao terminar esta leitura, que tipo de direção você deseja levar consigo?", ["Uma confirmação", "Um próximo passo", "Um alerta", "Permissão para soltar"]],
] as [string, string[]][];

export default function ReadingPage() {
  const id = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") || "love" : "love";
  const theme = themes[id] || themes.love;
  const [answers, setAnswers] = useState<string[]>(Array(12).fill(""));
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const answered = answers.filter(Boolean).length;
  const progress = Math.round((answered / 12) * 100);

  useEffect(() => {
    const currentId = new URLSearchParams(window.location.search).get("id") || "love";
    const currentTheme = themes[currentId] || themes.love;
    trackReadingViewed({ readingId: currentId, readingName: currentTheme.label });
  }, []);

  async function beginReveal() {
    if (answered < 12 || loading) return;
    setCheckoutError("");
    setLoading(true);

    const query = new URLSearchParams(window.location.search);
    const trackingParameters = Object.fromEntries(
      ["src", "sck", "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"]
        .map((key) => [key, query.get(key) || ""])
        .filter(([, value]) => value),
    );

    try {
      const [response] = await Promise.all([
        fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readingId: id, answers, trackingParameters }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 850)),
      ]);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Não foi possível preparar o pagamento.");

      trackFormCompleted({
        orderId: payload.orderId,
        readingId: id,
        readingName: theme.label,
      });

      window.localStorage.setItem("mega-tarot-reading", JSON.stringify({ id, answers }));
      window.location.assign(`/pagamento?orderId=${encodeURIComponent(payload.orderId)}&id=${encodeURIComponent(id)}`);
    } catch (error) {
      setLoading(false);
      setCheckoutError(error instanceof Error ? error.message : "Não foi possível preparar o pagamento. Tente novamente.");
    }
  }

  return <main className="reading-page"><div className="reading-page-bg" />{loading && <div className="reveal-loading"><div className="loading-orbit">✦</div><p className="eyebrow-light">a mesa está em silêncio</p><h2>Revelando suas cartas<span>...</span></h2><p>Suas respostas estão encontrando os símbolos certos.</p></div>}<header className="reading-page-top"><Link href="/" className="back-link">← voltar aos caminhos</Link><img src="/assets/mega-tarot-logo.png" alt="Mega Tarot" /></header><section className="reading-page-intro"><p className="eyebrow-light">{theme.label} · leitura personalizada</p><h1>{theme.title}</h1><p>{theme.intro} Responda com a primeira opção que tocar você — não existe resposta certa.</p><div className="progress-wrap"><span>{answered.toString().padStart(2, "0")} de 12 perguntas</span><span>{progress}%</span><div><i style={{ width: `${progress}%` }} /></div></div></section><section className="question-stack">{questions.map(([question, options], index) => <fieldset key={question} className={answers[index] ? "answered" : ""}><legend><span>{String(index + 1).padStart(2, "0")}</span>{question}</legend><div className="option-grid">{options.map(option => <label key={option}><input type="radio" name={`question-${index}`} checked={answers[index] === option} onChange={() => setAnswers(current => current.map((value, i) => i === index ? option : value))} /><span>{option}</span></label>)}</div></fieldset>)}</section><div className="reading-submit"><p>Suas respostas guiam o tom da interpretação.</p>{checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}<button disabled={answered < 12 || loading} onClick={beginReveal}>{loading ? "Abrindo a mesa..." : "Revelar minhas cartas ✦"}</button></div></main>;
}
