import { expect, test } from "vitest";
import { resumirAlunas } from "@/lib/domain/alunas";

test("resume cada aluna e deixa de fora mentora e administração", () => {
  const r = resumirAlunas({
    perfis: [{ userId: "a", nome: "Bia", email: "bia@x", perfil: 2 }, { userId: "m", nome: "Mentora", email: "m@x", perfil: null }, { userId: "c", nome: "Ana", email: "ana@x", perfil: null }],
    papeis: ["m"],
    membros: [{ userId: "a", orgId: "oa" }, { userId: "m", orgId: "om" }, { userId: "c", orgId: "oc" }],
    diagnosticos: [{ orgId: "oa", concluidoEm: "2026-11-01" }, { orgId: "oc", concluidoEm: null }],
    tarefas: [{ orgId: "oa", status: "concluido" }, { orgId: "oa", status: "em_andamento" }],
    krs: [{ orgId: "oa", inicial: 0, alvo: 10, atual: 5 }],
    ultimas: { oa: "2026-11-20T10:00:00Z" },
  });
  expect(r).toEqual([
    { userId: "c", orgId: "oc", nome: "Ana", email: "ana@x", perfil: null, diagnostico: "iniciado", acoes: { total: 0, concluidas: 0 }, mediaKRs: null, ultima: null },
    { userId: "a", orgId: "oa", nome: "Bia", email: "bia@x", perfil: 2, diagnostico: "concluido", acoes: { total: 2, concluidas: 1 }, mediaKRs: 0.5, ultima: "2026-11-20T10:00:00Z" },
  ]);
});
