"use client";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Cartao } from "@/components/ui/Cartao";
import { Botao } from "@/components/ui/Botao";
import { CampoMoeda } from "@/components/ui/CampoMoeda";
import { CampoNumero } from "@/components/ui/CampoNumero";
import { Comparacao } from "@/components/metas/Comparacao";
import { AcoesVenda } from "@/components/metas/AcoesVenda";
import { salvarMetas } from "@/lib/data/metasAcoes";
import { useGravacaoAutomatica } from "@/lib/useGravacaoAutomatica";
import { formatarMoeda } from "@/lib/domain/moeda";
import {
  ALTURAS, PRODUTOS, linhasAlteradas, nadaAlterado, anunciosEmReais, cenarioProdutos, crescimento, dividirEmQuatro, formatarPct, formatarPctSimples, lucroProjetado,
  mediaMensal, pctRealizado, somaTrimestres, type AcaoVenda, type Altura, type LinhaAnual, type MetasForm,
} from "@/lib/domain/metas";

const TRIS = [1, 2, 3, 4] as const;
const th = "px-3 py-2 text-left text-[0.8rem] font-bold uppercase tracking-[.08em] text-sec";
const td = "px-3 py-2 align-top";
const campo = "campo min-w-[8.5rem] text-right";

/** Tabela larga que rola dentro do próprio cartão (a página não rola na horizontal). */
const Rolagem = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
  <div role="region" aria-label={rotulo} tabIndex={0} className="-mx-1 overflow-x-auto px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ouro-texto">
    <table className="w-full min-w-[34rem] border-collapse text-[0.95rem]">{children}</table>
  </div>
);
const Calc = ({ children, testId }: { children: ReactNode; testId?: string }) => (
  <td className={`${td} text-right font-bold tabular-nums text-tinta`} data-testid={testId}>{children}</td>
);

const LINHAS: { chave: keyof LinhaAnual; rotulo: string; moeda?: boolean; inteiro?: boolean }[] = [
  { chave: "faturamento", rotulo: "Faturamento", moeda: true },
  { chave: "lucratividade", rotulo: "Lucratividade %" },
  { chave: "anuncios", rotulo: "Investimento em anúncios %" },
  { chave: "time", rotulo: "Time (pessoas)", inteiro: true },
];

