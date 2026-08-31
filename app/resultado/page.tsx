"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackPurchaseCompleted } from "../../lib/marketing-pixels";

type Signal =
  | "conexao"
  | "reciprocidade"
  | "intuicao"
  | "incerteza"
  | "movimento"
  | "clareza"
  | "limite"
  | "renovacao"
  | "encerramento"
  | "libertacao"
  | "coragem"
  | "resistencia"
  | "esperanca"
  | "decisao"
  | "abertura"
  | "medo"
  | "estabilidade"
  | "intensidade"
  | "planejamento";

type Card = {
  id: string;
  name: string;
  image: string;
  essence: string;
  affinities: Signal[];
};

type ThemeProfile = {
  label: string;
  title: string;
  intro: string;
  symbol: string;
  pool: string[];
  positions: string[];
  focus: Signal[];
  centralKicker: string;
  centralBody: string;
  fallbacks: string[];
  centralBySignal: Partial<Record<Signal, string>>;
};

/*
 * Cartas recortadas diretamente dos novos arquivos enviados. Cada carta tem
 * uma identidade e um conjunto de afinidades; a leitura usa isso para não
 * repetir a mesma mesa em todos os caminhos.
 */
const cards: Card[] = [
  { id: "lua", name: "A Lua", image: "/assets/tarot-cards/lua.png", essence: "Sensibilidade e pressentimentos pedem silêncio para separar medo de intuição.", affinities: ["intuicao", "incerteza", "medo"] },
  { id: "sacerdotisa", name: "A Sacerdotisa", image: "/assets/tarot-cards/sacerdotisa.png", essence: "O que ainda não foi dito se revela nos detalhes; observe antes de reagir.", affinities: ["intuicao", "incerteza", "resistencia"] },
  { id: "sete-copas", name: "Sete de Copas", image: "/assets/tarot-cards/sete-copas.png", essence: "Muitas possibilidades podem encantar, mas uma escolha consciente devolve o chão.", affinities: ["incerteza", "abertura", "decisao"] },
  { id: "cavaleiro-copas", name: "Cavaleiro de Copas", image: "/assets/tarot-cards/cavaleiro-copas.png", essence: "Um gesto afetivo se aproxima; ele precisa vir acompanhado de presença e constância.", affinities: ["movimento", "conexao", "abertura"] },
  { id: "dois-copas", name: "Dois de Copas", image: "/assets/tarot-cards/dois-copas.png", essence: "A troca fica possível quando escuta e reciprocidade ocupam o mesmo espaço.", affinities: ["conexao", "reciprocidade", "abertura"] },
  { id: "sol", name: "O Sol", image: "/assets/tarot-cards/sol.png", essence: "A verdade ganha luz e devolve leveza para uma conversa que estava confusa.", affinities: ["clareza", "esperanca", "renovacao"] },
  { id: "seis-copas", name: "Seis de Copas", image: "/assets/tarot-cards/seis-copas.png", essence: "A saudade retorna com ternura, mas pede que o passado não seja idealizado.", affinities: ["conexao", "renovacao", "resistencia"] },
  { id: "julgamento", name: "O Julgamento", image: "/assets/tarot-cards/julgamento.png", essence: "Uma história pede consciência: ouvir o chamado sem repetir a antiga versão de vocês.", affinities: ["encerramento", "clareza", "decisao"] },
  { id: "roda-fortuna", name: "A Roda da Fortuna", image: "/assets/tarot-cards/roda-fortuna.png", essence: "O cenário muda de posição; flexibilidade transforma uma espera em oportunidade.", affinities: ["movimento", "renovacao", "esperanca"] },
  { id: "mundo", name: "O Mundo", image: "/assets/tarot-cards/mundo.png", essence: "Um ciclo amadurece e abre espaço para uma escolha mais inteira.", affinities: ["encerramento", "libertacao", "renovacao"] },
  { id: "cavaleiro-paus", name: "Cavaleiro de Paus", image: "/assets/tarot-cards/cavaleiro-paus.png", essence: "A aproximação vem com impulso; cuide para que desejo também tenha direção.", affinities: ["movimento", "intensidade", "coragem"] },
  { id: "oito-copas", name: "Oito de Copas", image: "/assets/tarot-cards/oito-copas.png", essence: "Ir embora do que esvazia não é desistência: é escolher uma paisagem emocional nova.", affinities: ["encerramento", "libertacao", "coragem"] },
  { id: "diabo", name: "O Diabo", image: "/assets/tarot-cards/diabo.png", essence: "Atração e apego se misturam; nomear o padrão devolve liberdade para decidir.", affinities: ["intensidade", "medo", "limite"] },
  { id: "sete-espadas", name: "Sete de Espadas", image: "/assets/tarot-cards/sete-espadas.png", essence: "Nem toda informação está sobre a mesa; preserve sua energia e procure fatos.", affinities: ["incerteza", "limite", "intuicao"] },
  { id: "cinco-espadas", name: "Cinco de Espadas", image: "/assets/tarot-cards/cinco-espadas.png", essence: "Vencer uma discussão não basta quando o vínculo perde respeito no caminho.", affinities: ["limite", "clareza", "encerramento"] },
  { id: "torre", name: "A Torre", image: "/assets/tarot-cards/torre.png", essence: "Uma revelação quebra uma expectativa e libera a verdade que estava represada.", affinities: ["clareza", "encerramento", "libertacao"] },
  { id: "tres-copas", name: "Três de Copas", image: "/assets/tarot-cards/tres-copas.png", essence: "Conversas e influências ao redor importam, mas sua alegria não pode depender de aprovação.", affinities: ["conexao", "intensidade", "abertura"] },
  { id: "dois-espadas", name: "Dois de Espadas", image: "/assets/tarot-cards/dois-espadas.png", essence: "A indecisão protege por um tempo; depois, uma escolha honesta pede passagem.", affinities: ["decisao", "incerteza", "resistencia"] },
  { id: "mago", name: "O Mago", image: "/assets/tarot-cards/mago.png", essence: "Você já tem palavra, presença e recurso para iniciar uma conversa diferente.", affinities: ["movimento", "coragem", "clareza"] },
  { id: "oito-paus", name: "Oito de Paus", image: "/assets/tarot-cards/oito-paus.png", essence: "Mensagens e acontecimentos ganham velocidade; responda sem abandonar seu centro.", affinities: ["movimento", "conexao", "intensidade"] },
  { id: "valete-paus", name: "Valete de Paus", image: "/assets/tarot-cards/valete-paus.png", essence: "Uma curiosidade nova acende a cena; experimente sem transformar impulso em promessa.", affinities: ["abertura", "movimento", "coragem"] },
  { id: "dois-paus", name: "Dois de Paus", image: "/assets/tarot-cards/dois-paus.png", essence: "Planejar o próximo passo evita que a ansiedade escolha por você.", affinities: ["decisao", "movimento", "esperanca"] },
  { id: "carro", name: "O Carro", image: "/assets/tarot-cards/carro.png", essence: "Direção e vontade colocam a história em movimento; escolha para onde conduzir.", affinities: ["coragem", "movimento", "decisao"] },
  { id: "tres-paus", name: "Três de Paus", image: "/assets/tarot-cards/tres-paus.png", essence: "O horizonte se amplia quando você age hoje pensando na vida que quer sustentar.", affinities: ["esperanca", "movimento", "planejamento"] },
  { id: "enamorados", name: "Os Enamorados", image: "/assets/tarot-cards/enamorados.png", essence: "Desejo e escolha se encontram: amar também é alinhar valores e presença.", affinities: ["conexao", "decisao", "abertura"] },
  { id: "ace-copas", name: "Ás de Copas", image: "/assets/tarot-cards/ace-copas.png", essence: "Um sentimento pode nascer de novo quando você se permite receber sem se abandonar.", affinities: ["abertura", "renovacao", "conexao"] },
  { id: "rainha-copas", name: "Rainha de Copas", image: "/assets/tarot-cards/rainha-copas.png", essence: "Acolhimento não é absorver tudo: sua sensibilidade merece limites gentis.", affinities: ["intuicao", "conexao", "limite"] },
  { id: "dez-copas", name: "Dez de Copas", image: "/assets/tarot-cards/dez-copas.png", essence: "A plenitude aparece quando a relação combina afeto, segurança e alegria compartilhada.", affinities: ["esperanca", "estabilidade", "conexao"] },
  { id: "estrela", name: "A Estrela", image: "/assets/tarot-cards/estrela.png", essence: "Depois da noite, a esperança volta sem pedir que você repita velhas versões de si.", affinities: ["renovacao", "esperanca", "abertura"] },
  { id: "justica", name: "A Justiça", image: "/assets/tarot-cards/justica.png", essence: "Fatos, desejos e limites precisam caber na mesma mesa para a escolha ser justa.", affinities: ["clareza", "limite", "decisao"] },
  { id: "rei-espadas", name: "Rei de Espadas", image: "/assets/tarot-cards/rei-espadas.png", essence: "Uma conversa objetiva corta ruídos e mostra o que é possível de verdade.", affinities: ["clareza", "decisao", "limite"] },
  { id: "quatro-espadas", name: "Quatro de Espadas", image: "/assets/tarot-cards/quatro-espadas.png", essence: "Pausa também é movimento quando ela devolve lucidez ao corpo e à mente.", affinities: ["resistencia", "intuicao", "estabilidade"] },
  { id: "enforcado", name: "O Enforcado", image: "/assets/tarot-cards/enforcado.png", essence: "Mudar o ângulo revela que insistir no mesmo gesto não cria uma resposta nova.", affinities: ["resistencia", "decisao", "libertacao"] },
  { id: "eremita", name: "O Eremita", image: "/assets/tarot-cards/eremita.png", essence: "Recolhimento ilumina a própria voz antes de buscar uma confirmação fora.", affinities: ["intuicao", "resistencia", "clareza"] },
  { id: "seis-ouros", name: "Seis de Ouros", image: "/assets/tarot-cards/seis-ouros.png", essence: "Troca equilibrada é o sinal: oferecer e receber deixam de ser movimentos opostos.", affinities: ["reciprocidade", "limite", "estabilidade"] },
  { id: "quatro-paus", name: "Quatro de Paus", image: "/assets/tarot-cards/quatro-paus.png", essence: "Um encontro leve pode criar base, desde que a alegria não esconda conversas necessárias.", affinities: ["conexao", "estabilidade", "renovacao"] },
  { id: "seis-paus", name: "Seis de Paus", image: "/assets/tarot-cards/seis-paus.png", essence: "Reconheça o próprio avanço; aprovação externa não é a medida da sua vitória.", affinities: ["coragem", "esperanca", "movimento"] },
  { id: "ace-ouros", name: "Ás de Ouros", image: "/assets/tarot-cards/ace-ouros.png", essence: "Uma oportunidade concreta nasce devagar e pede presença para virar raiz.", affinities: ["estabilidade", "renovacao", "abertura"] },
  { id: "valete-ouros", name: "Valete de Ouros", image: "/assets/tarot-cards/valete-ouros.png", essence: "O novo cresce em pequenos gestos consistentes, não em promessas grandiosas.", affinities: ["estabilidade", "movimento", "esperanca"] },
  { id: "dez-paus", name: "Dez de Paus", image: "/assets/tarot-cards/dez-paus.png", essence: "Nem toda carga precisa continuar nas suas mãos; espaço livre também é futuro.", affinities: ["limite", "encerramento", "libertacao"] },
  { id: "nove-espadas", name: "Nove de Espadas", image: "/assets/tarot-cards/nove-espadas.png", essence: "A mente ensaia perdas antes que elas aconteçam; volte ao que é concreto hoje.", affinities: ["medo", "incerteza", "intuicao"] },
  { id: "dez-espadas", name: "Dez de Espadas", image: "/assets/tarot-cards/dez-espadas.png", essence: "Um limite definitivo encerra o que já vinha doendo e devolve horizonte.", affinities: ["encerramento", "libertacao", "clareza"] },
  { id: "cinco-ouros", name: "Cinco de Ouros", image: "/assets/tarot-cards/cinco-ouros.png", essence: "Não confunda solidão momentânea com falta de valor; peça apoio e volte para si.", affinities: ["medo", "resistencia", "estabilidade"] },
  { id: "oito-espadas", name: "Oito de Espadas", image: "/assets/tarot-cards/oito-espadas.png", essence: "A sensação de estar presa diminui quando você nomeia a primeira escolha possível.", affinities: ["medo", "limite", "decisao"] },
  { id: "morte", name: "A Morte", image: "/assets/tarot-cards/morte.png", essence: "Transformação pede despedida; o fim de um padrão abre outra forma de amar.", affinities: ["encerramento", "libertacao", "renovacao"] },
  { id: "temperanca", name: "A Temperança", image: "/assets/tarot-cards/temperanca.png", essence: "Cura acontece em ritmo possível: misture desejo e calma sem apagar nenhum dos dois.", affinities: ["estabilidade", "renovacao", "intuicao"] },
  { id: "forca", name: "A Força", image: "/assets/tarot-cards/forca.png", essence: "Coragem suave sustenta seus limites sem transformar cuidado em disputa.", affinities: ["coragem", "limite", "resistencia"] },
  { id: "rei-ouros", name: "Rei de Ouros", image: "/assets/tarot-cards/rei-ouros.png", essence: "Segurança se prova na constância; observe quem permanece quando o encanto passa.", affinities: ["estabilidade", "clareza", "limite"] },
  { id: "rainha-ouros", name: "Rainha de Ouros", image: "/assets/tarot-cards/rainha-ouros.png", essence: "Cuidar de si é criar um lugar interno onde só entra o que nutre.", affinities: ["estabilidade", "limite", "abertura"] },
  { id: "ace-espadas", name: "Ás de Espadas", image: "/assets/tarot-cards/ace-espadas.png", essence: "Uma frase honesta corta a névoa e inaugura uma decisão mais limpa.", affinities: ["clareza", "decisao", "coragem"] },
];

