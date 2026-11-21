import { render, screen } from "@testing-library/react";
import { GraficoTrimestres } from "@/components/resultados/GraficoTrimestres";

it("barras de realizado e meta por trimestre, com legenda e tabela", () => {
  render(<GraficoTrimestres dados={[{ t: 1, meta: 300000, realizado: 150000 }, { t: 2, meta: 300000, realizado: 0 }, { t: 3, meta: 0, realizado: 0 }, { t: 4, meta: 0, realizado: 0 }]} />);
  expect(screen.getAllByRole("img", { name: /1º tri — realizado: R\$\s150\.000/ }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("img", { name: /1º tri — meta: R\$\s300\.000/ }).length).toBeGreaterThan(0);
  expect(screen.getAllByText("Realizado").length).toBe(2); // legenda + cabeçalho da tabela
  expect(screen.getAllByText("Meta").length).toBe(2);
  expect(screen.getByText("Ver em tabela")).toBeInTheDocument();
  expect(screen.getByText("A comparação com o ciclo anterior aparece a partir do segundo ciclo.")).toBeInTheDocument();
});

it("sem metas nem realizado mostra mensagem", () => {
  render(<GraficoTrimestres dados={[1, 2, 3, 4].map((t) => ({ t, meta: 0, realizado: 0 }))} />);
  expect(screen.getByText("Preencha as metas por trimestre ou o realizado para ver o gráfico.")).toBeInTheDocument();
});
