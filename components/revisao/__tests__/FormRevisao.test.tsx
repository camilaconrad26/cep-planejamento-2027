import { act, fireEvent, render, screen } from "@testing-library/react";
import { FormRevisao } from "@/components/revisao/FormRevisao";
import { ProvedorAviso } from "@/components/ui/Aviso";

const salvar = vi.fn<(...a: unknown[]) => Promise<{ ok?: true }>>(async () => ({ ok: true }));
vi.mock("@/lib/data/revisaoAcoes", () => ({ salvarRevisao: (...a: unknown[]) => salvar(...a), concluirRevisao: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => { salvar.mockClear(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

it("grava enquanto digita, sem precisar sair do campo", async () => {
  render(<ProvedorAviso><FormRevisao trimestre={1} inicial={{}} faturamento={0} concluida={false} /></ProvedorAviso>);
  fireEvent.change(screen.getByLabelText("O que foi executado?"), { target: { value: "Lives semanais" } });
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(salvar).toHaveBeenCalledWith(1, { respostas: { executado: "Lives semanais" } });
});

it("não regrava o faturamento que não mudou nesta aba (outra aba pode ter mudado)", async () => {
  render(<ProvedorAviso><FormRevisao trimestre={2} inicial={{}} faturamento={150000} concluida={false} /></ProvedorAviso>);
  fireEvent.change(screen.getByLabelText("O que foi executado?"), { target: { value: "Parcerias" } });
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(salvar).toHaveBeenLastCalledWith(2, { respostas: { executado: "Parcerias" } });
});

it("passar pelo campo de faturamento sem mudar o valor não o regrava", async () => {
  render(<ProvedorAviso><FormRevisao trimestre={3} inicial={{}} faturamento={0} concluida={false} /></ProvedorAviso>);
  fireEvent.change(screen.getByLabelText("O que foi executado?"), { target: { value: "Eventos" } });
  const fat = screen.getByLabelText("Faturamento realizado no trimestre");
  fireEvent.focus(fat); fireEvent.blur(fat);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(salvar).toHaveBeenLastCalledWith(3, { respostas: { executado: "Eventos" } });
});
