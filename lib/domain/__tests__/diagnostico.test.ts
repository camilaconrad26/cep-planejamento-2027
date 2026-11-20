import { PERGUNTAS, resumirDiagnostico, sugerirPerfil } from "@/lib/domain/diagnostico";

it("tem as 10 perguntas da especificação, na ordem", () => {
  expect(PERGUNTAS.map((p) => p.texto)).toEqual([
    "Em qual estágio está seu escritório?",
    "Há quanto tempo atua com planejamento patrimonial?",
    "Quantos projetos patrimoniais já conduziu?",
    "Trabalha sozinho ou possui equipe?",
    "Quais são os principais serviços oferecidos?",
    "Como chegam atualmente seus clientes?",
    "Possui processos comerciais estruturados?",
    "Possui controle financeiro?",
    "Possui método próprio de atendimento?",
    "Quais são seus principais desafios atualmente?",
  ]);
});

describe("sugerirPerfil", () => {
  it("o estágio declarado manda", () => expect(sugerirPerfil({ estagio: 3 })).toBe(3));
  it("sem projetos sugere estruturação", () => expect(sugerirPerfil({ projetos: "Nenhum" })).toBe(1));
  it("muitos projetos com equipe fixa sugere escala", () =>
    expect(sugerirPerfil({ projetos: "Mais de 30", equipe: "Tenho equipe fixa" })).toBe(3));
  it("muitos projetos sozinha sugere consolidação", () =>
    expect(sugerirPerfil({ projetos: "Mais de 30", equipe: "Trabalho sozinha(o)" })).toBe(2));
  it("faixa intermediária sugere consolidação", () => expect(sugerirPerfil({ projetos: "4 a 10" })).toBe(2));
  it("sem respostas-chave não sugere", () => expect(sugerirPerfil({})).toBeNull());
});

describe("resumirDiagnostico", () => {
  const r = resumirDiagnostico({ comercial: "Não", financeiro: "Sim", metodo: "Em parte", desafios: ["Precificar"] });
  it("prioriza pela soma de sinais", () => expect(r.prioridades).toEqual(["comercial", "financeiro", "metodo"]));
  it("separa pontos fortes e de atenção", () => {
    expect(r.fortes).toContain("Controle financeiro estruturado");
    expect(r.atencao).toContain("Processo comercial ainda não estruturado");
    expect(r.atencao).toContain("Método de atendimento em construção");
  });
  it("notas baixas do fechamento entram nas prioridades", () => {
    expect(resumirDiagnostico({}, { parcerias: 3, operacao: 6 }).prioridades).toEqual(["parcerias", "operacao"]);
  });
  it("sem sinais não inventa prioridade", () => expect(resumirDiagnostico({}).prioridades).toEqual([]));
  it("nunca passa de 3 prioridades", () =>
    expect(resumirDiagnostico({ comercial: "Não", financeiro: "Não", metodo: "Não", desafios: ["Construir parcerias"] }).prioridades).toHaveLength(3));
});
