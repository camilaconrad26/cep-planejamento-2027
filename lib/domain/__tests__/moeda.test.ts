import { formatarMoeda, parseMoeda } from "@/lib/domain/moeda";

describe("parseMoeda", () => {
  it("aceita os formatos que as alunas digitam", () => {
    expect(parseMoeda("R$ 200.000,00")).toBe(200000);
    expect(parseMoeda("200.000")).toBe(200000);
    expect(parseMoeda("200000")).toBe(200000);
    expect(parseMoeda("1.234,5")).toBe(1234.5);
    expect(parseMoeda(87500)).toBe(87500);
  });
  it("vazio, nulo ou lixo vira zero", () => {
    expect(parseMoeda("")).toBe(0);
    expect(parseMoeda(null)).toBe(0);
    expect(parseMoeda("abc")).toBe(0);
  });
});

describe("formatarMoeda", () => {
  it("formata em reais sem centavos", () => {
    expect(formatarMoeda(87500).replace(/\s/g, " ")).toBe("R$ 87.500");
    expect(formatarMoeda(0).replace(/\s/g, " ")).toBe("R$ 0");
  });
});
