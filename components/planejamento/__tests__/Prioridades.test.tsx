import { act, fireEvent, render, screen } from "@testing-library/react";
import { Prioridades } from "@/components/planejamento/Prioridades";
import { ProvedorAviso } from "@/components/ui/Aviso";
import type { Categoria } from "@/lib/domain/biblioteca";

type R = { ok?: string; confirmar?: boolean; erro?: string };
const definir = vi.fn<(...a: unknown[]) => Promise<R>>(async () => ({ ok: "Prioridade adicionada." }));
const remover = vi.fn<(...a: unknown[]) => Promise<R>>(async () => ({ ok: "Prioridade removida." }));
vi.mock("@/lib/data/planejamentoAcoes", () => ({ definirPrioridade: (...a: unknown[]) => definir(...a), removerPrioridade: (...a: unknown[]) => remover(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const cat = (id: string, nome: string, ordem: number): Categoria => ({ id, slug: id, nome, descricao: "", objetivo: "", ordem });
const categorias = [cat("a", "Comercial", 1), cat("b", "Método", 2), cat("c", "Financeiro", 3), cat("d", "Operação", 4)];
const tres = [{ categoryId: "a", excedente: false }, { categoryId: "b", excedente: false }, { categoryId: "c", excedente: false }];
const montar = () => render(<ProvedorAviso><Prioridades trimestre={1} categorias={categorias} escolhidas={tres} /></ProvedorAviso>);
beforeEach(() => { definir.mockClear(); remover.mockClear(); });

it("mostra contador e estado das escolhidas", () => {
  montar();
  expect(screen.getByText("3 de 3")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Comercial" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Operação" })).toHaveAttribute("aria-pressed", "false");
});

it("quarta-pede-confirmacao", async () => {
  definir.mockResolvedValueOnce({ confirmar: true });
  montar();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Operação" })); });
  expect(definir).toHaveBeenLastCalledWith(1, "d", false);
  expect(screen.getByRole("alertdialog")).toHaveTextContent("Mais de três prioridades dispersam o esforço do trimestre. Adicionar mesmo assim?");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Adicionar mesmo assim" })); });
  expect(definir).toHaveBeenLastCalledWith(1, "d", true);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

it("cancelar-nao-grava", async () => {
  definir.mockResolvedValueOnce({ confirmar: true });
  montar();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Operação" })); });
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(definir).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

it("tirar uma escolhida remove", async () => {
  montar();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Método" })); });
  expect(remover).toHaveBeenCalledWith(1, "b");
});
