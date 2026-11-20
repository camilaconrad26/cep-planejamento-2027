import { voltaSegura } from "@/lib/domain/volta";

it("aceita caminhos internos com busca e âncora", () => {
  expect(voltaSegura("/diagnostico/3")).toBe("/diagnostico/3");
  expect(voltaSegura("/visao-geral?x=1#em-breve")).toBe("/visao-geral?x=1#em-breve");
});
it("recusa saídas para outro site", () => {
  for (const v of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "/\t\\evil.com", "https://evil.com", "evil.com", "/\r//evil.com", ""])
    expect(voltaSegura(v)).toBe("/visao-geral");
});
it("recusa valores que não são texto", () => {
  expect(voltaSegura(null)).toBe("/visao-geral");
  expect(voltaSegura(["/x"])).toBe("/visao-geral");
});
