import { describe, expect, it } from "vitest";
import {
  acertoComMargem,
  agendarReteste,
  alocarPorMaiorRestoEstudo,
  embaralharComSemente,
  intercalarPorMicrotema,
  montarFilaEstudo,
  montarSondaEstudo,
  wilson,
  type CardEstudo,
  type EntradaSondaEstudo,
  type Questao,
  type ReviewCard,
} from "./estudos";

describe("wilson — régua espelho de zeno_cloud/src/lib/estudos/margem.ts", () => {
  it("zero acertos: superior é o teto da amostra minúscula", () => {
    expect(wilson(0, 1).superior).toBeCloseTo(0.7935, 3);
    expect(wilson(0, 2).superior).toBeCloseTo(0.658, 3);
  });

  it("certeza total: 1 de 1", () => {
    expect(wilson(1, 1).inferior).toBeCloseTo(0.207, 3);
    expect(wilson(1, 1).superior).toBeCloseTo(1, 3);
  });

  it("meia dúzia de casos com n=16 e n=43", () => {
    expect(wilson(7, 16).inferior).toBeCloseTo(0.231, 3);
    expect(wilson(7, 16).superior).toBeCloseTo(0.668, 3);
    expect(wilson(8, 16).inferior).toBeCloseTo(0.28, 3);
    expect(wilson(8, 16).superior).toBeCloseTo(0.72, 3);
    expect(wilson(12, 16).inferior).toBeCloseTo(0.505, 3);
    expect(wilson(12, 16).superior).toBeCloseTo(0.898, 3);
    expect(wilson(20, 43).inferior).toBeCloseTo(0.325, 3);
    expect(wilson(20, 43).superior).toBeCloseTo(0.611, 3);
  });

  it("amostra vazia e contagem impossível lançam", () => {
    expect(() => wilson(0, 0)).toThrow("wilson exige n >= 1");
    expect(() => wilson(2, 1)).toThrow("acertos (2) fora do intervalo 0 a 1");
  });
});

describe("acertoComMargem — formato único do Estudos", () => {
  it("vírgula decimal, EN DASH entre limites, · como separador", () => {
    expect(acertoComMargem(0, 1)).toBe("0,0% · IC95 0,0%–79,3% · n=1");
    expect(acertoComMargem(7, 16)).toBe("43,8% · IC95 23,1%–66,8% · n=16");
    expect(acertoComMargem(12, 16)).toBe("75,0% · IC95 50,5%–89,8% · n=16");
  });
});

// ── montarFilaEstudo — espelho da fila do Zeno (zeno_cloud/src/lib/estudos/
// fila.ts). Datas fixas via parâmetro `hoje`: o teste não depende do relógio.

const HOJE = "2026-09-16";

function card(id: string, microtemaPdId?: string): CardEstudo {
  return { id, microtemaPdId, frente: `frente ${id}`, verso: `verso ${id}`, provenance: { tipo: "pd", ref: id, data: HOJE } };
}

function questao(id: string): Questao {
  return {
    id,
    enunciado: `enunciado ${id}`,
    alternativas: ["a", "b"],
    tipo: "mc",
    origem: "gerada",
    gabaritoIA: 0,
    provenance: { tipo: "simulado", ref: id, data: HOJE },
  };
}

function review(cardId: string, dueEm: string): ReviewCard {
  return { cardId, dueEm, ease: 2.5, intervaloDias: 1, repeticoes: 1 };
}

