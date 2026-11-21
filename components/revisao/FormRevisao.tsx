"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { CampoMoeda } from "@/components/ui/CampoMoeda";
import { useAviso } from "@/components/ui/Aviso";
import { concluirRevisao, salvarRevisao } from "@/lib/data/revisaoAcoes";
import { useGravacaoAutomatica } from "@/lib/useGravacaoAutomatica";
import { PERGUNTAS_REVISAO, type RespostasRevisao } from "@/lib/domain/revisao";

/** Perguntas da revisão com gravação automática; "Concluir" salva o relatório com o retrato do momento. */
export function FormRevisao({ trimestre, inicial, faturamento, concluida }: { trimestre: number; inicial: RespostasRevisao; faturamento: number; concluida: boolean }) {
  // O faturamento só é gravado se mudou nesta aba: uma aba aberta antes não apaga o valor gravado em outra.
  const [d, setD] = useState({ respostas: inicial, faturamento, fatMudou: false });
  const dados = (v: typeof d) => (v.fatMudou ? { respostas: v.respostas, faturamento: v.faturamento } : { respostas: v.respostas });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const aviso = useAviso();
  const router = useRouter();
  const id = useId();
  useGravacaoAutomatica(d, (v) => salvarRevisao(trimestre, dados(v)));
  async function concluir() {
    setEnviando(true); setErro("");
    try {
      await salvarRevisao(trimestre, dados(d)); // garante que as últimas respostas entram no relatório
      const r = await concluirRevisao(trimestre);
      if (r.erro) setErro(r.erro === "sessao" ? "Sua sessão expirou. Copie o que escreveu e entre de novo." : r.erro);
      else { aviso({ texto: r.ok ?? "Revisão concluída." }); router.refresh(); }
    } catch { setErro("Não foi possível concluir. Verifique a conexão e tente de novo."); } finally { setEnviando(false); }
  }
  return (
    <section aria-labelledby={`${id}-h`} className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7">
      <h2 id={`${id}-h`} className="font-display text-xl font-bold text-tinta">Perguntas do {trimestre}º trimestre</h2>
      {PERGUNTAS_REVISAO.map((p) => (
        <label key={p.chave} className="flex flex-col gap-1.5 font-bold text-tinta">{p.texto}
          <textarea rows={3} maxLength={5000} value={d.respostas[p.chave] ?? ""} className="campo font-normal"
            onChange={(e) => { const v = e.target.value; setD((x) => ({ ...x, respostas: { ...x.respostas, [p.chave]: v } })); }} />
        </label>
      ))}
      <label className="flex max-w-xs flex-col gap-1.5 font-bold text-tinta" htmlFor={`${id}-f`}>Faturamento realizado no trimestre
        <CampoMoeda id={`${id}-f`} valor={d.faturamento} onChange={(v) => setD((x) => (v === x.faturamento ? x : { ...x, faturamento: v, fatMudou: true }))} /></label>
      <div className="flex flex-wrap items-center gap-3">
        <Botao onClick={concluir} disabled={enviando || concluida}>{enviando ? "Salvando…" : concluida ? "Concluída" : "Concluir revisão"}</Botao>
        {!concluida && <span className="text-[0.88rem] text-sec">Ao concluir, o trimestre fica marcado como revisado. As respostas continuam editáveis.</span>}
      </div>
      {erro && <p role="alert" className="font-bold text-alerta">{erro}</p>}
    </section>
  );
}
