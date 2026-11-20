import { estaAtrasada, hojeSP, trimestreAtual } from "@/lib/domain/ciclo";

describe("trimestreAtual", () => {
  it("antes do ciclo começar é fase de planejamento no 1º trimestre", () => {
    expect(trimestreAtual(2027, "2026-11-20")).toEqual({ trimestre: 1, fase: "planejamento" });
  });
  it("durante o ano é fase de execução no trimestre do mês", () => {
    expect(trimestreAtual(2027, "2027-05-02")).toEqual({ trimestre: 2, fase: "execucao" });
    expect(trimestreAtual(2027, "2027-01-01")).toEqual({ trimestre: 1, fase: "execucao" });
    expect(trimestreAtual(2027, "2027-12-31")).toEqual({ trimestre: 4, fase: "execucao" });
  });
  it("depois do ano o ciclo está encerrado no 4º trimestre", () => {
    expect(trimestreAtual(2027, "2028-01-03")).toEqual({ trimestre: 4, fase: "encerrado" });
  });
});

describe("estaAtrasada", () => {
  it("prazo vencido e não concluída", () => {
    expect(estaAtrasada({ prazo: "2027-03-01", status: "em_andamento" }, "2027-03-02")).toBe(true);
  });
  it("concluída nunca está atrasada", () => {
    expect(estaAtrasada({ prazo: "2027-03-01", status: "concluido" }, "2027-03-02")).toBe(false);
  });
  it("sem prazo nunca está atrasada", () => {
    expect(estaAtrasada({ prazo: null, status: "nao_iniciado" }, "2027-03-02")).toBe(false);
  });
  it("no próprio dia do prazo ainda não está atrasada", () => {
    expect(estaAtrasada({ prazo: "2027-03-02", status: "nao_iniciado" }, "2027-03-02")).toBe(false);
  });
});

describe("hojeSP", () => {
  it("usa o fuso de São Paulo, não o UTC", () => {
    expect(hojeSP(new Date("2027-01-01T02:00:00Z"))).toBe("2026-12-31");
    expect(hojeSP(new Date("2027-01-01T04:00:00Z"))).toBe("2027-01-01");
  });
});
