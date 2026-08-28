"use client";

import { useMemo, useState, type CSSProperties } from "react";

type ReadingId = "feelings" | "return" | "third" | "next" | "love" | "decision" | "near" | "block" | "message";
type Reading = { id: ReadingId; number: string; label: string; title: string; description: string; symbol: string; questions: string[]; insight: string };

const readings: Reading[] = [
  { id: "feelings", number: "01", label: "Sentimentos ocultos", title: "O que ele sente, mas não demonstra?", description: "Para ler sinais, silêncios e desejos que ficaram nas entrelinhas.", symbol: "☾", questions: ["Quem é a pessoa que está no seu pensamento?", "Qual atitude dele deixou você em dúvida?", "Se pudesse ouvir uma verdade agora, qual seria?"], insight: "Há sentimento, mas ele está protegido por medo e orgulho. O que parece distância pode ser uma forma desajeitada de observar se você ainda está ali. Repare no gesto que se repete — é nele que a verdade aparece." },
  { id: "return", number: "02", label: "Reencontro", title: "Existe chance de alguém voltar?", description: "Uma leitura sobre saudade, ciclos inacabados e possíveis reaproximações.", symbol: "◒", questions: ["Há quanto tempo vocês se afastaram?", "O que ficou sem ser dito entre vocês?", "Você quer a pessoa de volta ou a sensação que viveu?"], insight: "O ciclo ainda não perdeu totalmente a força. Antes de esperar uma mensagem, entenda qual versão dessa história você aceitaria reencontrar. O retorno só faz sentido quando vem acompanhado de uma atitude diferente." },
  { id: "third", number: "03", label: "Terceira energia", title: "Há uma energia entre vocês?", description: "Para compreender influências externas sem alimentar ansiedade ou suposições.", symbol: "♢", questions: ["O que fez você desconfiar?", "Como a comunicação entre vocês mudou?", "Qual limite você precisa proteger nesta situação?"], insight: "A leitura pede fatos antes de conclusões. Existe uma energia de comparação e insegurança rondando a relação, mas a resposta mais importante não está em investigar alguém — está em perceber se você se sente escolhida." },
  { id: "next", number: "04", label: "Próximo movimento", title: "Qual será o próximo passo dele?", description: "Para enxergar tendências de conversa, encontro e aproximação.", symbol: "⇢", questions: ["Como foi o último contato entre vocês?", "O que você gostaria que acontecesse a seguir?", "Você prefere esperar ou tomar a iniciativa?"], insight: "Um movimento pequeno quebra o silêncio. A energia mostra aproximação gradual, não uma grande declaração repentina. Uma conversa leve pode revelar muito mais do que uma cobrança feita no calor da expectativa." },
  { id: "love", number: "05", label: "Caminho do amor", title: "O que está travando sua vida amorosa?", description: "Para reconhecer padrões, medos e escolhas que pedem uma nova direção.", symbol: "♡", questions: ["Que padrão costuma se repetir nas suas relações?", "O que você tem medo de perder quando se entrega?", "Como seria uma relação segura para você?"], insight: "Você não precisa se tornar menos intensa para ser amada. O bloqueio aparece quando você tenta adivinhar o outro e abandona o que precisa. Clareza começa quando seu desejo também entra na conversa." },
  { id: "decision", number: "06", label: "Encruzilhada", title: "Insisto ou viro a página?", description: "Para tomar uma decisão sem confundir esperança com espera.", symbol: "⚖", questions: ["O que ainda faz você ficar?", "Que sinal mostraria que é hora de partir?", "Como você se sente depois de falar com essa pessoa?"], insight: "A resposta não pede pressa, pede coerência. Se a relação só existe quando você sustenta tudo sozinha, as cartas sugerem devolver o peso a quem também faz parte da história." },
  { id: "near", number: "07", label: "Próximas semanas", title: "Que novidade se aproxima?", description: "Uma fotografia intuitiva da energia que se aproxima do seu campo afetivo.", symbol: "✧", questions: ["O que mudou na sua rotina recentemente?", "Qual encontro ou conversa você está esperando?", "Que novidade faria seu coração respirar melhor?"], insight: "Uma surpresa chega por um caminho cotidiano, sem anúncio. A energia favorece convites, mensagens e uma nova curiosidade. Diga sim ao que for simples e recíproco — é aí que o inesperado encontra espaço." },
  { id: "block", number: "08", label: "Padrão repetido", title: "Qual ciclo está pedindo fim?", description: "Para nomear feridas antigas e interromper escolhas que cansam.", symbol: "⟲", questions: ["Em qual momento você costuma se fechar?", "O que você tolera para não perder alguém?", "Qual versão sua você quer deixar para trás?"], insight: "Você aprendeu a chamar de intensidade aquilo que muitas vezes era falta de segurança. O próximo ciclo muda quando o seu limite deixa de ser uma ameaça e passa a ser uma forma de cuidado." },
  { id: "message", number: "09", label: "Recado da intuição", title: "O que você precisa ouvir hoje?", description: "Uma mensagem aberta para quando a pergunta ainda não encontrou palavras.", symbol: "☼", questions: ["Qual sentimento está mais forte hoje?", "O que você vem evitando admitir?", "Complete: eu mereço uma relação que..."], insight: "Você não está atrasada. Existe uma parte sua reorganizando tudo em silêncio para que a próxima escolha não nasça da carência. Confie no alívio que aparece quando algo deixa de precisar ser forçado." },
];

