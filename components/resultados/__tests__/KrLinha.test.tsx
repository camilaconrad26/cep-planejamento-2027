import { act, fireEvent, render, screen } from "@testing-library/react";
import { KrLinha } from "@/components/resultados/KrLinha";
import { ProvedorAviso } from "@/components/ui/Aviso";
import type { KR } from "@/lib/domain/resultados";

const lancar = vi.fn<(...a: unknown[]) => Promise<{ ok?: string; erro?: string }>>(async () => ({ ok: "Valor lançado." }));
vi.mock("@/lib/data/resultadosAcoes", () => ({ lancarValorKr: (...a: unknown[]) => lancar(...a), editarKr: vi.fn(), excluirKr: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => { lancar.mockClear(); });

const kr = (p: Partial<KR> = {}): KR => ({ id: "k1", okrId: "o", descricao: "Fechar contratos", unidade: "contratos", inicial: 0, alvo: 10, atual: 4, prazo: null, atualizadoEm: "2027-01-01T00:00:00Z", ...p });
const montar = (k: KR) => render(<ProvedorAviso><ul><KrLinha kr={k} /></ul></ProvedorAviso>);

it("mostra progresso", () => {
  montar(kr());
  expect(screen.getByRole("progressbar", { name: "Progresso de Fechar contratos" })).toHaveAttribute("aria-valuenow", "40");
  expect(screen.getByText("40%")).toBeInTheDocument();
});

it("lanca-valor", async () => {
  montar(kr());
  fireEvent.change(screen.getByLabelText("Valor atual de Fechar contratos"), { target: { value: "6,5" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Lançar" })); });
  expect(lancar).toHaveBeenCalledWith("k1", 6.5);
});

it("sem-meta-numerica", () => {
  montar(kr({ alvo: null }));
  expect(screen.getByText("sem meta numérica")).toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).toBeNull();
});

it("atingido", () => {
  montar(kr({ atual: 10 }));
  expect(screen.getByText("Atingido")).toBeInTheDocument();
});
