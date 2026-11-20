/** Atualiza o indicador de salvamento do topo (elemento #salvo, com role="status"). */
export function marcarSalvo(estado: "salvando" | "salvo" | "erro" | "sessao") {
  const el = typeof document !== "undefined" ? document.getElementById("salvo") : null;
  if (!el) return;
  el.textContent = estado === "salvando" ? "Salvando…" : estado === "erro" ? "Não foi possível salvar. Verifique a conexão."
    : estado === "sessao" ? "Sua sessão expirou. Copie o que escreveu e entre de novo."
    : `Salvo às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  el.classList.toggle("text-[#f2a383]", estado === "erro" || estado === "sessao");
}
