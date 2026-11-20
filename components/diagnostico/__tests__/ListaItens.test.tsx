import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ListaItens } from "@/components/diagnostico/ListaItens";
import { ProvedorAviso } from "@/components/ui/Aviso";
import type { ItemLista } from "@/lib/domain/fechamento";

let resolver: (v: { id: string }) => void = () => {};
const criar = vi.fn(() => new Promise<{ id: string }>((r) => { resolver = r; }));
const excluir = vi.fn(async () => ({}));
vi.mock("@/lib/data/tarefas", () => ({ criarTarefaAvulsa: (...a: unknown[]) => criar(...(a as [])), excluirTarefa: (...a: unknown[]) => excluir(...(a as [])) }));

function Teste({ inicial }: { inicial: ItemLista[] }) {
  const [itens, setItens] = useState(inicial);
  return <ProvedorAviso><ListaItens rotulo="Começar a fazer" ajuda="" itens={itens} onChange={setItens} /></ProvedorAviso>;
}
const dois = [{ id: "a", texto: "Cobrar diagnóstico" }, { id: "b", texto: "Revisar contrato" }];

beforeEach(() => { criar.mockClear(); excluir.mockClear(); });

it("edição feita enquanto a tarefa é criada não se perde", async () => {
  render(<Teste inicial={dois} />);
  fireEvent.click(screen.getByRole("button", { name: "Criar tarefa: Cobrar diagnóstico" }));
  fireEvent.change(screen.getByLabelText("Começar a fazer, item 2"), { target: { value: "Revisar contrato social" } });
  await act(async () => resolver({ id: "t1" }));
  expect((screen.getByLabelText("Começar a fazer, item 2") as HTMLInputElement).value).toBe("Revisar contrato social");
  expect(screen.getByText("✓ Tarefa criada no 1º tri")).toBeInTheDocument();
});

it("dois toques rápidos criam uma tarefa só", async () => {
  render(<Teste inicial={dois} />);
  const b = screen.getByRole("button", { name: "Criar tarefa: Cobrar diagnóstico" });
  fireEvent.click(b); fireEvent.click(b);
  expect(criar).toHaveBeenCalledTimes(1);
  await act(async () => resolver({ id: "t1" }));
});

it("desfazer a remoção não apaga o que foi editado depois", async () => {
  render(<Teste inicial={dois} />);
  fireEvent.click(screen.getByRole("button", { name: "Remover: Cobrar diagnóstico" }));
  fireEvent.change(screen.getByLabelText("Começar a fazer, item 1"), { target: { value: "Revisar contrato social" } });
  fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
  expect((screen.getByLabelText("Começar a fazer, item 1") as HTMLInputElement).value).toBe("Cobrar diagnóstico");
  expect((screen.getByLabelText("Começar a fazer, item 2") as HTMLInputElement).value).toBe("Revisar contrato social");
});