const cardById = Object.fromEntries(cards.map((card) => [card.id, card]));

const profiles: Record<string, ThemeProfile> = {
  feelings: {
    label: "Sentimentos ocultos",
    title: "O que ele sente, mas não demonstra?",
    intro: "A mesa observa o que aparece nos silêncios, nos gestos e no espaço entre uma mensagem e outra.",
    symbol: "☾",
    pool: ["lua", "sacerdotisa", "sete-copas", "cavaleiro-copas", "dois-copas", "sol"],
    positions: ["o sentimento por trás do silêncio", "o que ele guarda", "a dúvida que interfere", "o gesto que pode surgir", "a verdade da conexão"],
    focus: ["intuicao", "conexao", "clareza"],
    centralKicker: "o fio que une o que foi dito e o que ficou guardado",
    centralBody: "A leitura não promete adivinhar outra pessoa. Ela mostra onde observar consistência, comunicação e o respeito que você merece receber.",
    fallbacks: ["O sentimento existe, mas precisa de presença para deixar de ser apenas possibilidade.", "O silêncio perde força quando você escuta primeiro o que sua própria intuição vem repetindo."],
    centralBySignal: {
      intuicao: "Sua percepção captou algo real — agora deixe os gestos repetidos, e não a ansiedade, confirmarem o sentido.",
      conexao: "Há uma ponte afetiva, mas ela só se torna relação quando os dois atravessam com a mesma presença.",
      clareza: "A resposta que você procura começa numa conversa honesta, sem testes e sem precisar diminuir o que sente.",
      medo: "O medo de perder não pode falar mais alto que a evidência de como você está sendo tratada agora.",
    },
  },
  return: {
    label: "Reencontro",
    title: "Existe chance de alguém voltar?",
    intro: "O passado aparece como memória, escolha e possibilidade — nunca como garantia de repetir a mesma história.",
    symbol: "◒",
    pool: ["seis-copas", "julgamento", "roda-fortuna", "mundo", "cavaleiro-paus", "oito-copas"],
    positions: ["a memória que retorna", "o aprendizado do ciclo", "o movimento do destino", "o que precisa amadurecer", "o caminho se houver volta"],
    focus: ["renovacao", "encerramento", "conexao"],
    centralKicker: "o que precisa ser diferente para um retorno valer a pena",
    centralBody: "Se houver reaproximação, use o presente como medida. Saudade abre a porta, mas somente atitudes novas sustentam a entrada.",
    fallbacks: ["O ciclo ainda tem movimento, mas o reencontro só ganha sentido com uma versão mais madura dos dois.", "A história pode se aproximar outra vez; a sua escolha é decidir quais condições tornam isso saudável."],
    centralBySignal: {
      renovacao: "Existe espaço para uma nova conversa, desde que ela não tente ressuscitar a versão antiga dessa relação.",
      encerramento: "Antes de perguntar se alguém volta, perceba se você ainda quer voltar para o lugar que aquela história criava.",
      conexao: "A saudade é um sinal de vínculo, não uma prova de compatibilidade: deixe a reciprocidade confirmar o próximo passo.",
      movimento: "Uma aproximação pode acontecer de forma inesperada, mas o futuro depende do gesto que vem depois da mensagem.",
    },
  },
  third: {
    label: "Terceira energia",
    title: "Há uma energia entre vocês?",
    intro: "A leitura organiza influências externas sem alimentar suposições: fatos e limites vêm antes de qualquer conclusão.",
    symbol: "♢",
    pool: ["diabo", "sete-espadas", "cinco-espadas", "torre", "tres-copas", "dois-espadas"],
    positions: ["o magnetismo da situação", "o que não está claro", "o conflito que pesa", "a revelação necessária", "a escolha que protege você"],
    focus: ["clareza", "limite", "intuicao"],
    centralKicker: "o que é seu, o que é do outro e o que é apenas ruído",
    centralBody: "Nenhuma carta substitui uma conversa ou uma evidência. A orientação central é preservar sua dignidade enquanto você verifica o que é real.",
    fallbacks: ["Existe tensão no campo, mas a sua paz não precisa depender de investigar cada movimento de alguém.", "A melhor proteção contra o ruído é uma pergunta direta acompanhada de um limite claro."],
    centralBySignal: {
      clareza: "A energia pede fatos: uma pergunta simples pode revelar mais do que qualquer tentativa de decifrar sinais escondidos.",
      limite: "Você não precisa competir por um lugar; observe se a relação oferece escolha, respeito e transparência.",
      intuicao: "Sua intuição percebe a mudança, mas use-a como convite para investigar — não como sentença contra você.",
      medo: "A ansiedade quer preencher lacunas; devolva o foco ao que você pode escolher e ao que te mantém segura.",
    },
  },
  next: {
    label: "Próximo movimento",
    title: "Qual será o próximo passo dele?",
    intro: "Aqui o tarot acompanha tendências de conversa, aproximação e atitude — sem transformar possibilidade em promessa.",
    symbol: "⇢",
    pool: ["mago", "oito-paus", "valete-paus", "dois-paus", "carro", "tres-paus"],
    positions: ["o impulso inicial", "a mensagem ou sinal", "a curiosidade que cresce", "o plano ainda em aberto", "a direção mais provável"],
    focus: ["movimento", "coragem", "clareza"],
    centralKicker: "a atitude que transforma expectativa em caminho",
    centralBody: "Movimento saudável é simples de reconhecer: ele aparece em ações que combinam com as palavras e respeitam o ritmo dos dois.",
    fallbacks: ["Um gesto pequeno tende a quebrar o silêncio; observe se ele se sustenta depois do primeiro contato.", "A próxima etapa não pede pressa, pede uma direção que você também consiga escolher."],
    centralBySignal: {
      movimento: "A energia favorece um contato em breve, mas a qualidade do próximo passo será medida pela constância, não pela velocidade.",
      coragem: "Alguém precisa sair do ensaio e agir; faça a sua parte sem carregar a iniciativa dos dois.",
      clareza: "O próximo gesto ganha forma quando a conversa deixa de ser indireta e diz com calma o que cada um procura.",
      conexao: "Há abertura para aproximação, especialmente quando o encontro acontece sem jogos e sem cobrança escondida.",
    },
  },
  love: {
    label: "Caminho do amor",
    title: "Onde o amor pede passagem?",
    intro: "Uma leitura para reconhecer o padrão que pede cuidado e a escolha que pode abrir uma direção mais recíproca.",
    symbol: "♡",
    pool: ["enamorados", "dois-copas", "ace-copas", "rainha-copas", "dez-copas", "estrela"],
    positions: ["a escolha do coração", "a troca possível", "a abertura que nasce", "o cuidado consigo", "a visão de amor que guia"],
    focus: ["conexao", "abertura", "limite"],
    centralKicker: "o amor que começa quando você também entra na própria escolha",
    centralBody: "As cartas não pedem que você sinta menos. Pedem que intensidade, segurança e reciprocidade possam existir na mesma história.",
    fallbacks: ["O amor encontra passagem quando oferecer e receber deixam de ser movimentos desequilibrados.", "Sua próxima escolha afetiva fica mais leve quando o desejo não precisa negociar a própria paz."],
    centralBySignal: {
      conexao: "Existe espaço para troca, mas o vínculo só cresce quando os dois saem da expectativa e entram na presença.",
      abertura: "Uma nova porta aparece quando você permite receber na mesma medida em que oferece.",
      limite: "Seu próximo gesto de amor é consigo: dizer o que precisa sem diminuir a própria voz.",
      esperanca: "Há um horizonte mais gentil se formando; escolha o que traz esperança sem pedir que você aceite migalhas.",
    },
  },
  decision: {
    label: "Encruzilhada",
    title: "Insisto ou viro a página?",
    intro: "A mesa coloca esperança, limite e realidade lado a lado para que a sua decisão não nasça do medo de ficar só.",
    symbol: "⚖",
    pool: ["justica", "rei-espadas", "quatro-espadas", "enforcado", "eremita", "seis-ouros"],
    positions: ["o fato que precisa ser visto", "a conversa necessária", "o descanso antes da escolha", "o ponto de suspensão", "a medida da reciprocidade"],
    focus: ["clareza", "decisao", "limite"],
    centralKicker: "a escolha que devolve coerência para o seu coração",
    centralBody: "Insistir só faz sentido quando existe resposta do outro lado. Caso contrário, virar a página pode ser a forma mais concreta de se escolher.",
    fallbacks: ["A decisão amadurece quando a sua paz pesa tanto quanto a vontade de continuar.", "Você não precisa de mais um sinal impossível: precisa comparar desejo com realidade e escolher com respeito por si."],
    centralBySignal: {
      clareza: "A verdade fica menos assustadora quando você separa o que aconteceu do que gostaria que acontecesse.",
      decisao: "A encruzilhada pede um gesto definido: escolha a direção que você consegue sustentar depois de hoje.",
      limite: "Se apenas você sustenta o vínculo, o limite não é punição — é a maneira de parar de se abandonar.",
      medo: "Não transforme o medo de perder em motivo para permanecer onde a sua presença não é reconhecida.",
    },
  },
  near: {
    label: "Próximas semanas",
    title: "Que novidade se aproxima?",
    intro: "Uma fotografia das oportunidades, encontros e convites que podem ganhar forma no seu cotidiano próximo.",
    symbol: "✧",
    pool: ["estrela", "tres-paus", "quatro-paus", "seis-paus", "ace-ouros", "valete-ouros"],
    positions: ["a esperança que acende", "o horizonte", "o encontro possível", "o reconhecimento", "a oportunidade concreta"],
    focus: ["renovacao", "esperanca", "estabilidade"],
    centralKicker: "o pequeno sinal que abre uma temporada mais leve",
    centralBody: "O novo chega por caminhos comuns: uma conversa, um convite ou uma escolha prática que devolve movimento ao seu dia.",
    fallbacks: ["Uma oportunidade simples se aproxima; deixe espaço na agenda e no coração para reconhecê-la.", "O inesperado aparece quando você volta a circular por lugares onde a sua energia se sente viva."],
    centralBySignal: {
      renovacao: "Há uma virada suave no horizonte: aceite o que for novo sem exigir que já venha com todas as respostas.",
      esperanca: "A esperança deixa de ser espera quando vira disponibilidade para encontrar algo diferente do padrão antigo.",
      estabilidade: "A novidade mais importante é uma base: escolha o que cresce com constância, não apenas o que brilha no primeiro instante.",
      movimento: "Um convite ou mensagem pode abrir a próxima cena; diga sim ao que combina com a vida que você quer viver.",
    },
  },
  block: {
    label: "Padrão repetido",
    title: "Qual ciclo está pedindo fim?",
    intro: "A leitura nomeia a ferida que se repete e aponta um limite possível para que o próximo capítulo não copie o anterior.",
    symbol: "⟲",
    pool: ["dez-paus", "nove-espadas", "dez-espadas", "cinco-ouros", "oito-espadas", "morte"],
    positions: ["o peso acumulado", "o medo que acorda à noite", "o limite definitivo", "a sensação de falta", "a saída possível"],
    focus: ["encerramento", "libertacao", "limite"],
    centralKicker: "o fim que devolve energia para a sua própria vida",
    centralBody: "Encerrar um padrão não apaga o que você viveu. Significa parar de oferecer novas chances para o mesmo comportamento sem mudança.",
    fallbacks: ["O ciclo muda quando o seu limite deixa de ser um pedido e vira uma prática diária.", "Você já reconheceu a ferida; agora a liberdade começa na primeira escolha que não a alimenta."],
    centralBySignal: {
      encerramento: "A história já entregou o aprendizado principal; fechar a porta pode ser o gesto que protege a sua próxima fase.",
      libertacao: "Soltar não é perder: é retirar suas mãos do que nunca esteve sob o seu controle.",
      limite: "O padrão perde força quando você deixa de negociar o mínimo que precisa para se sentir respeitada.",
      medo: "O medo de repetir o passado diminui quando a sua decisão se apoia em fatos e em uma rede de cuidado.",
    },
  },
  message: {
    label: "Recado da intuição",
    title: "Qual recado sua intuição traz?",
    intro: "Quando a pergunta ainda não encontrou palavras, começamos pelo que o corpo e a sua história já sabem.",
    symbol: "☼",
    pool: ["temperanca", "forca", "rei-ouros", "rainha-ouros", "ace-espadas", "sol"],
    positions: ["a cura em andamento", "a coragem gentil", "o que é consistente", "o cuidado que nutre", "a verdade que liberta"],
    focus: ["intuicao", "estabilidade", "clareza"],
    centralKicker: "a frase que sua parte mais lúcida vem repetindo",
    centralBody: "Use a leitura como espelho: a decisão continua sua, mas a sensação de alívio depois de uma escolha costuma dizer muito.",
    fallbacks: ["Você não está atrasada; está reorganizando o que precisa ser verdade antes de abrir uma nova porta.", "A intuição fala baixo, mas permanece: confie no que traz presença em vez de urgência."],
    centralBySignal: {
      intuicao: "A resposta já apareceu em pequenas sensações; pare de pedir permissão para confiar no que você percebe.",
      estabilidade: "O recado é simples: escolha o que permanece inteiro depois que a emoção do primeiro momento passa.",
      clareza: "Dê nome ao que você sabe. Uma verdade pronunciada com calma pode reorganizar toda a próxima etapa.",
      coragem: "Você não precisa esperar ausência de medo para agir — precisa de um passo pequeno que honre o que sente.",
    },
  },
};

