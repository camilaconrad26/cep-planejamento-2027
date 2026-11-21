import { render, screen } from "@testing-library/react";

it("/imprimir tem tela de erro própria, com tentar de novo e saída", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {}); // a tela registra o erro simulado
  const { default: Erro } = await import("@/app/imprimir/error");
  render(<Erro error={new Error("falhou")} reset={() => {}} />);
  expect(screen.getByRole("heading", { name: "Algo não funcionou" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ir para a Visão geral" })).toHaveAttribute("href", "/visao-geral");
});