describe("montarFilaEstudo — fila zero-decisão com orçamento em minutos", () => {
  it("composição: 10 vencidas + 3 erradas + 20 min → 4 novas cabem nos 16 usados", () => {
    const vencidas = Array.from({ length: 10 }, (_, i) => card(`v${i}`));
    const reviews = vencidas.map((c, i) => review(c.id, `2026-09-${String(i + 1).padStart(2, "0")}`));
    const erradas = [1, 2, 3].map((i) => questao(`e${i}`));
    const novas = Array.from({ length: 4 }, (_, i) => card(`n${i}`));
    const fila = montarFilaEstudo(
      [...vencidas, ...novas],
      reviews,
      erradas,
      erradas.map((q) => q.id),
      null,
      20,
      HOJE
    );
    expect(fila.composicao).toEqual({ vencidas: 10, erradas: 3, novas: 4 });
    expect(fila.minutos).toBe(20);
  });

  it("item inteiro: orçamento 5 fecha a 2ª errada (6 > 5) — nada depois entra", () => {
    const cards = [card("v1"), card("v2"), card("n1")];
    const reviews = [review("v1", "2026-09-14"), review("v2", "2026-09-15")];
    const questoes = [questao("e1"), questao("e2")];
    const fila = montarFilaEstudo(cards, reviews, questoes, ["e1", "e2"], null, 5, HOJE);
    expect(fila.composicao).toEqual({ vencidas: 2, erradas: 1, novas: 0 });
    expect(fila.minutos).toBe(4);
  });

  it("vencidas: due mais antigo primeiro", () => {
    const cards = [card("c-tarde"), card("c-cedo"), card("c-meio")];
    const reviews = [
      review("c-tarde", "2026-09-15"),
      review("c-cedo", "2026-09-10"),
      review("c-meio", "2026-09-12"),
    ];
    const fila = montarFilaEstudo(cards, reviews, [], [], null, 3, HOJE);
    expect(fila.itens.map((i) => i.card?.id)).toEqual(["c-cedo", "c-meio", "c-tarde"]);
  });


  it("vencidas com a MESMA due: empate preserva a ordem de entrada (igual ao motor)", () => {
    const cards = [card("c-b"), card("c-a"), card("c-ante")];
    const reviews = [
      review("c-b", "2026-09-10"),
      review("c-a", "2026-09-10"),
      review("c-ante", "2026-09-01"),
    ];
    const fila = montarFilaEstudo(cards, reviews, [], [], null, 3, HOJE);
    expect(fila.itens.map((i) => i.card?.id)).toEqual(["c-ante", "c-b", "c-a"]);
  });

  it("novas: microtema alvo antes das demais", () => {
    const cards = [card("fora-a", "outro"), card("alvo-b", "m2"), card("fora-b", "outro"), card("alvo-a", "m2")];
    const fila = montarFilaEstudo(cards, [], [], [], "m2", 2, HOJE);
    expect(fila.itens.map((i) => i.card?.id)).toEqual(["alvo-b", "alvo-a"]);
  });

  it("questão custa 2 min: orçamento 2 traz 1 errada; orçamento 1 não traz nada", () => {
    const erradas = [questao("e1"), questao("e2")];
    const com2 = montarFilaEstudo([], [], erradas, ["e1", "e2"], null, 2, HOJE);
    expect(com2.composicao).toEqual({ vencidas: 0, erradas: 1, novas: 0 });
    expect(com2.minutos).toBe(2);
    const com1 = montarFilaEstudo([], [], erradas, ["e1", "e2"], null, 1, HOJE);
    expect(com1.itens).toHaveLength(0);
    expect(com1.minutos).toBe(0);
  });
});

// ── Sonda — espelho de zeno_cloud/src/lib/estudos/{sonda,embaralhar}.ts ────