const cardAssets = ["/assets/tarot-rose.png", "/assets/tarot-fan.png", "/assets/tarot-table.png"];

const readingGroups = [
  { kicker: "Sentimentos, saudade e conexões", title: "Vida amorosa", number: "I", items: readings.slice(0, 3) },
  { kicker: "Escolhas, limites e próximos passos", title: "Decisões e caminhos", number: "II", items: readings.slice(3, 6) },
  { kicker: "Tendências, ciclos e mensagens", title: "Planejamento futuro", number: "III", items: readings.slice(6, 9) },
];

export default function Home() {
  const [selected, setSelected] = useState<Reading | null>(null);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [stage, setStage] = useState<"choose" | "form" | "loading" | "result">("choose");
  const [revealStep, setRevealStep] = useState(0);

  const resultTitle = useMemo(() => selected ? `Sua leitura · ${selected.label}` : "", [selected]);

  function openReading(reading: Reading) {
    const params = new URLSearchParams(window.location.search);
    params.set("id", reading.id);
    window.location.assign(`/leitura?${params.toString()}`);
  }

  function submitReading() {
    setStage("loading");
    setRevealStep(0);
    window.setTimeout(() => setRevealStep(1), 750);
    window.setTimeout(() => setRevealStep(2), 1500);
    window.setTimeout(() => { setRevealStep(3); setStage("result"); }, 2400);
  }

  return <main className="site-shell">
    <section className="hero-v2">
      <img className="hero-v2-image" src="/assets/julia-offer.png" alt="Julia com um baralho de tarot em uma mesa" />
      <div className="hero-v2-shade" />
      <img className="hero-v2-ornament" src="/assets/ornament-crescent.png" alt="" aria-hidden="true" />
      <div className="hero-card-fan" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((card) => <span key={card} style={{ "--card-index": card } as CSSProperties} />)}
      </div>
      <nav className="topbar"><img className="topbar-logo" src="/assets/mega-tarot-logo.png" alt="Mega Tarot" /><span className="topbar-note">um espaço para a sua intuição</span><span className="nav-dot">●</span></nav>
      <div className="hero-v2-copy"><p className="eyebrow-light">Tarot intuitivo e personalizado</p><h1>As cartas revelam.<br /><em>Você decide.</em></h1><p>Escolha o tema que ocupa seus pensamentos e receba uma leitura construída a partir das suas respostas.</p><button className="ghost-cta" onClick={() => document.getElementById("portas")?.scrollIntoView({ behavior: "smooth" })}>Escolher minha leitura <span>↓</span></button><div className="hero-trust"><span>9 caminhos de leitura</span><span>resultado personalizado</span></div></div>
    </section>

    <section className="portals-section" id="portas">
      <img className="portal-corner" src="/assets/ornament-corner.png" alt="" aria-hidden="true" />
      <div className="section-heading-v2"><p className="eyebrow-dark">Encontre o tema da sua pergunta</p><h2>O que você veio<br /><em>descobrir hoje?</em></h2><p>Escolha uma área e depois toque na pergunta que mais parece ter sido escrita para você.</p></div>
      <div className="reading-groups">{readingGroups.map(group => <section className="reading-group" key={group.title}><div className="group-heading"><div><p>{group.kicker}</p><h3>{group.title}</h3></div><span className="group-line" /></div><div className="reading-grid">{group.items.map(reading => <button className="reading-tile" key={reading.id} onClick={() => openReading(reading)}><span className="tile-symbol">{reading.symbol}</span><span className="tile-label">{reading.label}</span><span className="tile-title">{reading.title}</span><span className="tile-description">{reading.description}</span></button>)}</div></section>)}</div>
      <img className="portal-cards" src="/assets/tarot-rose.png" alt="Cartas antigas com uma rosa seca" />
    </section>

    {selected && <section className="reading-v2" id="leitura"><img className="reading-bg-image" src="/assets/julia-shuffling.png" alt="" aria-hidden="true" /><div className="reading-overlay" /><div className="reading-v2-inner">
      {stage === "form" && <><div className="reading-topline"><span>{selected.number} / 09</span><span>{selected.label}</span></div><p className="eyebrow-light">Uma pergunta íntima · passo 01</p><h2>{selected.title}</h2><p className="reading-lead">{selected.description} Responda como se estivesse contando isso para alguém de confiança.</p><div className="question-list-v2">{selected.questions.map((question, i) => <label key={question}><span>{String(i + 1).padStart(2, "0")}</span><strong>{question}</strong><textarea value={answers[i]} onChange={e => setAnswers(a => a.map((v, n) => n === i ? e.target.value : v))} placeholder="escreva aqui..." rows={2} /></label>)}</div><button className="gold-cta" onClick={submitReading}>Virar as cartas <span>✦</span></button></>}
      {stage === "loading" && <div className="loading-state-v2"><div className="loading-seal"><img src="/assets/seal.png" alt="" /></div><p className="eyebrow-light">{revealStep > 1 ? "a mesa está em silêncio" : "sintonizando sua pergunta"}</p><h2>Revelando suas cartas<span className="dots">...</span></h2><p>Não tente encontrar a resposta. Deixe que ela apareça.</p></div>}
      {stage === "result" && <div className="result-state-v2"><div className="reading-topline"><span>{selected.number} / 09</span><span>{resultTitle}</span></div><p className="eyebrow-light">A mesa respondeu</p><h2>Três símbolos para<br /><em>o seu momento.</em></h2><div className="result-cards-v2">{["A Lua", "Dois de Copas", "A Estrela"].map((name, i) => <div className="result-card-v2" key={name}><div className="result-card-image"><img src={cardAssets[i]} alt="" /></div><span>{name}</span><small>{["o que está oculto", "o que se aproxima", "o que pede confiança"][i]}</small></div>)}</div><p className="insight-v2">{selected.insight}</p><button className="text-button-v2" onClick={() => setStage("form")}>Refazer a pergunta ↗</button></div>}
    </div></section>}

    <section className="about-v2"><img className="about-texture" src="/assets/bg-paper.png" alt="" aria-hidden="true" /><div className="about-orbit"><div className="about-photo"><img src="/assets/julia.png" alt="Julia, criadora do MegaTarot" /></div><span className="orbit-word orbit-top">9 ANOS DE INTUIÇÃO</span><span className="orbit-word orbit-bottom">JULIA · MEGATAROT</span></div><div className="about-copy-v2"><p className="eyebrow-dark">Quem segura o baralho</p><h2>Eu sou a Julia.<br /><em>Prazer em te encontrar.</em></h2><p>Há 9 anos estudo o tarot como uma linguagem de símbolos — não para dizer o que você deve fazer, mas para iluminar o que já está tentando nascer dentro de você.</p><p>O MegaTarot é o meu jeito de abrir essa conversa com calma, acolhimento e um toque de mistério.</p><div className="about-links"><a href="https://instagram.com/julitadotarot" target="_blank" rel="noreferrer"><img className="social-mark" src="/assets/instagram-mark.png" alt="" /><span className="social-name">Instagram</span><span>@julitadotarot</span> ↗</a><a href="https://tiktok.com/@juliadotarot" target="_blank" rel="noreferrer"><img className="social-mark" src="/assets/tiktok-mark.png" alt="" /><span className="social-name">TikTok</span><span>@juliadotarot</span> ↗</a></div></div></section>

    <footer className="footer-v2"><img src="/assets/mega-tarot-logo.png" alt="Mega Tarot" /><span>uma pergunta pode mudar tudo</span><span>© 2026</span></footer>
  </main>;
}
