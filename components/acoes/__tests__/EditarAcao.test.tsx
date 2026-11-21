import { act, fireEvent, render, screen } from "@testing-library/react";
import { EditarAcao } from "@/components/acoes/EditarAcao";
import { ProvedorAviso } from "@/components/ui/Aviso";
import type { Acao } from "@/lib/domain/acoes";

const atualizar = vi.fn<(...a: unknown[]) => Promise<{ ok?: string; erro?: string }>>(async () => ({ ok: "Ação salva." }));
vi.mock("@/lib/data/acoesAcoes", () => ({ atualizarAcao: (...a: unknown[]) => atualizar(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const acao: Acao = { id: "t1", titulo: "Gravar vídeo", objetivo: null, categoria: null, nivel: "operacional", responsavel: "", prioridade: "media", status: "nao_iniciado", inicio: null, prazo: null, trimestre: 2 };
const montar = () => render(<ProvedorAviso><EditarAcao acao={acao} /></ProvedorAviso>);
beforeEach(() => { atualizar.mockClear(); });

it("prazo-antes-do-inicio", async () => {
  montar();
  fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2027-03-10" } });
  fireEvent.change(screen.getByLabelText("Prazo"), { target: { value: "2027-03-01" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar ação" })); });
  expect(atualizar).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("O prazo não pode ser antes do início.");
});

it("salva-campos", async () => {
  montar();
  fireEvent.change(screen.getByLabelText("Responsável"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Prioridade"), { target: { value: "alta" } });
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "em_andamento" } });
  fireEvent.change(screen.getByLabelText("Prazo"), { target: { value: "2027-02-10" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar ação" })); });
  expect(atualizar).toHaveBeenCalledWith("t1", { titulo: "Gravar vídeo", responsavel: "Ana", prioridade: "alta", status: "em_andamento", inicio: null, prazo: "2027-02-10", trimestre: 2 });
});