export function MetasFinanceiras({ inicial, base2026, acoes = [] }: { inicial: MetasForm; base2026: number; acoes?: AcaoVenda[] }) {
  const [m, setM] = useState(inicial);
  const gravado = useRef(inicial); // última versão que o banco confirmou
  useGravacaoAutomatica(m, async (v) => {
    const alt = linhasAlteradas(gravado.current, v);
    if (nadaAlterado(alt)) return {};
    const r = await salvarMetas(v, alt);
    if (!r.erro) gravado.current = v;
    return r;
  });
  const anual = (a: Altura, chave: keyof LinhaAnual, v: number) => setM((x) => ({ ...x, anual: { ...x.anual, [a]: { ...x.anual[a], [chave]: v } } }));
  const fat = (a: Altura) => m.anual[a].faturamento;

  return (
    <div className="flex flex-col gap-6">
      <Cartao titulo="Como planejar as metas">
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li><b>Parta do realizado.</b> Use o faturamento de 2026 como base. Uma meta sem relação com o histórico vira desejo.</li>
          <li><b>Defina as três alturas.</b> Meta é o piso com que você se compromete. Super meta é um bom ano. Mega meta é o cenário em que quase tudo dá certo.</li>
          <li><b>Traduza em vendas.</b> Faturamento é ticket vezes quantidade. Distribua a meta entre os seus produtos de entrada, principal e de alto valor e veja quantos contratos ela exige.</li>
          <li><b>Divida por trimestre.</b> Os trimestres não precisam ser iguais. Considere férias, sazonalidade e o tempo de maturação de um planejamento patrimonial.</li>
          <li><b>Cheque a conta.</b> Lucratividade, investimento em anúncios e tamanho do time precisam caber no faturamento previsto.</li>
        </ol>
        <p className="text-sec">
          {base2026 ? <>Base de 2026: faturamento de <b className="text-tinta">{formatarMoeda(base2026)}</b>. </> : "Você ainda não informou o faturamento de 2026, que serve de base para as metas. "}
          <Link href="/diagnostico/fechamento" className="font-bold text-ouro-texto underline underline-offset-4">{base2026 ? "Rever o fechamento de 2026" : "Preencher no fechamento de 2026"}</Link>
        </p>
      </Cartao>

      <Cartao titulo="Meta anual">
        <Rolagem rotulo="Tabela da meta anual">
          <thead><tr><th className={th}><span className="sr-only">Linha</span></th>{ALTURAS.map((a) => <th key={a.valor} className={`${th} text-right`}>{a.nome}</th>)}</tr></thead>
          <tbody>
            {LINHAS.map((l) => (
              <tr key={l.chave} className="border-t border-linha">
                <th scope="row" className={`${td} text-left font-bold text-tinta`}>{l.rotulo}</th>
                {ALTURAS.map((a) => (
                  <td key={a.valor} className={td}>
                    {l.moeda
                      ? <CampoMoeda aria-label={`${l.rotulo} · ${a.nome}`} valor={m.anual[a.valor][l.chave]} onChange={(v) => anual(a.valor, l.chave, v)} className={campo} />
                      : <CampoNumero aria-label={`${l.rotulo} · ${a.nome}`} inteiro={l.inteiro} placeholder={l.inteiro ? "Nº" : "%"} valor={m.anual[a.valor][l.chave]} onChange={(v) => anual(a.valor, l.chave, v)} className={campo} />}
                  </td>
                ))}
              </tr>
            ))}
            {([
              ["Lucro projetado", "lucro", (a: Altura) => formatarMoeda(lucroProjetado(fat(a), m.anual[a].lucratividade))],
              ["Investimento em anúncios (R$)", "ads", (a: Altura) => formatarMoeda(anunciosEmReais(fat(a), m.anual[a].anuncios))],
              ["Média mensal de faturamento", "mensal", (a: Altura) => formatarMoeda(mediaMensal(fat(a)))],
              ["Crescimento sobre 2026", "cresc", (a: Altura) => formatarPct(crescimento(fat(a), base2026))],
            ] as const).map(([rotulo, id, f]) => (
              <tr key={id} className="border-t border-linha bg-papel-2">
                <th scope="row" className={`${td} text-left text-sec`}>{rotulo}</th>
                {ALTURAS.map((a) => <Calc key={a.valor} testId={`${id}-${a.valor}`}>{f(a.valor)}</Calc>)}
              </tr>
            ))}
          </tbody>
        </Rolagem>
        <label className="flex flex-col gap-1.5 font-bold text-tinta">Por que essa meta?
          <textarea defaultValue={m.porque} maxLength={2000} rows={3} className="campo font-normal" placeholder="O que esse faturamento viabiliza na sua vida e no seu escritório."
            onBlur={(e) => { const v = e.target.value; setM((x) => (x.porque === v ? x : { ...x, porque: v })); }} /></label>
      </Cartao>

      <Cartao titulo="Produtos estrela e cenário de vendas">
        <p className="text-sec">Informe o ticket de cada produto e quantas vendas no ano cada altura de meta exige. O sistema soma e compara com a meta anual.</p>
        <Rolagem rotulo="Tabela de produtos estrela">
          <thead><tr><th className={th}>Tipo</th><th className={th}>Produto</th><th className={`${th} text-right`}>Ticket</th>
            {ALTURAS.map((a) => <th key={a.valor} className={`${th} text-right`}>Vendas · {a.nome}</th>)}</tr></thead>
          <tbody>
            {PRODUTOS.map((p) => (
              <tr key={p.tipo} className="border-t border-linha">
                <th scope="row" className={`${td} text-left font-bold text-tinta`}>{p.nome}</th>
                <td className={td}><input aria-label={`Produto · ${p.nome}`} defaultValue={m.produtos[p.tipo].nome} maxLength={200} placeholder={p.exemplo} className="campo min-w-[11rem]"
                  onBlur={(e) => { const v = e.target.value.trim(); setM((x) => (x.produtos[p.tipo].nome === v ? x : { ...x, produtos: { ...x.produtos, [p.tipo]: { ...x.produtos[p.tipo], nome: v } } })); }} /></td>
                <td className={td}><CampoMoeda aria-label={`Ticket · ${p.nome}`} valor={m.produtos[p.tipo].ticket} className={campo}
                  onChange={(v) => setM((x) => ({ ...x, produtos: { ...x.produtos, [p.tipo]: { ...x.produtos[p.tipo], ticket: v } } }))} /></td>
                {ALTURAS.map((a) => (
                  <td key={a.valor} className={td}><CampoNumero aria-label={`Vendas · ${p.nome} · ${a.nome}`} inteiro placeholder="Qtd" valor={m.produtos[p.tipo].vendas[a.valor]} className="campo min-w-[6rem] text-right"
                    onChange={(v) => setM((x) => ({ ...x, produtos: { ...x.produtos, [p.tipo]: { ...x.produtos[p.tipo], vendas: { ...x.produtos[p.tipo].vendas, [a.valor]: v } } } }))} /></td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-linha bg-papel-2"><th scope="row" colSpan={3} className={`${td} text-left text-sec`}>Faturamento do cenário</th>
              {ALTURAS.map((a) => <Calc key={a.valor} testId={`cenario-${a.valor}`}>{formatarMoeda(cenarioProdutos(m, a.valor))}</Calc>)}</tr>
            <tr className="border-t border-linha bg-papel-2"><th scope="row" colSpan={3} className={`${td} text-left text-sec`}>Comparado à meta anual</th>
              {ALTURAS.map((a) => <td key={a.valor} className={`${td} text-right`}><Comparacao testId={`cenario-dif-${a.valor}`} tem={cenarioProdutos(m, a.valor)} alvo={fat(a.valor)} /></td>)}</tr>
          </tbody>
        </Rolagem>
      </Cartao>

      <Cartao titulo="Meta de faturamento por trimestre">
        <Rolagem rotulo="Tabela de metas por trimestre">
          <thead><tr><th className={th}><span className="sr-only">Trimestre</span></th>{ALTURAS.map((a) => <th key={a.valor} className={`${th} text-right`}>{a.nome}</th>)}</tr></thead>
          <tbody>
            {TRIS.map((t) => (
              <tr key={t} className="border-t border-linha">
                <th scope="row" className={`${td} text-left font-bold text-tinta`}>{t}º trimestre</th>
                {ALTURAS.map((a) => (
                  <td key={a.valor} className={td}><CampoMoeda aria-label={`${t}º trimestre · ${a.nome}`} valor={m.trimestres[t][a.valor]} className={campo}
                    onChange={(v) => setM((x) => ({ ...x, trimestres: { ...x.trimestres, [t]: { ...x.trimestres[t], [a.valor]: v } } }))} /></td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-linha bg-papel-2"><th scope="row" className={`${td} text-left text-sec`}>Soma dos trimestres</th>
              {ALTURAS.map((a) => <Calc key={a.valor} testId={`tri-soma-${a.valor}`}>{formatarMoeda(somaTrimestres(m, a.valor))}</Calc>)}</tr>
            <tr className="border-t border-linha bg-papel-2"><th scope="row" className={`${td} text-left text-sec`}>Comparado à meta anual</th>
              {ALTURAS.map((a) => <td key={a.valor} className={`${td} text-right`}><Comparacao testId={`tri-dif-${a.valor}`} tem={somaTrimestres(m, a.valor)} alvo={fat(a.valor)} /></td>)}</tr>
          </tbody>
        </Rolagem>
        <div><Botao variante="secundario" onClick={() => setM((x) => {
          const trimestres = { ...x.trimestres };
          for (const { valor: a } of ALTURAS) {
            if (!x.anual[a].faturamento) continue;
            dividirEmQuatro(x.anual[a].faturamento).forEach((v, i) => { trimestres[TRIS[i]] = { ...trimestres[TRIS[i]], [a]: v }; });
          }
          return { ...x, trimestres };
        })}>Dividir a meta anual em quatro partes iguais</Botao></div>
      </Cartao>

      <Cartao titulo="Realizado por trimestre">
        <p className="text-sec">Lance o faturamento de cada trimestre quando ele terminar. A comparação usa a meta (primeira altura).</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRIS.map((t) => (
            <div key={t} className="flex flex-col gap-1.5">
              <label className="font-bold text-tinta" htmlFor={`real-${t}`}>Realizado no {t}º trimestre</label>
              <CampoMoeda id={`real-${t}`} valor={m.realizado[t]} onChange={(v) => setM((x) => ({ ...x, realizado: { ...x.realizado, [t]: v } }))} />
              <span data-testid={`pct-real-${t}`} className="text-[0.9rem] text-sec">
                {pctRealizado(m.realizado[t], m.trimestres[t].meta) === null ? "—" : `${formatarPctSimples(pctRealizado(m.realizado[t], m.trimestres[t].meta))} da meta`}
              </span>
            </div>
          ))}
        </div>
      </Cartao>

      <AcoesVenda inicial={acoes} metaTrimestre={(t) => m.trimestres[t as 1 | 2 | 3 | 4]?.meta ?? 0} />

      <p className="text-sec">OKRs, resultados-chave e indicadores com medições chegam na próxima etapa.</p>
    </div>
  );
}