const signalWords: Record<Signal, string[]> = {
  conexao: ["saudade", "mensagem", "encontro", "conexao", "reciprocidade", "presenca", "ouvida"],
  reciprocidade: ["reciprocidade", "oferecendo", "recebe", "equilibrio"],
  intuicao: ["curiosidade", "lembranca", "intuicao", "paz", "sensacao", "silencio"],
  incerteza: ["ansiedade", "silencio", "duvida", "medo", "tensao", "parada", "urgencia"],
  movimento: ["iniciativa", "encontro", "conversa", "agir", "atitude", "aproximacao", "passo", "mensagem"],
  clareza: ["diretamente", "verdade", "clareza", "falar", "ouvida", "escolher", "honesta"],
  limite: ["limites", "proteger", "anular", "migalhas", "seguranca", "cansaco", "tolerar"],
  renovacao: ["novo", "recomecar", "novidade", "esperanca", "respirar", "futuro", "mudou"],
  encerramento: ["acabou", "soltar", "despedida", "fechamento", "partir", "fim", "deixar"],
  libertacao: ["migalhas", "cansado", "peso", "soltar", "deixar", "livre"],
  coragem: ["coragem", "escolher", "atitude", "iniciativa", "direcao"],
  resistencia: ["cansaco", "tolerar", "esperar", "proteger", "paciencia", "fechar"],
  esperanca: ["esperanca", "futuro", "reciprocidade", "nova", "novidade"],
  decisao: ["escolher", "decisao", "proximo passo", "direcao", "partir"],
  abertura: ["abertura", "permitir", "recomecar", "sim", "receber", "entrega"],
  medo: ["medo", "perder", "decepcao", "ansiedade", "acabou"],
  estabilidade: ["paz", "seguranca", "calma", "presenca", "rotina", "constante"],
  intensidade: ["intensidade", "desejo", "urgencia", "atracao", "quimica"],
  planejamento: ["planejar", "rotina", "futuro", "proximo passo"],
};

