import { expect, test } from "vitest";
import { agruparAtividades, textoAtividade } from "@/lib/domain/atividade";

test("textos amigáveis", () => {
  expect(textoAtividade({ entidade: "cep_tasks", acao: "insert", antes: null, depois: { titulo: "Mapear funil" } })).toBe("Ação criada: Mapear funil");
  expect(textoAtividade({ entidade: "cep_tasks", acao: "update", antes: { status: "em_andamento", titulo: "Mapear funil" }, depois: { status: "concluido", titulo: "Mapear funil" } })).toBe("Ação concluída: Mapear funil");
  expect(textoAtividade({ entidade: "cep_tasks", acao: "update", antes: { status: "nao_iniciado", titulo: "A" }, depois: { status: "nao_iniciado", titulo: "B" } })).toBe("Ação alterada: B");
  expect(textoAtividade({ entidade: "cep_objectives", acao: "delete", antes: { titulo: "Crescer" }, depois: null })).toBe("Objetivo excluído: Crescer");
  expect(textoAtividade({ entidade: "cep_key_results", acao: "update", antes: { valor_atual: 1, descricao: "Contratos" }, depois: { valor_atual: 4, descricao: "Contratos" } })).toBe("Valor lançado: Contratos");
  expect(textoAtividade({ entidade: "cep_kpi_measurements", acao: "insert", antes: null, depois: { valor: 3 } })).toBe("Medição registrada");
  expect(textoAtividade({ entidade: "cep_reviews", acao: "update", antes: { concluida_em: null }, depois: { trimestre: 2, concluida_em: "2027-07-01" } })).toBe("Revisão do 2º trimestre concluída");
  expect(textoAtividade({ entidade: "cep_financial_goals", acao: "update", antes: {}, depois: {} })).toBe("Metas financeiras atualizadas");
  expect(textoAtividade({ entidade: "cep_desconhecida", acao: "insert", antes: null, depois: null })).toBe("Alteração no plano");
});

test("agrupa repetições seguidas (gravação automática)", () => {
  const a = (texto: string, em: string) => ({ texto, em });
  expect(agruparAtividades([a("Metas financeiras atualizadas", "3"), a("Metas financeiras atualizadas", "2"), a("Ação criada: X", "1")]))
    .toEqual([{ texto: "Metas financeiras atualizadas", em: "3", vezes: 2 }, { texto: "Ação criada: X", em: "1", vezes: 1 }]);
});
