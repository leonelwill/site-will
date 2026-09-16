import { describe, expect, it } from "vitest";
import {
  acertoComMargem,
  montarFilaEstudo,
  wilson,
  type CardEstudo,
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
