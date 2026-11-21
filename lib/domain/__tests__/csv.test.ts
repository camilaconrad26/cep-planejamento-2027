import { expect, test } from "vitest";
import { linhasCsv } from "@/lib/domain/csv";

test("CSV para Excel em português, sem fórmula", () => {
  const s = linhasCsv(["Ação", "Valor"], [["=SOMA(A1)", 12.5], ["a;b", null], ['diz "oi"\nlinha 2', 3], ["-1", "+x"], ["@cmd", 0]]);
  expect(s.startsWith("﻿")).toBe(true);
  const l = s.slice(1).split("\r\n");
  expect(l[0]).toBe("Ação;Valor");
  expect(l[1]).toBe("'=SOMA(A1);12,5");
  expect(l[2]).toBe('"a;b";');
  expect(l[3]).toBe('"diz ""oi""\nlinha 2";3'); // quebra de linha fica dentro da célula
  expect(s).toContain("'-1;'+x");
  expect(s).toContain("'@cmd;0");
});
