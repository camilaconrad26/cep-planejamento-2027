import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Kanban } from "@/components/acoes/Kanban";
import { ProvedorAviso } from "@/components/ui/Aviso";
import type { Acao } from "@/lib/domain/acoes";

const atualizar = vi.fn<(...a: unknown[]) => Promise<{ ok?: string; erro?: string }>>(async () => ({ ok: "Ação salva." }));
vi.mock("@/lib/data/acoesAcoes", () => ({ atualizarAcao: (...a: unknown[]) => atualizar(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const acao: Acao = { id: "t1", titulo: "Mapear funil", objetivo: null, categoria: null, nivel: "tatico", responsavel: "", prioridade: "media", status: "nao_iniciado", inicio: null, prazo: null, trimestre: 1 };
const coluna = (nome: RegExp) => screen.getByRole("region", { name: nome });
const montar = () => render(<ProvedorAviso><Kanban acoes={[acao]} hoje="2027-01-10" /></ProvedorAviso>);
beforeEach(() => { atualizar.mockReset(); });

it("mover-pelo-menu", async () => {
  atualizar.mockResolvedValue({ ok: "Ação salva." });
  montar();
  fireEvent.change(screen.getByLabelText('Mover "Mapear funil" para'), { target: { value: "em_andamento" } });
  expect(atualizar).not.toHaveBeenCalled(); // trocar a opção não move (setas do teclado)
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: 'Mover "Mapear funil"' })); });
  expect(atualizar).toHaveBeenCalledWith("t1", { status: "em_andamento" });
  expect(within(coluna(/Em andamento/)).getByText("Mapear funil")).toBeInTheDocument();
  expect(within(coluna(/Não iniciada/)).queryByText("Mapear funil")).toBeNull();
  expect(screen.getByLabelText('Mover "Mapear funil" para')).toHaveFocus(); // o foco acompanha o cartão
});

it("editando-nao-arrasta", () => {
  montar();
  const li = screen.getByText("Mapear funil").closest("li")!;
  expect(li).toHaveAttribute("draggable", "true");
  fireEvent.click(screen.getByRole("button", { name: "Editar: Mapear funil" }));
  expect(screen.getByText("Mapear funil", { selector: "p" }).closest("li")).toHaveAttribute("draggable", "false");
});

it("falha-de-rede-volta", async () => {
  atualizar.mockRejectedValue(new TypeError("Failed to fetch"));
  montar();
  fireEvent.change(screen.getByLabelText('Mover "Mapear funil" para'), { target: { value: "concluido" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: 'Mover "Mapear funil"' })); });
  expect(within(coluna(/Não iniciada/)).getByText("Mapear funil")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível mover");
});

it("arrastar-e-soltar", async () => {
  atualizar.mockResolvedValue({ ok: "Ação salva." });
  montar();
  const dados: Record<string, string> = {};
  const dataTransfer = { setData: (k: string, v: string) => { dados[k] = v; }, getData: (k: string) => dados[k], effectAllowed: "", dropEffect: "" };
  fireEvent.dragStart(screen.getByText("Mapear funil").closest("li")!, { dataTransfer });
  await act(async () => { fireEvent.drop(coluna(/Concluída/), { dataTransfer }); });
  expect(atualizar).toHaveBeenCalledWith("t1", { status: "concluido" });
  expect(within(coluna(/Concluída/)).getByText("Mapear funil")).toBeInTheDocument();
});

it("falha-volta", async () => {
  atualizar.mockResolvedValue({ erro: "Não foi possível salvar. Tente de novo." });
  montar();
  fireEvent.change(screen.getByLabelText('Mover "Mapear funil" para'), { target: { value: "concluido" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: 'Mover "Mapear funil"' })); });
  expect(within(coluna(/Não iniciada/)).getByText("Mapear funil")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar. Tente de novo.");
});