const signalLabels: Partial<Record<Signal, string>> = {
  conexao: "conexão",
  reciprocidade: "reciprocidade",
  intuicao: "intuição",
  incerteza: "incerteza",
  movimento: "movimento",
  clareza: "clareza",
  limite: "limite",
  renovacao: "renovação",
  encerramento: "encerramento",
  libertacao: "libertação",
  coragem: "coragem",
  resistencia: "resistência",
  esperanca: "esperança",
  decisao: "decisão",
  abertura: "abertura",
  medo: "medo",
  estabilidade: "estabilidade",
  intensidade: "intensidade",
  planejamento: "planejamento",
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = (result * 31 + value.charCodeAt(index)) >>> 0;
  return result;
}

function scoreSignals(answers: string[]) {
  const text = normalize(answers.join(" · "));
  return Object.fromEntries(
    Object.entries(signalWords).map(([signal, words]) => [signal, words.reduce((score, word) => score + (text.includes(normalize(word)) ? 1 : 0), 0)]),
  ) as Record<Signal, number>;
}

function getProfile(id: string) {
  return profiles[id] || profiles.love;
}

export default function ResultPage() {
  const [readingId, setReadingId] = useState("love");
  const [answers, setAnswers] = useState<string[]>([]);
  const [orderId, setOrderId] = useState("");
  const [accessState, setAccessState] = useState<"checking" | "paid" | "blocked" | "error">("checking");
  const [accessMessage, setAccessMessage] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("id") || "love";
    const currentOrderId = params.get("orderId") || "";
    setReadingId(profiles[requestedId] ? requestedId : "love");
    setOrderId(currentOrderId);

    if (!currentOrderId) {
      setAccessState("blocked");
      setAccessMessage("O resultado só aparece depois que o Pix for confirmado.");
      return;
    }

    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/payment/status?orderId=${encodeURIComponent(currentOrderId)}`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Não foi possível validar o pagamento.");
        if (!active) return;
        if (payload.status !== "paid" || payload.paid !== true) {
          setAccessState("blocked");
          setAccessMessage("A confirmação ainda não chegou. Volte ao pagamento para acompanhar seu Pix.");
          return;
        }

        const validReadingId = profiles[payload.readingId] ? payload.readingId : requestedId;
        trackPurchaseCompleted({
          orderId: currentOrderId,
          readingId: validReadingId,
          offerName: payload.offerName,
          amount: payload.amount,
        });
        setReadingId(validReadingId);
        if (Array.isArray(payload.answers)) {
          setAnswers(payload.answers.filter((answer: unknown): answer is string => typeof answer === "string"));
        } else {
          try {
            const saved = JSON.parse(window.localStorage.getItem("mega-tarot-reading") || "{}");
            setAnswers(Array.isArray(saved.answers) ? saved.answers.filter((answer: unknown): answer is string => typeof answer === "string") : []);
          } catch {
            setAnswers([]);
          }
        }
        setAccessState("paid");
      } catch (error) {
        if (!active) return;
        setAccessState("error");
        setAccessMessage(error instanceof Error ? error.message : "Não foi possível validar o pagamento.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const profile = getProfile(readingId);
  const signalScores = useMemo(() => scoreSignals(answers), [answers]);
  const dominantSignal = useMemo(() => {
    const ranked = (Object.entries(signalScores) as [Signal, number][]).sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[1] ? ranked[0][0] : profile.focus[hash(answers.join("|")) % profile.focus.length];
  }, [answers, profile.focus, signalScores]);

  const selectedCards = useMemo(() => {
    const text = normalize(answers.join(" | "));
    const ranked = profile.pool
      .map((cardId, index) => {
        const card = cardById[cardId];
        const affinity = card.affinities.reduce((total, signal) => total + (signalScores[signal] || 0), 0);
        const focusBonus = card.affinities.reduce((total, signal) => total + (profile.focus.includes(signal) ? 2 : 0), 0);
        const variation = (hash(`${readingId}:${text}:${cardId}`) % 1000) / 100000;
        return { card, score: affinity * 5 + focusBonus + variation - index / 10000 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ card }) => card);

    return selectedCardsFallback(ranked, profile, signalScores, readingId);
  }, [answers, profile, readingId, signalScores]);

  const central = useMemo(() => {
    const message = profile.centralBySignal[dominantSignal];
    return message || profile.fallbacks[hash(`${readingId}:${answers.join("|")}`) % profile.fallbacks.length];
  }, [answers, dominantSignal, profile, readingId]);

  async function share() {
    const data = { title: "Minha leitura no MegaTarot", text: `${central} · descubra sua leitura no MegaTarot`, url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard?.writeText(window.location.href);
      window.alert("Link copiado para compartilhar.");
    }
  }

  if (accessState !== "paid") {
    const paymentHref = orderId
      ? `/pagamento?orderId=${encodeURIComponent(orderId)}&id=${encodeURIComponent(readingId)}`
      : `/leitura?id=${encodeURIComponent(readingId)}`;
    return <main className="result-gate-page"><div className="result-page-bg" /><img className="result-gate-logo" src="/assets/mega-tarot-logo.png" alt="Mega Tarot" /><section className="result-gate-card"><div className={accessState === "checking" ? "loading-orbit" : "result-gate-sigil"}>{accessState === "checking" ? "✦" : "✧"}</div><p className="eyebrow-light">{accessState === "checking" ? "consultando a mesa" : "resultado protegido"}</p><h1>{accessState === "checking" ? <>Um instante para<br /><em>abrir suas cartas.</em></> : <>Sua leitura está<br /><em>guardada por um selo.</em></>}</h1><p>{accessState === "checking" ? "Estamos confirmando o pagamento com segurança." : accessMessage}</p>{accessState !== "checking" && <Link className="gold-cta" href={paymentHref}>{orderId ? "Voltar ao pagamento" : "Escolher uma leitura"} <span>↗</span></Link>}</section></main>;
  }

  return (
    <main className="result-page">
      <div className="result-page-bg" />
      <header className="reading-page-top">
        <Link href="/" className="back-link">← novos caminhos</Link>
        <img src="/assets/mega-tarot-logo.png" alt="Mega Tarot" />
      </header>

      <section className="result-intro">
        <p className="eyebrow-light">sua mesa · {profile.label}</p>
        <h1>{profile.title}<br /><em>ganhou um novo sentido.</em></h1>
        <p>{profile.intro} As suas 12 escolhas orientaram esta combinação de símbolos; leia sem pressa e perceba qual carta permanece com você.</p>
      </section>

      <section className="result-card-grid" aria-label={`Cinco cartas da leitura ${profile.label}`}>
        {selectedCards.map((card, index) => (
          <article className="result-card-box" key={`${card.id}-${index}`}>
            <div className="result-card-art"><img src={card.image} alt={`Carta ${card.name}`} /></div>
            <p>{profile.positions[index]}</p>
            <h2>{card.name}</h2>
            <span>{card.essence}</span>
          </article>
        ))}
      </section>

      <section className="central-reading">
        <div className="central-sigil">{profile.symbol}</div>
        <p className="eyebrow-light">{profile.centralKicker}</p>
        <h2>{central}</h2>
        <p>{profile.centralBody}</p>
        <div className="central-signal">fio dominante: <strong>{signalLabels[dominantSignal] || dominantSignal}</strong></div>
      </section>

      <div className="result-actions">
        <button onClick={share}>Compartilhar minha leitura <span>↗</span></button>
        <Link href="/">Fazer outra pergunta</Link>
      </div>
    </main>
  );
}

function selectedCardsFallback(ranked: Card[], profile: ThemeProfile, signalScores: Record<Signal, number>, readingId: string) {
  if (ranked.length >= 5) return ranked;
  const used = new Set(ranked.map((card) => card.id));
  return cards
    .filter((card) => !used.has(card.id))
    .sort((a, b) => {
      const score = (card: Card) => card.affinities.reduce((total, signal) => total + (signalScores[signal] || 0), 0) + (profile.focus.some((signal) => card.affinities.includes(signal)) ? 1 : 0) + (hash(`${readingId}:${card.id}`) % 100) / 10000;
      return score(b) - score(a);
    })
    .slice(0, 5 - ranked.length)
    .concat(ranked);
}
