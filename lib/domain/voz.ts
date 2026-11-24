// A voz do app: fala com a aluna pelo nome, no horário dela, em português de gente.

/** "Bom dia" / "Boa tarde" / "Boa noite" no horário de Brasília. */
export function saudacao(agora: Date = new Date()): string {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(agora));
  return hora >= 5 && hora < 12 ? "Bom dia" : hora >= 12 && hora < 18 ? "Boa tarde" : "Boa noite";
}

export function primeiroNome(nome: string): string {
  const p = nome.trim().split(/\s+/)[0] ?? "";
  return p ? p[0].toLocaleUpperCase("pt-BR") + p.slice(1) : "";
}

/** ["A", "B", "C"] → "A, B e C". */
export const listaNatural = (itens: string[]) =>
  itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;

/** Mensagem ao concluir uma ação: o progresso real do ano, com um marco a cada 5. */
export function mensagemConclusao(concluidasNoAno: number): string {
  if (concluidasNoAno <= 0) return "Ação concluída.";
  if (concluidasNoAno === 1) return "Primeira ação concluída. Bom começo!";
  return `Ação concluída. Já são ${concluidasNoAno} no ano.${concluidasNoAno % 5 === 0 ? " Que constância!" : ""}`;
}
