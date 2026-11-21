// Prioridades do trimestre (spec §8): até 3 categorias; a 4ª e seguintes só com confirmação.
export const LIMITE_PRIORIDADES = 3;
export const precisaConfirmar = (jaEscolhidas: number) => jaEscolhidas >= LIMITE_PRIORIDADES;
