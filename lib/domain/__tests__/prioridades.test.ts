import { expect, test } from "vitest";
import { LIMITE_PRIORIDADES, precisaConfirmar } from "@/lib/domain/prioridades";

test("limite é 3", () => expect(LIMITE_PRIORIDADES).toBe(3));
test("até a 3ª não pede confirmação", () => expect(precisaConfirmar(2)).toBe(false));
test("a 4ª pede confirmação", () => expect(precisaConfirmar(3)).toBe(true));
