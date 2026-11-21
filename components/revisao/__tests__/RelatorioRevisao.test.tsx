import { render, screen } from "@testing-library/react";
import { RelatorioRevisao } from "@/components/revisao/RelatorioRevisao";
import type { RetratoRevisao } from "@/lib/domain/revisao";

const r = (pct: number | null, real: number): RetratoRevisao => ({
  trimestre: 2, execucao: { total: 3, concluidas: 2, pct }, krs: { media: 0.75, atingidos: 1, comMeta: 2 },
  kpis: { naMeta: 1, total: 2 }, faturamento: { realizado: real, meta: 300000, pct: real / 300000 },
});

it("mostra execução e resultado separados, respostas e comparação", () => {
  render(<RelatorioRevisao trimestre={2} retrato={r(2 / 3, 150000)} anterior={r(0.5, 100000)} respostas={{ executado: "Lives semanais", alterar: "Menos eventos" }} concluidaEm="2027-07-02T12:00:00Z" />);
  expect(screen.getByRole("heading", { name: "Relatório do 2º trimestre" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Execução das ações" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Resultados" })).toBeInTheDocument();
  expect(screen.getByText("Lives semanais")).toBeInTheDocument();
  expect(screen.getByText("Menos eventos")).toBeInTheDocument();
  expect(screen.getByTestId("var-Execução das ações")).toHaveTextContent("+17 p.p.");
  expect(screen.getByTestId("var-Faturamento realizado").textContent?.replace(/\s/g, " ")).toBe("+R$ 50.000");
});

it("sem revisão anterior", () => {
  render(<RelatorioRevisao trimestre={1} retrato={r(null, 0)} anterior={null} respostas={{}} concluidaEm="2027-04-02T12:00:00Z" />);
  expect(screen.getByText("Esta é a primeira revisão do ciclo; a comparação aparece a partir da próxima.")).toBeInTheDocument();
  expect(screen.getAllByText("Sem resposta.")).toHaveLength(7);
});
