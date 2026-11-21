import { act, fireEvent, render, screen } from "@testing-library/react";
import { AcoesVenda } from "@/components/metas/AcoesVenda";

const salvar = vi.fn<(...a: unknown[]) => Promise<{ ok?: true; erro?: string }>>();
vi.mock("@/lib/data/metasAcoes", () => ({ salvarAcaoVenda: (...a: unknown[]) => salvar(...a), criarAcaoVenda: vi.fn(), excluirAcaoVenda: vi.fn() }));
beforeEach(() => { salvar.mockReset(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-21T12:00:00Z")); });
afterEach(() => vi.useRealTimers());

const acao = { id: "a1", mes: 1, produto: "", acao: "", ticket: 0, quantidade: 0, responsavel: "" };

it("falha ao salvar tenta de novo sozinha e limpa o erro quando dá certo", async () => {
  salvar.mockRejectedValueOnce(new Error("rede")).mockResolvedValue({ ok: true });
  render(<AcoesVenda inicial={[acao]} metaTrimestre={() => 0} />);
  const campo = screen.getByLabelText("Produto da ação 1");
  fireEvent.change(campo, { target: { value: "Holding" } });
  await act(async () => { fireEvent.blur(campo); });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  expect(salvar).toHaveBeenCalledTimes(2);
  expect(salvar.mock.calls[1][0]).toMatchObject({ produto: "Holding" });
  expect(screen.queryByRole("alert")).toBeNull();
});
