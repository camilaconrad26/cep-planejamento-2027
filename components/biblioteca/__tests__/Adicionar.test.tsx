import { act, fireEvent, render, screen } from "@testing-library/react";
import { Adicionar } from "@/components/biblioteca/Adicionar";
import { ProvedorAviso } from "@/components/ui/Aviso";

let resolver: (v: { ok?: string; erro?: string }) => void = () => {};
const adicionar = vi.fn(() => new Promise<{ ok?: string; erro?: string }>((r) => { resolver = r; }));
vi.mock("@/lib/data/bibliotecaAcoes", () => ({ adicionarAoPlano: (...a: unknown[]) => adicionar(...(a as [])) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const montar = () => render(<ProvedorAviso><Adicionar itemId="i1" texto="Mapear o funil" trimestrePadrao={2} /></ProvedorAviso>);
beforeEach(() => { adicionar.mockClear(); });

it("clique-duplo-chama-uma-vez", async () => {
  montar();
  const b = screen.getByRole("button", { name: "Adicionar ao meu plano" });
  fireEvent.click(b); fireEvent.click(b);
  expect(adicionar).toHaveBeenCalledTimes(1);
  expect(adicionar).toHaveBeenCalledWith("i1", 2);
  expect(screen.getByRole("button", { name: "Adicionando…" })).toBeDisabled();
  await act(async () => resolver({ ok: "Adicionado ao 2º trimestre." }));
  expect(screen.getByRole("status")).toHaveTextContent("Adicionado ao 2º trimestre.");
});

it("mostra-erro-no-item", async () => {
  montar();
  fireEvent.change(screen.getByLabelText("Trimestre para: Mapear o funil"), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar ao meu plano" }));
  expect(adicionar).toHaveBeenCalledWith("i1", 4);
  await act(async () => resolver({ erro: "Não foi possível adicionar. Tente de novo." }));
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível adicionar. Tente de novo.");
  expect(screen.getByRole("button", { name: "Adicionar ao meu plano" })).toBeEnabled();
});
