import { act, fireEvent, render, screen } from "@testing-library/react";
import { MetasFinanceiras } from "@/components/metas/MetasFinanceiras";
import { metasVazias } from "@/lib/domain/metas";

const salvar = vi.fn<(...a: unknown[]) => Promise<{ ok?: true; erro?: string }>>(async () => ({ ok: true }));
vi.mock("@/lib/data/metasAcoes", () => ({ salvarMetas: (...a: unknown[]) => salvar(...a) }));

const digitar = (rotulo: string, valor: string) => {
  const el = screen.getByLabelText(rotulo);
  fireEvent.change(el, { target: { value: valor } });
  fireEvent.blur(el);
};
const valor = (rotulo: string) => (screen.getByLabelText(rotulo) as HTMLInputElement).value.replace(/\s/g, " ");

it("dividir-em-quatro", async () => {
  render(<MetasFinanceiras inicial={metasVazias()} base2026={0} />);
  digitar("Faturamento · Meta", "1.000.001");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Dividir a meta anual em quatro partes iguais" })); });
  expect(valor("1º trimestre · Meta")).toBe("R$ 250.000");
  expect(valor("4º trimestre · Meta")).toBe("R$ 250.001");
  expect(screen.getByTestId("tri-dif-meta")).toHaveTextContent("fecha com a meta");
});

it("cenario-compara", () => {
  render(<MetasFinanceiras inicial={metasVazias()} base2026={0} />);
  digitar("Faturamento · Meta", "1.000.000");
  digitar("Ticket · Entrada", "500");
  digitar("Vendas · Entrada · Meta", "100");
  digitar("Ticket · Alto valor", "30.000");
  digitar("Vendas · Alto valor · Meta", "20");
  expect(screen.getByTestId("cenario-meta").textContent?.replace(/\s/g, " ")).toBe("R$ 650.000");
  expect(screen.getByTestId("cenario-dif-meta").textContent?.replace(/\s/g, " ")).toBe("faltam R$ 350.000");
});

it("calcula-meta-anual-e-crescimento", () => {
  render(<MetasFinanceiras inicial={metasVazias()} base2026={1_000_000} />);
  digitar("Faturamento · Meta", "R$ 1.200.000,00");
  digitar("Lucratividade % · Meta", "30");
  expect(screen.getByTestId("lucro-meta").textContent?.replace(/\s/g, " ")).toBe("R$ 360.000");
  expect(screen.getByTestId("mensal-meta").textContent?.replace(/\s/g, " ")).toBe("R$ 100.000");
  expect(screen.getByTestId("cresc-meta")).toHaveTextContent("+20%");
  expect(screen.getByTestId("cresc-super")).toHaveTextContent("—");
});
