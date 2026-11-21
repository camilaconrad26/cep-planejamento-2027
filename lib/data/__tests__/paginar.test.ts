vi.mock("server-only", () => ({}));
import { buscarTodas } from "@/lib/data/paginar";

it("erro na leitura não fala de uma tela específica", async () => {
  await expect(buscarTodas(async () => ({ data: null, error: new Error("x") }))).rejects.toThrow("Não foi possível carregar os dados.");
});