describe("alocarPorMaiorRestoEstudo — divisão proporcional com rotação do excedente", () => {
  it("maior resto: sobra vai aos maiores restos fracionários (8 e 16)", () => {
    const pesos = { m1: 0.2, m2: 0.4, m3: 0.3, m4: 0.1 };
    expect(alocarPorMaiorRestoEstudo(pesos, 8, 0)).toEqual({ m1: 2, m2: 3, m3: 2, m4: 1 });
    const r8 = alocarPorMaiorRestoEstudo(pesos, 8, 0);
    expect(Object.values(r8).reduce((s, v) => s + v, 0)).toBe(8);
    const r16 = alocarPorMaiorRestoEstudo(pesos, 16, 0);
    expect(r16).toEqual({ m1: 3, m2: 6, m3: 5, m4: 2 });
    expect(Object.values(r16).reduce((s, v) => s + v, 0)).toBe(16);
  });

  it("empate de resto: rotação dá o excedente a outro módulo na rodada seguinte", () => {
    const pesos = { a: 0.25, b: 0.25, c: 0.5 };
    expect(alocarPorMaiorRestoEstudo(pesos, 6, 0)).toEqual({ a: 2, b: 1, c: 3 });
    expect(alocarPorMaiorRestoEstudo(pesos, 6, 1)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("pesos que não somam 1 são renormalizados", () => {
    // 0.4 + 0.6 somam 1.0; 0.2 + 0.3 somam 0.5 → vira 0.4/0.6 de novo.
    const r = alocarPorMaiorRestoEstudo({ x: 0.2, y: 0.3 }, 10, 0);
    expect(r).toEqual({ x: 4, y: 6 });
  });
});

describe("montarSondaEstudo — pool validado, piso e nunca-vistas primeiro", () => {
  it("módulo com acervo abaixo do piso sai do sorteio declarando a contagem real", () => {
    const entradas: EntradaSondaEstudo[] = [];
    for (let i = 0; i < 7; i++) entradas.push({ questaoId: `m1-${i}`, moduloId: "m1", origem: "digitada" });
    for (let i = 0; i < 25; i++) entradas.push({ questaoId: `m2-${i}`, moduloId: "m2", origem: "simulado-oficial" });
    const r = montarSondaEstudo(entradas, { m1: 0.5, m2: 0.5 }, 8, 0, entradas.map((e) => e.questaoId), 20);
    expect(r.insuficientes).toEqual([{ moduloId: "m1", validadas: 7 }]);
    // Renormalização dá todos os slots ao módulo elegível.
    expect(r.composicao).toEqual([{ moduloId: "m2", qtd: 8 }]);
    expect(r.itens).toHaveLength(8);
    expect(r.itens.every((i) => i.moduloId === "m2")).toBe(true);
  });

  it("gerada NUNCA entra, mesmo no meio do pool", () => {
    const entradas: EntradaSondaEstudo[] = [];
    for (let i = 0; i < 20; i++) entradas.push({ questaoId: `v${i}`, moduloId: "m1", origem: "digitada" });
    entradas.splice(10, 0, { questaoId: "g1", moduloId: "m1", origem: "gerada" });
    const r = montarSondaEstudo(entradas, { m1: 1 }, 8, 0, entradas.map((e) => e.questaoId), 20);
    expect(r.itens.map((i) => i.questaoId)).not.toContain("g1");
    expect(r.insuficientes).toEqual([]);
    expect(r.itens).toHaveLength(8);
  });

  it("só gerada no acervo: módulo sai como insuficiente com 0 validadas", () => {
    const entradas: EntradaSondaEstudo[] = [];
    for (let i = 0; i < 25; i++) entradas.push({ questaoId: `g${i}`, moduloId: "m1", origem: "gerada" });
    const r = montarSondaEstudo(entradas, { m1: 1 }, 8, 0, entradas.map((e) => e.questaoId), 20);
    expect(r.insuficientes).toEqual([{ moduloId: "m1", validadas: 0 }]);
    expect(r.itens).toHaveLength(0);
  });

  it("nunca vistas primeiro, mantendo a ordem relativa do embaralho", () => {
    const entradas: EntradaSondaEstudo[] = [
      { questaoId: "v1", moduloId: "m1", origem: "digitada", vistaEm: "2026-09-01" },
      { questaoId: "v2", moduloId: "m1", origem: "digitada", vistaEm: "2026-09-02" },
      { questaoId: "n1", moduloId: "m1", origem: "digitada" },
      { questaoId: "n2", moduloId: "m1", origem: "digitada" },
      { questaoId: "n3", moduloId: "m1", origem: "digitada" },
    ];
    const embaralhavel = ["v1", "n1", "v2", "n2", "n3"];
    const r = montarSondaEstudo(entradas, { m1: 1 }, 3, 0, embaralhavel, 1);
    // Alocação 3 → só as nunca vistas, na ordem em que aparecem no embaralho.
    expect(r.itens.map((i) => i.questaoId)).toEqual(["n1", "n2", "n3"]);
    expect(r.insuficientes).toEqual([]);
  });
});

describe("embaralharComSemente — determinístico e permutação", () => {
  it("mesma semente → mesma ordem; elementos são os mesmos", () => {
    const base = ["a", "b", "c", "d", "e", "f"];
    const s1 = embaralharComSemente(base, 12345);
    const s2 = embaralharComSemente(base, 12345);
    expect(s1).toEqual(s2);
    expect(s1).toHaveLength(base.length);
    expect([...s1].sort()).toEqual([...base].sort());
    expect(embaralharComSemente(base, 999)).toEqual(embaralharComSemente(base, 999));
  });

  it("sementes diferentes costumam embaralhar diferente", () => {
    const base = Array.from({ length: 50 }, (_, i) => `q${i}`);
    const s1 = embaralharComSemente(base, 1);
    const s2 = embaralharComSemente(base, 2);
    expect(s1).not.toEqual(s2);
  });
});

describe("embaralharComSemente — não mutação e permutação", () => {
  it("mesma semente → mesma ordem; embaralhar NÃO muta a entrada; resultado é permutação", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const copia = [...original];
    const a = embaralharComSemente(original, 42);
    const b = embaralharComSemente(original, 42);
    expect(a).toEqual(b);
    expect(original).toEqual(copia);
    expect([...a].sort((x, y) => x - y)).toEqual(copia);
  });
});

// ── Interleaving e reteste — espelho de zeno_cloud/src/lib/estudos/fila.ts ──

describe("intercalarPorMicrotema — espelho de zeno_cloud/src/lib/estudos/fila.ts", () => {
  const no = (id: string, tema?: string) => ({ id, microtemaPdId: tema });

  it("bloco de 2: alterna os temas preservando a ordem interna", () => {
    const fila = [no("a1", "a"), no("a2", "a"), no("a3", "a"), no("b1", "b"), no("b2", "b")];
    expect(intercalarPorMicrotema(fila, 2).map((i) => i.id)).toEqual([
      "a1",
      "a2",
      "b1",
      "b2",
      "a3",
    ]);
  });

  it("bloco de 3: no máximo 3 do mesmo tema seguidos", () => {
    const fila = [no("a1", "a"), no("a2", "a"), no("a3", "a"), no("a4", "a"), no("b1", "b")];
    expect(intercalarPorMicrotema(fila, 3).map((i) => i.id)).toEqual([
      "a1",
      "a2",
      "a3",
      "b1",
      "a4",
    ]);
  });

  it("round-robin alterna temas em rodadas, ordem interna intacta", () => {
    const fila = [
      no("a1", "a"),
      no("a2", "a"),
      no("b1", "b"),
      no("b2", "b"),
      no("a3", "a"),
      no("b3", "b"),
    ];
    expect(intercalarPorMicrotema(fila, 2).map((i) => i.id)).toEqual([
      "a1",
      "a2",
      "b1",
      "b2",
      "a3",
      "b3",
    ]);
  });

  it("itens sem microtema vão para o fim, na ordem original", () => {
    const fila = [no("x1"), no("a1", "a"), no("x2"), no("a2", "a")];
    expect(intercalarPorMicrotema(fila, 2).map((i) => i.id)).toEqual([
      "a1",
      "a2",
      "x1",
      "x2",
    ]);
  });

  it("NÃO muta a entrada", () => {
    const fila = [no("a1", "a"), no("b1", "b"), no("a2", "a")];
    const copia = fila.map((i) => ({ ...i }));
    intercalarPorMicrotema(fila, 2);
    expect(fila).toEqual(copia);
  });
});

describe("agendarReteste — reteste de recuperação puro", () => {
  const no = (id: string) => ({ id, microtemaPdId: "m" });

  it("insere a candidata em erro+3", () => {
    const fila = [no("q0"), no("q1"), no("q2"), no("q3"), no("q4")];
    const { fila: nova, inserido } = agendarReteste(fila, 0, [no("c")], 3);
    expect(nova.map((i) => i.id)).toEqual(["q0", "q1", "q2", "c", "q3", "q4"]);
    expect(inserido?.id).toBe("c");
  });

  it("clamp ao fim quando erro+3 passa do tamanho", () => {
    const fila = [no("q0"), no("q1")];
    const { fila: nova } = agendarReteste(fila, 1, [no("c")], 3);
    expect(nova.map((i) => i.id)).toEqual(["q0", "q1", "c"]);
  });

  it("sem candidata: devolve a MESMA fila e inserido null", () => {
    const fila = [no("q0")];
    const r = agendarReteste(fila, 0, [], 3);
    expect(r.fila).toBe(fila);
    expect(r.inserido).toBeNull();
  });

  it("não muta a entrada", () => {
    const fila = [no("q0"), no("q1")];
    agendarReteste(fila, 0, [no("c")], 3);
    expect(fila.map((i) => i.id)).toEqual(["q0", "q1"]);
  });

  it("não filtra: excluir a própria errada do pool é contrato do caller", () => {
    const errada = no("errada");
    // Sem filtro, o espelho insere a própria errada — por isso o caller exclui.
    expect(agendarReteste([errada], 0, [errada], 3).inserido?.id).toBe("errada");
    // Contrato correto: pool sem a errada.
    expect(agendarReteste([errada], 0, [no("c")], 3).inserido?.id).toBe("c");
  });
});
