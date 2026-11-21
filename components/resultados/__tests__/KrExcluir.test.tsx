import { act, fireEvent, render, screen } from "@testing-library/react";
import { KrLinha } from "@/components/resultados/KrLinha";
import { FormKr } from "@/components/resultados/FormKr";
import { ProvedorAviso } from "@/components/ui/Aviso";
import type { KR } from "@/lib/domain/resultados";

const excluir = vi.fn<(...a: unknown[]) => Promise<{ ok?: string }>>(async () => ({ ok: "x" }));
const lancar = vi.fn<(...a: unknown[]) => Promise<{ ok?: string }>>(async () => ({ ok: "x" }));
const criar = vi.fn<(...a: unknown[]) => Promise<{ ok?: string }>>(async () => ({ ok: "x" }));
vi.mock("@/lib/data/resultadosAcoes", () => ({ excluirKr: (...a: unknown[]) => excluir(...a), lancarValorKr: (...a: unknown[]) => lancar(...a), criarKr: (...a: unknown[]) => criar(...a), editarKr: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => { excluir.mockClear(); lancar.mockClear(); criar.mockClear(); });

const kr: KR = { id: "k1", okrId: "o", descricao: "Zerar inadimplência", unidade: "%", inicial: 10, alvo: 0, atual: 6, prazo: null, atualizadoEm: "2027-01-01T00:00:00Z" };

it("excluir resultado-chave pede confirmação", async () => {
  render(<ProvedorAviso><ul><KrLinha kr={kr} /></ul></ProvedorAviso>);
  fireEvent.click(screen.getByRole("button", { name: "Excluir: Zerar inadimplência" }));
  expect(excluir).not.toHaveBeenCalled();
  expect(screen.getByRole("alertdialog")).toHaveTextContent("Excluir este resultado-chave?");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Excluir de vez" })); });
  expect(excluir).toHaveBeenCalledWith("k1");
});

it("lançar texto não grava 0", async () => {
  render(<ProvedorAviso><ul><KrLinha kr={kr} /></ul></ProvedorAviso>);
  fireEvent.change(screen.getByLabelText("Valor atual de Zerar inadimplência"), { target: { value: "dez" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Lançar" })); });
  expect(lancar).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Use só números.");
});

it("com alvo, o valor inicial é obrigatório", async () => {
  render(<ProvedorAviso><FormKr okrId="o" onFechar={() => {}} /></ProvedorAviso>);
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Zerar inadimplência" } });
  fireEvent.change(screen.getByLabelText("Alvo"), { target: { value: "0" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Criar resultado-chave" })); });
  expect(criar).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Informe o valor inicial para calcular o progresso.");
});
