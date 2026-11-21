"use client";
import { useRef, useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { CampoMoeda } from "@/components/ui/CampoMoeda";
import { CampoNumero } from "@/components/ui/CampoNumero";
import { Comparacao } from "@/components/metas/Comparacao";
import { criarAcaoVenda, excluirAcaoVenda, salvarAcaoVenda } from "@/lib/data/metasAcoes";
import { MESES, faturamentoAcao, previstoMes, previstoTrimestre, type AcaoVenda } from "@/lib/domain/metas";
import { formatarMoeda } from "@/lib/domain/moeda";
import { hojeSP, trimestreAtual } from "@/lib/domain/ciclo";
import { marcarSalvo } from "@/lib/salvo";

/** Ações de vendas por mês: cada linha é gravada ao sair de um campo. */
export function AcoesVenda({ inicial, metaTrimestre }: { inicial: AcaoVenda[]; metaTrimestre: (t: number) => number }) {
  const [acoes, setAcoes] = useState(inicial);
  const [tri, setTri] = useState<number>(trimestreAtual(2027, hojeSP()).trimestre);
  const [erro, setErro] = useState("");
  const ultimo = useRef(acoes); ultimo.current = acoes;
  const trava = useRef(false);
  const novas = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const mudar = (id: string, patch: Partial<AcaoVenda>) => setAcoes((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  async function gravar(id: string, patch: Partial<AcaoVenda> = {}) {
    const atual = ultimo.current.find((x) => x.id === id); if (!atual) return;
    const a = { ...atual, ...patch }; // grava já com a mudança, sem esperar a tela atualizar
    marcarSalvo("salvando");
    try {
      const r = await salvarAcaoVenda(a);
      if (r.erro === "sessao") { marcarSalvo("sessao"); return; }
      if (r.erro) throw new Error(r.erro);
      clearTimeout(novas.current[id]);
      marcarSalvo("salvo"); setErro("");
    } catch {
      marcarSalvo("erro"); setErro("Não foi possível salvar a ação de vendas. Tentando de novo…");
      clearTimeout(novas.current[id]);
      novas.current[id] = setTimeout(() => gravar(id), 5000); // tenta de novo com a versão mais recente da linha
    }
  }
  async function adicionar(mes: number) {
    if (trava.current) return; trava.current = true; setErro("");
    try {
      const r = await criarAcaoVenda(mes);
      if (r.id) setAcoes((l) => [...l, { id: r.id!, mes, produto: "", acao: "", ticket: 0, quantidade: 0, responsavel: "" }]);
      else setErro(r.erro === "sessao" ? "Sua sessão expirou. Entre de novo." : "Não foi possível adicionar. Tente de novo.");
    } catch { setErro("Não foi possível adicionar. Verifique a conexão."); } finally { trava.current = false; }
  }
  async function remover(id: string) {
    setErro("");
    try {
      const r = await excluirAcaoVenda(id);
      if (r.erro) { setErro(r.erro === "sessao" ? "Sua sessão expirou. Entre de novo." : r.erro); return; }
      setAcoes((l) => l.filter((a) => a.id !== id));
    } catch { setErro("Não foi possível remover. Verifique a conexão."); }
  }

  const meses = [0, 1, 2].map((k) => (tri - 1) * 3 + 1 + k);
  return (
    <section aria-labelledby="titulo-vendas" className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7 sm:py-6">
      <h2 id="titulo-vendas" className="font-display text-xl font-bold leading-snug text-tinta">Ações de vendas por mês</h2>
      <p className="text-sec">Para cada mês, liste as ações que vão gerar o faturamento: o produto, como você vai vender, o ticket e quantas vendas espera.</p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((t) => (
          <button key={t} type="button" aria-pressed={t === tri} onClick={() => setTri(t)}
            className={`min-h-[44px] rounded-full border-[1.5px] px-4 text-[0.9rem] font-bold ${t === tri ? "border-ouro-texto bg-ouro-texto text-white" : "border-ouro-fio text-tinta hover:bg-papel-2"}`}>{t}º trimestre</button>
        ))}
      </div>
      {meses.map((mes) => {
        const doMes = acoes.filter((a) => a.mes === mes);
        return (
          <fieldset key={mes} className="flex min-w-0 flex-col gap-2 border-t border-linha pt-3">
            <legend className="font-display text-[1.05rem] font-bold text-tinta">{MESES[mes - 1]}</legend>
            {doMes.length === 0 && <p className="text-sec">Nenhuma ação planejada.</p>}
            {doMes.map((a, i) => {
              const n = i + 1;
              return (
                <div key={a.id} className="grid gap-2 rounded-cartao border border-linha p-3 sm:grid-cols-2 lg:grid-cols-6">
                  <input aria-label={`Produto da ação ${n}`} value={a.produto} maxLength={200} placeholder="Produto" className="campo lg:col-span-1"
                    onChange={(e) => mudar(a.id, { produto: e.target.value })} onBlur={() => gravar(a.id)} />
                  <input aria-label={`Como vender (ação ${n})`} value={a.acao} maxLength={500} placeholder="Live, indicação, conteúdo…" className="campo lg:col-span-2"
                    onChange={(e) => mudar(a.id, { acao: e.target.value })} onBlur={() => gravar(a.id)} />
                  <CampoMoeda aria-label={`Ticket da ação ${n}`} valor={a.ticket} onChange={(v) => { mudar(a.id, { ticket: v }); gravar(a.id, { ticket: v }); }} />
                  <CampoNumero aria-label={`Vendas da ação ${n}`} inteiro placeholder="Qtd" valor={a.quantidade} onChange={(v) => { mudar(a.id, { quantidade: v }); gravar(a.id, { quantidade: v }); }} />
                  <input aria-label={`Responsável da ação ${n}`} value={a.responsavel} maxLength={120} placeholder="Responsável" className="campo"
                    onChange={(e) => mudar(a.id, { responsavel: e.target.value })} onBlur={() => gravar(a.id)} />
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 lg:col-span-6">
                    <span className="text-sec">Faturamento: <b data-testid={`fat-acao-${n}`} className="text-tinta">{formatarMoeda(faturamentoAcao(a))}</b></span>
                    <Botao tamanho="mini" variante="secundario" aria-label={`Remover ação ${n}`} onClick={() => remover(a.id)}>Remover</Botao>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Botao tamanho="mini" variante="secundario" onClick={() => adicionar(mes)}>Adicionar ação de vendas</Botao>
              <span className="text-sec">Previsto no mês: <b className="text-tinta">{formatarMoeda(previstoMes(acoes, mes))}</b></span>
            </div>
          </fieldset>
        );
      })}
      <p className="border-t border-linha pt-3 text-tinta">Previsto no trimestre: <b data-testid="previsto-tri">{formatarMoeda(previstoTrimestre(acoes, tri))}</b>{" "}
        <span className="text-sec">· meta do trimestre: </span><Comparacao tem={previstoTrimestre(acoes, tri)} alvo={metaTrimestre(tri)} /></p>
      {erro && <p role="alert" className="font-bold text-alerta">{erro}</p>}
    </section>
  );
}
