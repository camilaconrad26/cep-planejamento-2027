import { render, screen } from "@testing-library/react";
import { GraficoLinha } from "@/components/resultados/GraficoLinha";

it("dois meses viram dois pontos com descrição", () => {
  render(<GraficoLinha nome="Taxa de conversão" unidade="%" meta={30} serie={[{ mes: "2027-01", valor: 10 }, { mes: "2027-02", valor: 35 }]} />);
  // dois desenhos (largo e estreito); o CSS mostra só um conforme a tela
  expect(screen.getAllByRole("img", { name: "jan/2027: 10 %" })).toHaveLength(2);
  expect(screen.getAllByRole("img", { name: "fev/2027: 35 %" })).toHaveLength(2);
  expect(screen.getAllByText("Meta 30 %")).toHaveLength(2);
  expect(screen.getByText("Ver em tabela")).toBeInTheDocument();
});

it("um mês só mostra a mensagem", () => {
  render(<GraficoLinha nome="X" unidade="" meta={null} serie={[{ mes: "2027-01", valor: 10 }]} />);
  expect(screen.getByText("Registre medições em meses diferentes para ver o gráfico.")).toBeInTheDocument();
  expect(document.querySelector("svg")).toBeNull();
});
