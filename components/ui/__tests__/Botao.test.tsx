import { render, screen } from "@testing-library/react";
import { Botao } from "@/components/ui/Botao";

it("botão primário sobre papel usa o dourado de texto e é uma pílula", () => {
  render(<Botao>Salvar</Botao>);
  const b = screen.getByRole("button", { name: "Salvar" });
  expect(b.className).toMatch(/rounded-full/);
  expect(b.className).toMatch(/bg-ouro-texto/);
});

it("botão sobre escuro usa o dourado claro com texto escuro", () => {
  render(<Botao sobreEscuro>Entrar</Botao>);
  const c = screen.getByRole("button").className;
  expect(c).toMatch(/(^|\s)bg-ouro(\s|$)/);
  expect(c).toMatch(/(^|\s)text-noite(\s|$)/);
});

it("botão é do tipo button por padrão, para não enviar formulários sem querer", () => {
  render(<Botao>Ok</Botao>);
  expect(screen.getByRole("button")).toHaveAttribute("type", "button");
});
