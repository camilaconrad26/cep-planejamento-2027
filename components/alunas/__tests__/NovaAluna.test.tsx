import { fireEvent, render, screen } from "@testing-library/react";
import { NovaAluna } from "@/components/alunas/NovaAluna";
import { ProvedorAviso } from "@/components/ui/Aviso";

const criar = vi.fn<(...a: unknown[]) => Promise<{ ok?: string; erro?: string }>>();
vi.mock("@/lib/data/alunasAcoes", () => ({ criarAluna: (...a: unknown[]) => criar(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => { criar.mockReset(); });

const abrir = () => {
  render(<ProvedorAviso><NovaAluna /></ProvedorAviso>);
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar aluna" }));
};
const preencher = (nome: string, email: string, senha: string) => {
  fireEvent.change(screen.getByLabelText("Nome completo da aluna"), { target: { value: nome } });
  fireEvent.change(screen.getByLabelText("E-mail da aluna"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha provisória"), { target: { value: senha } });
};

it("cadastra a aluna com senha provisória e mostra o que enviar a ela", async () => {
  criar.mockResolvedValue({ ok: "Conta de Ana Souza criada." });
  abrir();
  preencher("Ana Souza", "Ana@Exemplo.com ", "Provisoria#1");
  fireEvent.click(screen.getByRole("button", { name: "Criar conta da aluna" }));
  expect(await screen.findByText(/Conta de Ana Souza criada/)).toBeInTheDocument();
  expect(criar).toHaveBeenCalledWith({ nome: "Ana Souza", email: "ana@exemplo.com", senha: "Provisoria#1" });
  // o formulário volta vazio para a próxima aluna
  expect(screen.getByLabelText("Nome completo da aluna")).toHaveValue("");
});

it("mostra o erro e mantém o que foi digitado", async () => {
  criar.mockResolvedValue({ erro: 'Este e-mail já tem cadastro. Use "Entrar".' });
  abrir();
  preencher("Ana Souza", "ana@exemplo.com", "Provisoria#1");
  fireEvent.click(screen.getByRole("button", { name: "Criar conta da aluna" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Este e-mail já tem cadastro");
  expect(screen.getByLabelText("E-mail da aluna")).toHaveValue("ana@exemplo.com");
});

it("não envia senha curta", () => {
  abrir();
  preencher("Ana Souza", "ana@exemplo.com", "1234567");
  expect(screen.getByRole("button", { name: "Criar conta da aluna" })).toBeDisabled();
});

it("a ajuda da senha é lida junto com o campo", () => {
  abrir();
  expect(screen.getByLabelText("Senha provisória")).toHaveAccessibleDescription(/troque em Configurações/);
});
