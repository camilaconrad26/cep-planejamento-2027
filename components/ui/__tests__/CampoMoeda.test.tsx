import { fireEvent, render, screen } from "@testing-library/react";
import { CampoMoeda } from "@/components/ui/CampoMoeda";

it("formata ao sair do campo e entrega o número", () => {
  const mudou = vi.fn();
  render(<label>Faturamento<CampoMoeda valor={0} onChange={mudou} /></label>);
  const campo = screen.getByLabelText("Faturamento") as HTMLInputElement;
  fireEvent.change(campo, { target: { value: "200000" } });
  fireEvent.blur(campo);
  expect(campo.value.replace(/\s/g, " ")).toBe("R$ 200.000");
  expect(mudou).toHaveBeenLastCalledWith(200000);
});

it("aceita formato brasileiro com centavos", () => {
  const mudou = vi.fn();
  render(<label>Meta<CampoMoeda valor={0} onChange={mudou} /></label>);
  const campo = screen.getByLabelText("Meta");
  fireEvent.change(campo, { target: { value: "250.000,00" } });
  fireEvent.blur(campo);
  expect(mudou).toHaveBeenLastCalledWith(250000);
});

it("vazio fica vazio, sem R$ 0", () => {
  render(<label>Valor<CampoMoeda valor={0} onChange={() => {}} /></label>);
  expect((screen.getByLabelText("Valor") as HTMLInputElement).value).toBe("");
});
