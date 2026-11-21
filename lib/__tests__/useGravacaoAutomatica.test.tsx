import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { useGravacaoAutomatica } from "@/lib/useGravacaoAutomatica";

const gravar = vi.fn<(v: string) => Promise<{ erro?: string }>>(async () => ({}));
function Teste() {
  const [v, setV] = useState("a");
  useGravacaoAutomatica(v, gravar);
  return <input aria-label="campo" value={v} onChange={(e) => setV(e.target.value)} />;
}
beforeEach(() => { gravar.mockClear(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

it("grava o que está pendente ao sair da página (navegação dentro do app)", async () => {
  const { unmount } = render(<Teste />);
  fireEvent.change(screen.getByLabelText("campo"), { target: { value: "R$ 1.200.000" } });
  expect(gravar).not.toHaveBeenCalled();
  await act(async () => { unmount(); });
  expect(gravar).toHaveBeenCalledWith("R$ 1.200.000");
});

it("sem nada pendente, sair não grava", async () => {
  const { unmount } = render(<Teste />);
  await act(async () => { unmount(); });
  expect(gravar).not.toHaveBeenCalled();
});
