import { render, screen } from "@testing-library/react";
import { RedefinirSenha } from "@/components/alunas/RedefinirSenha";
import { ProvedorAviso } from "@/components/ui/Aviso";

vi.mock("@/lib/data/alunasAcoes", () => ({ redefinirSenha: vi.fn() }));

it("a ajuda da senha provisória é lida junto com o campo", () => {
  render(<ProvedorAviso><RedefinirSenha userId="u1" nome="Ana" /></ProvedorAviso>);
  expect(screen.getByLabelText("Nova senha provisória")).toHaveAccessibleDescription(/Mínimo de 8 caracteres/);
});
