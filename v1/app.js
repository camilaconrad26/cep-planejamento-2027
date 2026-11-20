/* Planejamento Estratégico 2027 | CEP */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = v => {
    if (typeof v === "number") return v;
    if (!v) return 0;
    let s = String(v).replace(/[^\d,.-]/g, "");
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  };
  const brl = n => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const pct = n => (isFinite(n) ? Math.round(n) : 0) + "%";
  const uid = () => Math.random().toString(36).slice(2, 9);
  const getP = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setP = (o, p, v) => {
    const ks = p.split(".");
    ks.slice(0, -1).forEach(k => { if (o[k] == null || typeof o[k] !== "object") o[k] = {}; o = o[k]; });
    o[ks.at(-1)] = v;
  };
  const LV = ["Meta", "Super meta", "Mega meta"];

  /* ---------- Backend ---------- */
  const cfg = window.CEP_CONFIG || {};
  const DEMO = !cfg.supabaseUrl;
  const api = DEMO ? demoApi() : supaApi();

  function supaApi() {
    const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    const fn = async (body, token) => {
      const r = await fetch(cfg.supabaseUrl + "/functions/v1/cep2027-conta", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.supabaseKey, Authorization: "Bearer " + (token || cfg.supabaseKey) },
        body: JSON.stringify(body)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível concluir. Tente de novo.");
      return j;
    };
    const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
    return {
      async sessao() { const { data } = await sb.auth.getSession(); return data.session ? { id: data.session.user.id, email: data.session.user.email } : null; },
      async entrar(email, senha) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw new Error("E-mail ou senha incorretos.");
        return { id: data.user.id, email: data.user.email };
      },
      async cadastrar(nome, email, senha, codigo) { await fn({ acao: "cadastro", nome, email, senha, codigoMentora: codigo || "" }); return this.entrar(email, senha); },
      async sair() { await sb.auth.signOut(); },
      async trocarSenha(nova) { must(await sb.auth.updateUser({ password: nova })); },
      async carregar(u) {
        let row = must(await sb.from("cep2027_planos").select("nome,dados").eq("user_id", u.id).maybeSingle());
        if (!row) { row = { nome: u.email, dados: {} }; must(await sb.from("cep2027_planos").insert({ user_id: u.id, nome: u.email, email: u.email, dados: {} })); }
        const m = must(await sb.from("cep2027_mentoras").select("user_id").eq("user_id", u.id).maybeSingle());
        return { nome: row.nome, dados: row.dados || {}, mentora: !!m };
      },
      async salvar(u, dados) { must(await sb.from("cep2027_planos").update({ dados, atualizado_em: new Date().toISOString() }).eq("user_id", u.id).select("user_id")); },
      async listar() { return must(await sb.from("cep2027_planos").select("user_id,nome,email,dados,atualizado_em").order("nome")); },
      async redefinir(userId, novaSenha) { const { data } = await sb.auth.getSession(); await fn({ acao: "redefinir", userId, novaSenha }, data.session.access_token); }
    };
  }

  function demoApi() {
    const K = "cep-plan-demo";
    const ler = () => { try { return JSON.parse(localStorage.getItem(K)) || { users: {}, planos: {}, sessao: null }; } catch { return { users: {}, planos: {}, sessao: null }; } };
    const gravar = d => { try { localStorage.setItem(K, JSON.stringify(d)); } catch { /* sem armazenamento */ } };
    return {
      async sessao() { const d = ler(); const u = d.users[d.sessao]; return u ? { id: u.id, email: d.sessao } : null; },
      async entrar(email, senha) { const d = ler(); const u = d.users[email]; if (!u || u.senha !== senha) throw new Error("E-mail ou senha incorretos."); d.sessao = email; gravar(d); return { id: u.id, email }; },
      async cadastrar(nome, email, senha, codigo) {
        const d = ler();
        if (d.users[email]) throw new Error("Este e-mail já tem cadastro. Use \"Entrar\".");
        if (codigo && codigo !== "MENTORA") throw new Error("Código da mentora inválido.");
        const id = uid();
        d.users[email] = { id, nome, senha, mentora: !!codigo };
        d.planos[id] = { user_id: id, nome, email, dados: {}, atualizado_em: new Date().toISOString() };
        d.sessao = email; gravar(d); return { id, email };
      },
      async sair() { const d = ler(); d.sessao = null; gravar(d); },
      async trocarSenha(nova) { const d = ler(); d.users[d.sessao].senha = nova; gravar(d); },
      async carregar(u) { const d = ler(); return { nome: d.users[u.email].nome, dados: d.planos[u.id].dados, mentora: d.users[u.email].mentora }; },
      async salvar(u, dados) { const d = ler(); d.planos[u.id].dados = dados; d.planos[u.id].atualizado_em = new Date().toISOString(); gravar(d); },
      async listar() { return Object.values(ler().planos).sort((a, b) => a.nome.localeCompare(b.nome)); },
      async redefinir(userId, nova) { const d = ler(); Object.values(d.users).forEach(u => { if (u.id === userId) u.senha = nova; }); gravar(d); }
    };
  }

  /* ---------- Estado ---------- */
  const S = { user: null, nome: "", mentora: false, meu: {}, D: {}, ro: false, vendo: null, aba: "inicio", tri: 1, modo: "entrar", erro: "", lista: null, salvo: "" };
  let timer = null, pendente = false;

  // Campos que eram texto livre na primeira versão viram listas de itens (um por linha), que podem virar tarefas.
  const LISTAS_RETRO = ["conquistas", "naoFuncionou", "aprendizados", "parar", "continuar", "comecar"];
  function emLista(v) {
    if (Array.isArray(v)) return v;
    return String(v ?? "").split(/\n+/).map(t => t.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean).map(texto => ({ id: uid(), texto }));
  }
  const ROTULO_LISTA = { conquistas: "O que deu certo", naoFuncionou: "O que não funcionou", aprendizados: "O que 2026 ensinou", parar: "Parar de fazer", continuar: "Continuar fazendo", comecar: "Começar a fazer", ajustes: "Ajustes do trimestre" };

  function normalizar(d) {
    d.retro ??= {}; d.retro.notas ??= {}; d.retro.pend ??= [];
    d.metas ??= {}; d.metas.anual ??= {}; d.metas.tri ??= {}; d.metas.prod ??= {};
    d.itens ??= {}; d.custom ??= []; d.tri ??= {}; d.vendas ??= {};
    for (let q = 1; q <= 4; q++) { d.tri[q] ??= {}; d.tri[q].ritual ??= {}; d.tri[q].ajustes = emLista(d.tri[q].ajustes); }
    LISTAS_RETRO.forEach(k => { d.retro[k] = emLista(d.retro[k]); });
    d.tarefas ??= [];
    return d;
  }
  function agendar() {
    if (S.ro) return;
    pendente = true; status("Salvando…");
    clearTimeout(timer); timer = setTimeout(salvarAgora, 900);
  }
  async function salvarAgora() {
    if (!pendente || S.ro) return;
    pendente = false;
    try { await api.salvar(S.user, S.meu); status("Salvo às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })); }
    catch (e) { pendente = true; status("Não foi possível salvar. Verifique a conexão.", true); timer = setTimeout(salvarAgora, 5000); }
  }
  function status(t, erro) { S.salvo = t; const el = $("#salvo"); if (el) { el.textContent = t; el.classList.toggle("erro", !!erro); } }
  window.addEventListener("beforeunload", e => { if (pendente) { salvarAgora(); e.preventDefault(); } });

  /* ---------- Itens (níveis) ---------- */
  function itens(D = S.D) {
    const out = [];
    const p = D.perfil;
    if (p) SEMENTE[p - 1].forEach((arr, c) => arr.forEach((t, n) => {
      const key = `p${p}c${c}n${n}`, st = D.itens[key] || {};
      out.push({ path: "itens." + key, cat: c, nivel: n, texto: st.texto ?? t, st, custom: false });
    }));
    D.custom.forEach((it, i) => out.push({ path: "custom." + i, cat: it.cat, nivel: it.nivel, texto: it.texto || "", st: it, custom: true, i }));
    return out;
  }
  const feitos = (D = S.D) => itens(D).filter(i => i.st.fazer);

  /* ---------- Cálculos ---------- */
  const A = (campo, i) => num(getP(S.D, `metas.anual.${campo}.${i}`));
  const prodFat = (r, i) => num(getP(S.D, `metas.prod.${r}.ticket`)) * num(getP(S.D, `metas.prod.${r}.v${i}`));
  const prodTot = i => [0, 1, 2].reduce((s, r) => s + prodFat(r, i), 0);
  const triSoma = i => [1, 2, 3, 4].reduce((s, q) => s + num(getP(S.D, `metas.tri.${q}.${i}`)), 0);
  const vendasMes = m => (S.D.vendas[m] || []).reduce((s, v) => s + num(v.ticket) * num(v.qtd), 0);
  const vendasTri = q => [0, 1, 2].reduce((s, k) => s + vendasMes((q - 1) * 3 + k), 0);
  const dif = (tem, alvo) => {
    if (!alvo) return "";
    const d = tem - alvo;
    if (Math.abs(d) < 1) return '<span class="bom">fecha com a meta</span>';
    return d < 0 ? `<span class="aviso">faltam ${brl(-d)}</span>` : `<span class="bom">${brl(d)} acima</span>`;
  };
  function progTri(q, D = S.D) {
    const its = feitos(D).filter(i => String(i.st.tri) === String(q));
    const pend = D.retro.pend.filter(p => p.destino === "levar" && String(p.tri) === String(q));
    const tar = D.tarefas.filter(t => String(t.tri) === String(q));
    const total = its.length + pend.length + tar.length + 10;
    const ok = its.filter(i => i.st.status === "Concluído").length + pend.filter(p => p.feito).length + tar.filter(t => t.feito).length + Object.values(D.tri[q].ritual).filter(Boolean).length;
    return { total, ok, p: total ? (ok / total) * 100 : 0 };
  }
  function progresso(D = S.D) {
    const r = D.retro, cheio = v => (v ? 1 : 0);
    const retro = (cheio(num(r.fat)) + cheio(r.conquistas.length) + cheio(r.naoFuncionou.length) + cheio(r.aprendizados.length) + cheio(r.parar.length) + cheio(r.continuar.length) + cheio(r.comecar.length) + cheio(Object.keys(r.notas).length) + cheio(r.pend.length)) / 9;
    let m = 0; [0, 1, 2].forEach(i => { m += cheio(num(getP(D, `metas.anual.fat.${i}`))); });
    [1, 2, 3, 4].forEach(q => { m += cheio(num(getP(D, `metas.tri.${q}.0`))); });
    m += cheio([0, 1, 2].some(x => num(getP(D, `metas.prod.${x}.ticket`))));
    const f = feitos(D);
    const plano = (cheio(D.perfil) + cheio(f.length >= 3) + cheio(f.length && f.every(i => i.st.tri))) / 3;
    const tri = [1, 2, 3, 4].reduce((s, q) => s + progTri(q, D).p, 0) / 400;
    return { retro: retro * 100, metas: (m / 8) * 100, plano: plano * 100, tri: tri * 100 };
  }
  const CALC = {
    ticket: () => { const c = num(S.D.retro.contratos); return c ? brl(num(S.D.retro.fat) / c) : "—"; },
    atingido: () => { const m = num(S.D.retro.meta); return m ? pct((num(S.D.retro.fat) / m) * 100) : "—"; },
    fracas: () => {
      const n = S.D.retro.notas, ks = Object.keys(n);
      if (ks.length < 3) return "Dê nota a pelo menos três áreas para ver onde concentrar o esforço.";
      const o = ks.map(k => [CATS[k], +n[k]]).sort((a, b) => a[1] - b[1]).slice(0, 3);
      return "Menores notas: " + o.map(x => `<b>${esc(x[0])}</b> (${x[1]})`).join(", ") + ". São candidatas a categoria de foco no primeiro trimestre.";
    },
    lucro: i => brl(A("fat", i) * A("lucro", i) / 100),
    ads: i => brl(A("fat", i) * A("ads", i) / 100),
    mensal: i => brl(A("fat", i) / 12),
    cresc: i => { const b = num(S.D.retro.fat); return b && A("fat", i) ? (A("fat", i) >= b ? "+" : "") + pct((A("fat", i) / b - 1) * 100) : "—"; },
    prod: (r, i) => brl(prodFat(r, i)),
    prodTot: i => brl(prodTot(i)),
    prodDif: i => dif(prodTot(i), A("fat", i)),
    triSoma: i => brl(triSoma(i)),
    triDif: i => dif(triSoma(i), A("fat", i)),
    conta: () => {
      const f = feitos(), cs = new Set(f.map(i => i.cat));
      let t = `${f.length} ${f.length === 1 ? "item marcado" : "itens marcados"} em ${cs.size} ${cs.size === 1 ? "categoria" : "categorias"}.`;
      const sem = f.filter(i => !i.st.tri).length;
      if (sem) t += ` <span class="aviso">${sem} sem trimestre definido.</span>`;
      [1, 2, 3, 4].forEach(q => { const n = new Set(f.filter(i => String(i.st.tri) === String(q)).map(i => i.cat)).size; if (n > 3) t += ` <span class="aviso">O ${q}º trimestre tem ${n} categorias; a sugestão é no máximo três.</span>`; });
      return t;
    },
    catQt: c => { const n = feitos().filter(i => i.cat === +c).length; return n ? n + " em Fazer" : ""; },
    vLinha: (m, i) => { const v = (S.D.vendas[m] || [])[i] || {}; return brl(num(v.ticket) * num(v.qtd)); },
    vMes: m => brl(vendasMes(+m)),
    vTri: q => brl(vendasTri(+q)),
    vTriDif: q => dif(vendasTri(+q), num(getP(S.D, `metas.tri.${q}.0`))),
    triProg: q => { const p = progTri(+q); return `${p.ok} de ${p.total} concluídos`; },
    triReal: q => { const m = num(getP(S.D, `metas.tri.${q}.0`)), r = num(S.D.tri[q].realizado); return m && r ? pct((r / m) * 100) + " da meta" : "—"; }
  };
  const BAR = { tri: q => progTri(+q).p, geral: k => progresso()[k] };
  function recalc() {
    app.querySelectorAll("[data-calc]").forEach(el => { const [f, ...a] = el.dataset.calc.split(":"); el.innerHTML = CALC[f](...a); });
    app.querySelectorAll("[data-bar]").forEach(el => { const [f, a] = el.dataset.bar.split(":"); el.style.width = Math.round(BAR[f](a)) + "%"; });
    app.querySelectorAll("output[data-de]").forEach(el => { el.textContent = getP(S.D, el.dataset.de) ?? "–"; });
  }

  /* ---------- Campos ---------- */
  const v = p => esc(getP(S.D, p) ?? "");
  const c = (calc, tag = "span") => `<${tag} data-calc="${calc}"></${tag}>`;
  const texto = (p, ph = "", extra = "") => `<input type="text" id="f-${p}" data-p="${p}" value="${v(p)}" placeholder="${esc(ph)}" ${extra}>`;
  const moeda = (p, ph = "R$") => `<input type="text" inputmode="decimal" id="f-${p}" data-p="${p}" data-moeda value="${v(p)}" placeholder="${ph}">`;
  /** Lista de itens curtos; cada item pode virar tarefa de um trimestre. */
  function lista(p, rot, ajuda, triPadrao = 1) {
    const itens = getP(S.D, p) || [], idNovo = "nova-" + p.replace(/\./g, "-"), idT = "t-" + idNovo;
    return `<div class="lista" role="group" aria-labelledby="${idT}"><h3 id="${idT}">${rot}</h3><p class="ajuda">${esc(ajuda)}</p>
      <ul>${itens.map((it, i) => {
        const tarefa = it.tarefa && S.D.tarefas.find(t => t.id === it.tarefa);
        return `<li class="li-item"><input type="text" id="f-${p}.${i}.texto" data-p="${p}.${i}.texto" value="${esc(it.texto)}" aria-label="${esc(rot)}, item ${i + 1}">
        ${tarefa ? `<button type="button" class="virou" data-act="irTri" data-arg="${tarefa.tri}">✓ Tarefa criada no ${tarefa.tri}º tri</button>`
          : `<span class="li-acoes">${sel(`${p}.${i}.tri`, TRIS, false, `${triPadrao}º tri`, "Trimestre da tarefa")}<button type="button" class="btn sec mini" data-act="virarTarefa" data-arg="${p}|${i}">Criar tarefa</button></span>`}
        <button type="button" class="btn x" data-act="rmLista" data-arg="${p}|${i}" aria-label="Remover item">×</button></li>`;
      }).join("")}</ul>
      <div class="li-novo"><input type="text" id="${idNovo}" data-add="${p}" placeholder="Escreva e tecle Enter" aria-label="Novo item em ${esc(rot)}"><button type="button" class="btn sec mini" data-act="addLista" data-arg="${p}">Adicionar</button></div>
      <span hidden data-tri-padrao="${p}">${triPadrao}</span></div>`;
  }
  const area = (p, rot, ph = "") => `<label class="campo"><span>${rot}</span><textarea id="f-${p}" data-p="${p}" placeholder="${esc(ph)}">${v(p)}</textarea></label>`;
  const campo = (rot, html) => `<label class="campo"><span>${rot}</span>${html}</label>`;
  const sel = (p, ops, rr, vazio = "—", rot) => { const a = String(getP(S.D, p) ?? ""); return `<select id="f-${p}" data-p="${p}" aria-label="${esc(rot || vazio)}" ${rr ? "data-rr" : ""}><option value="">${vazio}</option>${ops.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === a ? "selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`; };
  const chk = (p, rr) => `<input type="checkbox" id="f-${p}" data-p="${p}" ${getP(S.D, p) ? "checked" : ""} ${rr ? "data-rr" : ""}>`;
  const TRIS = [[1, "1º tri"], [2, "2º tri"], [3, "3º tri"], [4, "4º tri"]];
  const cab = (olho, tit, desc) => `<header class="cabeca escuro"><div class="wrap"><p class="olho">${olho}</p><h1>${tit}</h1><p class="desc">${desc}</p></div></header>`;

  /* ---------- Abas ---------- */
  const ABAS = [["inicio", "Início"], ["retro", "Olhar para 2026"], ["metas", "Metas 2027"], ["plano", "Estratégico × Tático × Operacional"], ["tri", "Trimestres"]];

  function vInicio() {
    const p = progresso(), f = feitos(), levar = S.D.retro.pend.filter(x => x.destino === "levar").length;
    const et = [["retro", "1. Olhar para 2026", "O que passou, o que ficou pendente e o que melhorar."], ["metas", "2. Metas 2027", "Meta, super meta e mega meta, por ano e por trimestre."], ["plano", "3. Os três níveis", "Do objetivo à tarefa da semana, com OKR e KPI."], ["tri", "4. Trimestres", "O que fazer em cada trimestre, com conferência."]];
    const prox = !S.D.perfil ? null : (et.find(e => p[e[0]] < 99.5) || et[3]);
    const fat26 = num(S.D.retro.fat), meta = A("fat", 0);
    return cab("Turma 2027 · Área da aluna", 'Planejamento Estratégico <span class="ouro">2027</span>', "Planejamento da advocacia patrimonial. Este espaço serve para planejar o seu negócio, não o caso do cliente.") + `
    <div class="destaque">Leia a teoria, identifique o seu perfil e siga as quatro etapas na ordem. Tudo o que você escreve é salvo automaticamente e fica visível só para você e para a mentora do CEP.</div>
    <section class="cartao" aria-labelledby="h-perfil"><h2 id="h-perfil">Qual é o seu perfil?</h2>
      <div class="perfis" role="radiogroup" aria-labelledby="h-perfil">${PERFIS.map((x, i) => `<label class="perfil"><input type="radio" name="perfil" id="perfil-${i + 1}" data-p="perfil" data-rr value="${i + 1}" ${String(S.D.perfil) === String(i + 1) ? "checked" : ""}><span><b>${x[0]}</b><small>${x[1]}</small></span></label>`).join("")}</div>
      <p>O perfil define as sugestões que aparecem na etapa dos três níveis. Você pode trocar depois sem perder o que já marcou.</p>
    </section>
    <section class="cartao" aria-labelledby="h-resumo"><h2 id="h-resumo">Resumo do seu plano</h2>
      <div class="kpis">
        <div><small>Faturamento 2026</small><span class="numero">${fat26 ? brl(fat26) : "—"}</span></div>
        <div><small>Meta 2027</small><span class="numero">${meta ? brl(meta) : "—"}</span></div>
        <div><small>Crescimento</small><span class="numero">${CALC.cresc(0)}</span></div>
        <div><small>Itens em Fazer</small><span class="numero">${f.length}</span></div>
        <div><small>Pendências levadas</small><span class="numero">${levar}</span></div>
      </div>
      <div class="etapas">${et.map(e => `<button type="button" class="etapa" data-act="aba" data-arg="${e[0]}"><span class="num" aria-hidden="true">0${e[1][0]}</span><b><span class="sr">${e[1][0]}. </span>${e[1].slice(3)}</b><small>${e[2]}</small><span class="barra" aria-hidden="true"><i data-bar="geral:${e[0]}"></i></span><small>${pct(p[e[0]])} preenchido</small></button>`).join("")}</div>
      <div>${prox ? `<button type="button" class="btn" data-act="aba" data-arg="${prox[0]}">Continuar em ${prox[1].slice(3)} →</button>` : '<p class="aviso">Escolha o seu perfil acima para começar.</p>'}</div>
    </section>
    <section class="cartao" aria-labelledby="h-teoria"><h2 id="h-teoria">Teoria</h2>
      <details open><summary>Planejamento x plano</summary><div><ul>
        <li><b>Planejamento estratégico</b> é o processo de decidir para onde a sua advocacia vai: que famílias você quer atender, com que serviços e em que prazo. O ciclo recomendado é de 12 meses, com revisão a cada trimestre.</li>
        <li><b>Plano</b> é o documento que sai desse processo: as ações, os responsáveis e as datas. Sem plano, o planejamento fica na intenção.</li></ul></div></details>
      <details><summary>Os três níveis</summary><div>${tabNiveis()}</div></details>
      <details><summary>OKR e KPI</summary><div><ul>
        <li><b>OKR</b> une um objetivo a resultados-chave mensuráveis, com prazo. Exemplo: objetivo "transformar conversas em diagnósticos"; resultado-chave "fechar 3 diagnósticos em 90 dias".</li>
        <li><b>KPI</b> é o indicador que você acompanha de forma contínua para saber se a operação está saudável. Exemplo: taxa de conversão de conversa inicial em diagnóstico.</li>
        <li>O OKR muda a cada ciclo. O KPI permanece e mostra a tendência.</li></ul></div></details>
    </section>`;
  }
  const tabNiveis = () => `<div class="rolagem"><table><thead><tr><th>Nível</th><th>Pergunta</th><th>Horizonte</th><th>Exemplo na advocacia patrimonial</th></tr></thead><tbody>
    <tr><td><b>Estratégico</b></td><td>O que eu quero alcançar e por quê?</td><td>12 meses ou mais</td><td>Ser referência em famílias empresárias da minha região</td></tr>
    <tr><td><b>Tático</b></td><td>Como eu vou chegar lá?</td><td>3 a 6 meses</td><td>Separar a oferta em diagnóstico, viabilidade e implementação</td></tr>
    <tr><td><b>Operacional</b></td><td>O que eu faço, e quando?</td><td>Semana a semana</td><td>Escrever o roteiro da conversa inicial até sexta-feira</td></tr></tbody></table></div>`;

  function vRetro() {
    const R = S.D.retro;
    return cab("Etapa 1", "Olhar para 2026", "Antes de definir 2027, feche 2026 com sinceridade. O que você registrar aqui alimenta as metas e os trimestres.") + `
    <section class="cartao"><h2>2026 em números</h2>
      <div class="grade">
        ${campo("Faturamento realizado em 2026", moeda("retro.fat"))}
        ${campo("Meta que você tinha para 2026", moeda("retro.meta"))}
        ${campo("Contratos fechados no ano", texto("retro.contratos", "Quantidade", 'inputmode="numeric"'))}
        ${campo("Principal origem dos clientes", texto("retro.origem", "Indicação, conteúdo, parceiros…"))}
      </div>
      <div class="kpis"><div><small>Ticket médio</small>${c("ticket", 'span class="numero"')}</div><div><small>Meta atingida</small>${c("atingido", 'span class="numero"')}</div></div>
    </section>
    <section class="cartao"><h2>Nota por área</h2><p>De 0 a 10, como cada área do seu negócio terminou o ano?</p>
      ${CATS.map((n, i) => `<div class="nota"><span>${n}</span><input type="range" min="0" max="10" step="1" id="f-nota-${i}" data-p="retro.notas.${i}" value="${R.notas[i] ?? 5}" aria-label="Nota para ${n}"><output data-de="retro.notas.${i}">${R.notas[i] ?? "–"}</output></div>`).join("")}
      <p data-calc="fracas"></p>
    </section>
    <section class="cartao"><h2>O que passou</h2><p>Um item por linha. O que pedir ação vira tarefa com um clique e aparece no trimestre escolhido.</p><div class="grade g2">
      ${lista("retro.conquistas", "O que deu certo", "Casos, entregas, parcerias e hábitos que funcionaram.")}
      ${lista("retro.naoFuncionou", "O que não funcionou", "O que travou, o que você tentou e abandonou, o que custou caro.")}
      ${lista("retro.aprendizados", "O que 2026 ensinou", "O que você faria diferente se o ano começasse hoje.")}
    </div></section>
    <section class="cartao"><h2>Pendências</h2><p>Liste o que ficou em aberto e decida o destino de cada item. O que você levar para 2027 aparece na conferência do trimestre escolhido.</p>
      <div>${R.pend.map((p, i) => `<div class="linha-item">${texto(`retro.pend.${i}.texto`, "Descreva a pendência", 'aria-label="Pendência"')}${sel(`retro.pend.${i}.destino`, [["levar", "Levar para 2027"], ["delegar", "Delegar"], ["encerrar", "Encerrar de vez"]], true, "Destino")}${p.destino === "levar" ? sel(`retro.pend.${i}.tri`, TRIS, false, "Quando") : "<span></span>"}<button type="button" class="btn x" data-act="rmPend" data-arg="${i}" aria-label="Remover pendência">×</button></div>`).join("") || '<p class="ajuda">Nenhuma pendência registrada.</p>'}</div>
      <div><button type="button" class="btn sec" data-act="addPend">Adicionar pendência</button></div>
    </section>
    <section class="cartao"><h2>O que melhorar</h2><div class="grade g2">
      ${lista("retro.parar", "Parar de fazer", "O que consome tempo e não traz resultado.")}
      ${lista("retro.continuar", "Continuar fazendo", "O que funciona e merece ser mantido.")}
      ${lista("retro.comecar", "Começar a fazer", "O que faltou em 2026 e entra em 2027.")}
    </div></section>`;
  }

  function vMetas() {
    const linhas = [["fat", "Faturamento", moeda], ["lucro", "Lucratividade %", p => texto(p, "%", 'inputmode="decimal"')], ["ads", "Investimento em anúncios %", p => texto(p, "%", 'inputmode="decimal"')], ["time", "Time (pessoas)", p => texto(p, "Nº", 'inputmode="numeric"')]];
    const th3 = LV.map(l => `<th class="n">${l}</th>`).join("");
    return cab("Etapa 2", "Metas 2027", "Três alturas para o mesmo ano: a meta que você se compromete a bater, a super meta que exige esforço extra e a mega meta que seria um ano excepcional.") + `
    <p class="contexto">${num(S.D.retro.fat) ? `Base de 2026: faturamento de <b>${brl(num(S.D.retro.fat))}</b>, ticket médio de <b>${CALC.ticket()}</b>.` : "Você ainda não informou o faturamento de 2026, que serve de base para as metas."} <button type="button" class="link" data-act="aba" data-arg="retro">${num(S.D.retro.fat) ? "Rever 2026" : "Preencher 2026"}</button></p>
    <section class="cartao"><h2>Como planejar as metas</h2><ol class="passos">
      <li><b>Parta do realizado.</b> Use o faturamento de 2026 como base. Uma meta sem relação com o histórico vira desejo.</li>
      <li><b>Defina as três alturas.</b> Meta é o piso com que você se compromete. Super meta é um bom ano. Mega meta é o cenário em que quase tudo dá certo.</li>
      <li><b>Traduza em vendas.</b> Faturamento é ticket vezes quantidade. Distribua a meta entre os seus produtos de entrada, principal e de alto valor e veja quantos contratos ela exige.</li>
      <li><b>Divida por trimestre.</b> Os trimestres não precisam ser iguais. Considere férias, sazonalidade e o tempo de maturação de um planejamento patrimonial.</li>
      <li><b>Cheque a conta.</b> Lucratividade, investimento em anúncios e tamanho do time precisam caber no faturamento previsto.</li></ol>
    </section>
    <section class="cartao"><h2>Meta anual</h2><div class="rolagem"><table class="tabmetas"><thead><tr><th></th>${th3}</tr></thead><tbody>
      ${linhas.map(([k, r, f]) => `<tr><td>${r}</td>${[0, 1, 2].map(i => `<td class="n">${f(`metas.anual.${k}.${i}`)}</td>`).join("")}</tr>`).join("")}
      ${[["lucro", "Lucro projetado"], ["ads", "Investimento em anúncios (R$)"], ["mensal", "Média mensal de faturamento"], ["cresc", "Crescimento sobre 2026"]].map(([k, r]) => `<tr class="calc"><td>${r}</td>${[0, 1, 2].map(i => `<td class="n" data-calc="${k}:${i}"></td>`).join("")}</tr>`).join("")}
      </tbody></table></div>
      ${area("metas.porque", "Por que essa meta?", "O que esse faturamento viabiliza na sua vida e no seu escritório.")}
    </section>
    <section class="cartao"><h2>Produtos estrela e cenário de vendas</h2><p>Informe o ticket de cada produto e quantas vendas no ano cada altura de meta exige. O sistema soma e compara com a meta anual.</p>
      <div class="rolagem"><table class="tabmetas"><thead><tr><th>Tipo</th><th>Produto</th><th class="n">Ticket</th>${LV.map(l => `<th class="n">Vendas · ${l}</th>`).join("")}</tr></thead><tbody>
      ${[["Entrada", "Consulta, sessão de viabilidade"], ["Principal", "Honorários, diagnóstico"], ["Alto valor", "Holding, planejamento sucessório"]].map(([t, ph], r) => `<tr><td><b>${t}</b></td><td>${texto(`metas.prod.${r}.nome`, ph)}</td><td class="n">${moeda(`metas.prod.${r}.ticket`)}</td>${[0, 1, 2].map(i => `<td class="n">${texto(`metas.prod.${r}.v${i}`, "Qtd", 'inputmode="numeric"')}<br><small data-calc="prod:${r}:${i}"></small></td>`).join("")}</tr>`).join("")}
      <tr class="calc"><td colspan="3">Faturamento do cenário</td>${[0, 1, 2].map(i => `<td class="n" data-calc="prodTot:${i}"></td>`).join("")}</tr>
      <tr class="calc"><td colspan="3">Comparado à meta anual</td>${[0, 1, 2].map(i => `<td class="n" data-calc="prodDif:${i}"></td>`).join("")}</tr>
      </tbody></table></div>
    </section>
    <section class="cartao"><h2>Meta de faturamento por trimestre</h2>
      <div class="rolagem"><table class="tabmetas"><thead><tr><th></th>${th3}</tr></thead><tbody>
      ${[1, 2, 3, 4].map(q => `<tr><td>${q}º trimestre</td>${[0, 1, 2].map(i => `<td class="n">${moeda(`metas.tri.${q}.${i}`)}</td>`).join("")}</tr>`).join("")}
      <tr class="calc"><td>Soma dos trimestres</td>${[0, 1, 2].map(i => `<td class="n" data-calc="triSoma:${i}"></td>`).join("")}</tr>
      <tr class="calc"><td>Comparado à meta anual</td>${[0, 1, 2].map(i => `<td class="n" data-calc="triDif:${i}"></td>`).join("")}</tr>
      </tbody></table></div>
      <div><button type="button" class="btn sec" data-act="dividir">Dividir a meta anual em quatro partes iguais</button></div>
    </section>`;
  }

  function vPlano() {
    if (!S.D.perfil) return cab("Etapa 3", "Estratégico × Tático × Operacional", "Escolha o seu perfil na aba Início para ver as sugestões.") + `<div><button type="button" class="btn" data-act="aba" data-arg="inicio">Escolher perfil</button></div>`;
    const todos = itens();
    return cab("Etapa 3", "Estratégico × Tático × Operacional", `Sugestões para o ${PERFIS[S.D.perfil - 1][0]}. Leia os itens de cada categoria, marque "Fazer" nos que cabem no seu ciclo, ajuste o texto ao seu caso e defina trimestre e prazo.`) + `
    <section class="cartao"><h2>Como ler cada categoria</h2>${tabNiveis()}
      <p>Cada categoria desce do objetivo (estratégico) ao caminho (tático) e à tarefa (operacional). O <b>OKR</b> diz como você vai saber que chegou; o <b>KPI</b> é o número que você acompanha o ano todo. A sugestão é escolher no máximo três categorias por trimestre.</p>
      <p class="contexto"><span data-calc="fracas"></span> <button type="button" class="link" data-act="aba" data-arg="retro">Rever notas de 2026</button></p>
      <p class="destaque" data-calc="conta"></p>
    </section>
    ${CATS.map((cat, ci) => `<details class="cat" ${todos.some(i => i.cat === ci && i.st.fazer) ? "open" : ""}><summary><h2>${cat}</h2><span class="qt">${S.D.retro.notas[ci] != null ? `nota ${esc(S.D.retro.notas[ci])} em 2026 · ` : ""}<span data-calc="catQt:${ci}"></span></span></summary><div>
      ${todos.filter(i => i.cat === ci).map(i => `<div class="item ${i.st.fazer ? "on" : ""}">
        ${chk(i.path + ".fazer", true).replace("<input", `<input aria-label="Fazer"`)}
        <span class="selo-n n${i.nivel}">${NIVEIS[i.nivel]}</span>
        <input type="text" id="f-${i.path}.texto" data-p="${i.path}.texto" value="${esc(i.texto)}" placeholder="Descreva o item" aria-label="Texto do item">
        ${sel(i.path + ".tri", TRIS, false, "Trimestre")}
        <input type="date" id="f-${i.path}.prazo" data-p="${i.path}.prazo" value="${esc(i.st.prazo || "")}" min="2027-01-01" max="2027-12-31" aria-label="Prazo final">
        ${i.custom ? `<button type="button" class="btn x" data-act="rmItem" data-arg="${i.i}" aria-label="Remover item">×</button>` : "<span></span>"}
      </div>`).join("")}
      <div style="padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select id="novo-nivel-${ci}" style="width:auto" aria-label="Nível do novo item">${NIVEIS.map((n, k) => `<option value="${k}">${n}</option>`).join("")}</select><button type="button" class="btn sec mini" data-act="addItem" data-arg="${ci}">Adicionar item meu</button></div>
    </div></details>`).join("")}`;
  }

  function vTri() {
    const q = S.tri, T = `tri.${q}`, f = feitos().filter(i => String(i.st.tri) === String(q)), nTar = S.D.tarefas.filter(t => String(t.tri) === String(q)).length;
    const pend = S.D.retro.pend.map((p, i) => [p, i]).filter(([p]) => p.destino === "levar" && String(p.tri) === String(q));
    const meta = [0, 1, 2].map(i => num(getP(S.D, `metas.tri.${q}.${i}`)));
    const prazo = d => d ? d.split("-").reverse().join("/") : "sem prazo";
    return cab("Etapa 4", "Trimestres", "O ciclo é de 12 meses, com revisão a cada trimestre. Em cada um: abra, execute, venda e feche.") + `
    <div class="subabas">${[1, 2, 3, 4].map(n => `<button type="button" data-act="tri" data-arg="${n}" ${n === q ? 'aria-current="true"' : ""}>${n}º trimestre <small>${pct(progTri(n).p)}</small></button>`).join("")}</div>
    <section class="cartao"><h2>${q}º trimestre · ${MESES[(q - 1) * 3]} a ${MESES[(q - 1) * 3 + 2]}</h2>
      <div class="kpis">${LV.map((l, i) => `<div><small>${l}</small><span class="numero">${meta[i] ? brl(meta[i]) : "—"}</span></div>`).join("")}<div><small>Progresso</small><span class="numero" data-calc="triProg:${q}"></span></div></div>
      <div class="barra" aria-hidden="true"><i data-bar="tri:${q}"></i></div>
      ${meta[0] ? "" : `<p class="contexto">Este trimestre ainda não tem meta de faturamento. <button type="button" class="link" data-act="aba" data-arg="metas">Definir em Metas 2027</button></p>`}
      ${area(T + ".foco", "Foco do trimestre", "Em uma frase: o que precisa estar diferente no fim destes três meses?")}
    </section>
    <section class="cartao"><h2>Conferência do trimestre</h2><div class="grade g2">${RITUAL.map(([t, its], b) => `<div><b>${t}</b>${its.map((x, k) => `<label class="check">${chk(`${T}.ritual.${b * 5 + k}`)}<span>${x}</span></label>`).join("")}</div>`).join("")}</div></section>
    <section class="cartao"><h2>O que fazer neste trimestre</h2>
      <p class="contexto">${f.length || pend.length || nTar ? `${f.length + pend.length + nTar} ${f.length + pend.length + nTar === 1 ? "item atribuído" : "itens atribuídos"} a este trimestre.` : `Nada atribuído ainda. Marque "Fazer" e escolha o ${q}º trimestre na etapa dos três níveis.`} <button type="button" class="link" data-act="aba" data-arg="plano">Escolher itens</button></p>
      <div>${f.map(i => `<div class="tarefa"><div><span class="selo-n n${i.nivel}">${NIVEIS[i.nivel]}</span> ${esc(i.texto)}<small>${CATS[i.cat]} · prazo: ${prazo(i.st.prazo)}</small></div>${sel(i.path + ".status", ["Em andamento", "Concluído"], false, "Não iniciada", "Status de: " + i.texto)}</div>`).join("")}
      ${pend.map(([p, i]) => `<label class="check">${chk(`retro.pend.${i}.feito`)}<span>${esc(p.texto || "Pendência sem descrição")} <small>(pendência de 2026)</small></span></label>`).join("")}
      ${S.D.tarefas.map((t, i) => [t, i]).filter(([t]) => String(t.tri) === String(q)).map(([t, i]) => `<div class="tarefa-livre"><label class="check">${chk(`tarefas.${i}.feito`)}<span>${esc(t.texto)}${t.origem ? ` <small>(${esc(t.origem)})</small>` : ""}</span></label><button type="button" class="btn x" data-act="rmTarefa" data-arg="${i}" aria-label="Remover tarefa">×</button></div>`).join("")}</div>
      <div class="li-novo"><input type="text" id="nova-tarefa-${q}" data-add-tarefa="${q}" placeholder="Nova tarefa deste trimestre: escreva e tecle Enter" aria-label="Nova tarefa do ${q}º trimestre"><button type="button" class="btn sec mini" data-act="addTarefa" data-arg="${q}">Adicionar tarefa</button></div>
    </section>
    <section class="cartao"><h2>Ações de vendas por mês</h2><p>Para cada mês, liste as ações que vão gerar o faturamento: o produto, como você vai vender, o ticket e quantas vendas espera.</p>
      ${[0, 1, 2].map(k => { const m = (q - 1) * 3 + k, vs = S.D.vendas[m] || []; return `<div><b>${MESES[m]}</b> · previsto: ${c("vMes:" + m)}
        <div class="rolagem"><table><thead><tr><th>Produto</th><th>Ação de vendas</th><th class="n">Ticket</th><th class="n">Vendas</th><th class="n">Faturamento</th><th>Responsável</th><th></th></tr></thead><tbody>
        ${vs.map((_, i) => `<tr><td>${texto(`vendas.${m}.${i}.produto`, "Sessão de viabilidade")}</td><td>${texto(`vendas.${m}.${i}.acao`, "Live, indicação, conteúdo…")}</td><td class="n">${moeda(`vendas.${m}.${i}.ticket`)}</td><td class="n">${texto(`vendas.${m}.${i}.qtd`, "Qtd", 'inputmode="numeric" style="min-width:60px"')}</td><td class="n" data-calc="vLinha:${m}:${i}"></td><td>${texto(`vendas.${m}.${i}.resp`, "Eu")}</td><td><button type="button" class="btn x" data-act="rmVenda" data-arg="${m}:${i}" aria-label="Remover ação">×</button></td></tr>`).join("") || '<tr><td colspan="7" class="ajuda">Nenhuma ação planejada.</td></tr>'}
        </tbody></table></div><button type="button" class="btn sec mini" data-act="addVenda" data-arg="${m}" style="margin-top:8px">Adicionar ação em ${MESES[m]}</button></div>`; }).join("")}
      <p class="destaque">Previsto no trimestre: <b data-calc="vTri:${q}"></b> · ${c("vTriDif:" + q)}</p>
    </section>
    <section class="cartao"><h2>Fechamento</h2><div class="grade g2">
      ${campo("Faturamento realizado no trimestre", moeda(T + ".realizado"))}
      <div class="kpis"><div><small>Realizado sobre a meta</small><span class="numero" data-calc="triReal:${q}"></span></div></div>
      ${area(T + ".aprendizado", "O que aprendi neste trimestre", "O que funcionou, o que mudar no próximo.")}
      ${lista(T + ".ajustes", "Ajustes para o próximo trimestre", "Metas, itens ou prazos que mudam.", Math.min(q + 1, 4))}
    </div></section>`;
  }

  function vMentora() {
    if (!S.lista) { api.listar().then(l => { S.lista = l; if (S.aba === "mentora") render(); }).catch(e => { S.lista = []; S.erro = e.message; render(); }); return '<p class="carregando">Carregando alunas…</p>'; }
    const outras = S.lista.filter(r => r.user_id !== S.user.id);
    return cab("Mentora", "Painel da mentora", "Acompanhe o preenchimento de cada aluna. A visualização é somente leitura.") + `
    <section class="cartao"><div class="rolagem"><table><thead><tr><th>Aluna</th><th>Perfil</th><th class="n">2026</th><th class="n">Metas</th><th class="n">Níveis</th><th class="n">Trimestres</th><th>Atualizado</th><th></th></tr></thead><tbody>
    ${outras.map(r => { const d = normalizar(structuredClone(r.dados || {})), p = progresso(d); return `<tr><td><b>${esc(r.nome)}</b><br><small>${esc(r.email)}</small></td><td>${d.perfil ? "Perfil " + esc(d.perfil) : "—"}</td>${["retro", "metas", "plano", "tri"].map(k => `<td class="n">${pct(p[k])}</td>`).join("")}<td>${r.atualizado_em ? new Date(r.atualizado_em).toLocaleDateString("pt-BR") : "—"}</td><td style="white-space:nowrap"><button type="button" class="btn mini" data-act="ver" data-arg="${esc(r.user_id)}">Abrir</button> <button type="button" class="btn sec mini" data-act="senha" data-arg="${esc(r.user_id)}">Nova senha</button></td></tr>`; }).join("") || '<tr><td colspan="8" class="ajuda">Nenhuma aluna cadastrada ainda.</td></tr>'}
    </tbody></table></div><div><button type="button" class="btn sec" data-act="atualizar">Atualizar lista</button></div></section>`;
  }

  /* ---------- Render ---------- */
  const selo = (cls = "") => `<span class="selo ${cls}" aria-hidden="true"><img src="${cls === "grande" ? "cep-selo-grande.webp" : "cep-selo.webp"}" alt="" onerror="this.parentNode.classList.add('sem-img');this.remove()"><span>CEP</span></span>`;
  const timbre = () => `<div class="timbre">${selo()}<div><div class="nome">CEP</div><div class="sub">Clube da Estratégia Patrimonial</div></div></div>`;
  const VIEWS = { inicio: vInicio, retro: vRetro, metas: vMetas, plano: vPlano, tri: vTri, mentora: vMentora };

  const ORDEM = ["inicio", "retro", "metas", "plano", "tri"];
  const HASH = { inicio: "inicio", retro: "olhar-2026", metas: "metas", plano: "niveis", tri: "trimestres", mentora: "mentora" };
  const DEHASH = Object.fromEntries(Object.entries(HASH).map(([k, h]) => [h, k]));
  const nomeAba = k => (k === "plano" ? "Os três níveis" : k === "mentora" ? "Painel da mentora" : ABAS.find(a => a[0] === k)[1]);
  let focar = null;

  function render() {
    if (!S.user) return renderLogin();
    const abas = S.mentora && !S.vendo ? [...ABAS, ["mentora", "Painel da mentora"]] : ABAS;
    const p = progresso(), y = window.scrollY, ativo = document.activeElement && document.activeElement.id;
    const passo = ORDEM.indexOf(S.aba);
    const rodape = passo < 0 ? "" : `<nav class="passos-nav" aria-label="Etapa anterior e próxima">${passo > 0 ? `<button type="button" class="btn sec" data-act="aba" data-arg="${ORDEM[passo - 1]}">← ${nomeAba(ORDEM[passo - 1])}</button>` : "<span></span>"}${passo < 4 ? `<button type="button" class="btn" data-act="aba" data-arg="${ORDEM[passo + 1]}">${nomeAba(ORDEM[passo + 1])} →</button>` : `<button type="button" class="btn" data-act="aba" data-arg="inicio">Ver resumo do plano</button>`}</nav>`;
    const grande = document.documentElement.classList.contains("grande");
    const corpo = VIEWS[S.aba](), corte = corpo.startsWith('<header class="cabeca') ? corpo.indexOf("</header>") + 9 : 0;
    app.innerHTML = `<a class="pular" href="#conteudo">Pular para o conteúdo</a>
    ${DEMO ? '<div class="banner"><div class="wrap"><span>Modo demonstração: os dados ficam apenas neste navegador.</span></div></div>' : ""}
    ${S.vendo ? `<div class="banner"><div class="wrap"><span>Você está vendo o planejamento de <b>${esc(S.vendo)}</b> (somente leitura).</span><button type="button" class="btn mini" data-act="voltar">Voltar ao painel</button></div></div>` : ""}
    <header class="topo escuro"><div class="wrap"><div class="linha">${timbre()}
      <div class="conta"><span id="salvo" class="salvo" role="status" aria-live="polite">${esc(S.salvo)}</span><span>${esc(S.nome)}</span><button type="button" class="btn sec mini" data-act="fonte" aria-pressed="${grande}">Texto maior</button><button type="button" class="btn sec mini" data-act="minhaSenha">Trocar senha</button><button type="button" class="btn sec mini" data-act="sair">Sair</button></div></div></div></header>
    <nav class="abas" aria-label="Etapas do planejamento"><div class="wrap"><ol>${abas.map(([k, t], i) => { const feito = k in p && p[k] >= 99.5, parc = k in p && p[k] > 0; return `<li><button type="button" data-act="aba" data-arg="${k}" ${S.aba === k ? 'aria-current="page"' : ""}><span class="marca ${feito ? "feito" : parc ? "parcial" : ""}" aria-hidden="true">${feito ? "✓" : k in p ? i : k === "inicio" ? "⌂" : "★"}</span><span>${t}</span>${k in p ? `<span class="sr">, ${pct(p[k])} preenchido</span>` : ""}</button></li>`; }).join("")}</ol></div></nav>
    <main id="conteudo" tabindex="-1">${corpo.slice(0, corte)}<div class="wrap corpo">${S.erro ? `<p class="erro-form" role="alert">${esc(S.erro)}</p>` : ""}${corpo.slice(corte)}${rodape}</div></main>
    ${rodapeSite()}`;
    S.erro = "";
    if (S.ro) {
      app.querySelectorAll("main input, main select, main textarea").forEach(el => { el.disabled = true; });
      app.querySelectorAll("main [data-act]").forEach(b => { if (!LIVRES.has(b.dataset.act)) b.hidden = true; });
    }
    // Rótulo acessível para campos dentro de tabelas: cabeçalho da coluna + nome da linha.
    app.querySelectorAll("table").forEach(t => {
      const hs = [...t.querySelectorAll("thead th")].map(h => h.textContent.trim());
      t.querySelectorAll("tbody tr").forEach(tr => {
        const linha = tr.cells[0] ? tr.cells[0].textContent.trim() : "";
        [...tr.cells].forEach((td, i) => td.querySelectorAll("input,select").forEach(el => { if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", [hs[i], linha].filter(Boolean).join(" · ") || "Campo"); }));
      });
    });
    recalc();
    if (focar === "titulo") { window.scrollTo(0, 0); const h = $("main h1"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
    else { window.scrollTo(0, y); const el = ativo && document.getElementById(ativo); if (el) el.focus({ preventScroll: true }); }
    focar = null;
    document.title = (S.aba === "inicio" ? "" : nomeAba(S.aba) + " · ") + "Planejamento Estratégico 2027 | CEP";
  }

  /* ---------- Avisos e diálogo (fora de #app, para não serem recriados a cada render) ---------- */
  const avisos = Object.assign(document.createElement("div"), { className: "avisos" });
  avisos.setAttribute("role", "status"); avisos.setAttribute("aria-live", "polite");
  const dlg = Object.assign(document.createElement("dialog"), { className: "dlg" });
  dlg.setAttribute("aria-labelledby", "dlg-t");
  document.body.append(avisos, dlg);
  let tAviso = null;
  function avisar(msg, desfazer) {
    avisos.innerHTML = `<div class="aviso-t"><span>${esc(msg)}</span>${desfazer ? '<button type="button" class="btn mini" id="desfazer">Desfazer</button>' : ""}</div>`;
    if (desfazer) $("#desfazer", avisos).onclick = () => { avisos.innerHTML = ""; desfazer(); };
    clearTimeout(tAviso); tAviso = setTimeout(() => { avisos.innerHTML = ""; }, desfazer ? 10000 : 6000);
  }
  function pedirSenha(titulo, desc, visivel) {
    return new Promise(res => {
      dlg.innerHTML = `<form id="dlg-form" novalidate><h2 id="dlg-t">${esc(titulo)}</h2><p>${esc(desc)}</p>
        <label class="campo"><span>Nova senha (mínimo 8 caracteres)</span><input type="${visivel ? "text" : "password"}" id="dlg-senha" autocomplete="new-password"></label>
        <p class="erro-form" id="dlg-erro" role="alert"></p>
        <div class="dlg-acoes"><button type="button" class="btn sec" id="dlg-cancelar">Cancelar</button><button class="btn">Salvar senha</button></div></form>`;
      const fim = v => { dlg.close(); res(v); };
      $("#dlg-cancelar", dlg).onclick = () => fim(null);
      dlg.oncancel = () => res(null);
      $("#dlg-form", dlg).onsubmit = e => { e.preventDefault(); const v = $("#dlg-senha", dlg).value; if (v.length < 8) { $("#dlg-erro", dlg).textContent = "A senha precisa de pelo menos 8 caracteres."; $("#dlg-senha", dlg).focus(); return; } fim(v); };
      dlg.showModal();
    });
  }
  function remover(fn, msg) {
    const antes = JSON.stringify(S.meu);
    fn(); mudou();
    avisar(msg, () => { S.meu = normalizar(JSON.parse(antes)); S.D = S.meu; mudou(); });
  }
  window.addEventListener("hashchange", () => {
    const k = DEHASH[location.hash.slice(1)];
    if (!k || !S.user || k === S.aba || (k === "mentora" && (!S.mentora || S.vendo))) return;
    S.aba = k; focar = "titulo"; render();
  });

  const rodapeSite = () => `<footer class="rodape escuro"><div class="wrap"><span>CEP · Clube da Estratégia Patrimonial</span><span>Planejamento Estratégico 2027</span></div></footer>`;

  function renderLogin() {
    const cad = S.modo !== "entrar", men = S.modo === "mentora";
    app.innerHTML = `<div class="login escuro"><main class="wrap meio">
      <div class="intro">${selo("grande")}<p class="olho">Turma 2027 · Área da aluna</p><p class="marca-t">Planejamento Estratégico <span class="ouro">2027</span></p>
        <p class="desc">Olhe para 2026, defina as metas e desdobre o ano do estratégico ao operacional, trimestre a trimestre.</p>
        <p class="citacao">"Antes do litígio, existe decisão."</p></div>
      <form id="form-login" novalidate aria-labelledby="l-titulo">
      <p class="olho">CEP · Clube da Estratégia Patrimonial</p><h1 id="l-titulo">${cad ? "Criar minha conta" : "Entrar"}</h1>
      ${DEMO ? '<p class="ajuda">Modo demonstração: as contas ficam apenas neste navegador.</p>' : ""}
      ${cad ? campo("Nome completo", '<input type="text" id="l-nome" autocomplete="name" required>') : ""}
      ${campo("E-mail", '<input type="email" id="l-email" autocomplete="email" required>')}
      ${campo(cad ? "Crie uma senha (mínimo 8 caracteres)" : "Senha", `<input type="password" id="l-senha" autocomplete="${cad ? "new-password" : "current-password"}" required>`)}
      ${men ? campo("Código da mentora", '<input type="password" id="l-codigo" autocomplete="off" required>') : ""}
      ${S.erro ? `<p class="erro-form" role="alert">${esc(S.erro)}</p>` : ""}
      <button class="btn" id="l-enviar">${cad ? "Criar conta" : "Entrar"}</button>
      <button type="button" class="troca" data-act="modo" data-arg="${cad ? "entrar" : "cadastro"}">${cad ? "Já tenho conta. Entrar" : "Primeiro acesso? Criar minha conta"}</button>
      ${cad && !men && DEMO ? '<button type="button" class="troca" data-act="modo" data-arg="mentora">Sou mentora</button>' : ""}
      ${cad ? "" : '<p class="ajuda">Esqueceu a senha? Peça uma senha provisória à mentora do CEP.</p>'}
    </form></main>${rodapeSite()}</div>`;
    S.erro = "";
    if (S.form) { if ($("#l-nome")) $("#l-nome").value = S.form.nome; $("#l-email").value = S.form.email; }
  }

  async function abrirSessao(u) {
    const r = await api.carregar(u);
    Object.assign(S, { user: u, nome: r.nome, mentora: r.mentora, meu: normalizar(r.dados), ro: false, vendo: null, lista: null, aba: "inicio", salvo: "" });
    const k = DEHASH[location.hash.slice(1)];
    if (k && (k !== "mentora" || r.mentora)) S.aba = k;
    S.D = S.meu; render();
  }

  /* ---------- Eventos ---------- */
  app.addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#l-email").value.trim().toLowerCase(), senha = $("#l-senha").value, cad = S.modo !== "entrar";
    const nome = cad ? $("#l-nome").value.trim() : "", codigo = S.modo === "mentora" ? $("#l-codigo").value.trim() : "";
    S.form = { nome, email };
    const falha = !/^\S+@\S+\.\S+$/.test(email) ? "Informe um e-mail válido." : cad && nome.length < 3 ? "Informe o seu nome completo." : cad && senha.length < 8 ? "A senha precisa de pelo menos 8 caracteres." : !senha ? "Informe a senha." : S.modo === "mentora" && !codigo ? "Informe o código da mentora." : "";
    if (falha) { S.erro = falha; return renderLogin(); }
    $("#l-enviar").disabled = true; $("#l-enviar").textContent = "Aguarde…";
    try { await abrirSessao(cad ? await api.cadastrar(nome, email, senha, codigo) : await api.entrar(email, senha)); }
    catch (err) { S.erro = err.message; renderLogin(); }
  });

  app.addEventListener("input", e => {
    const el = e.target, p = el.dataset.p;
    if (!p || S.ro) return;
    setP(S.D, p, el.type === "checkbox" ? el.checked : el.value);
    agendar();
    if (el.dataset.rr !== undefined) render(); else recalc();
  });
  app.addEventListener("keydown", e => {
    if (e.key !== "Enter" || S.ro) return;
    const el = e.target;
    if (el.dataset.add) { e.preventDefault(); ACT.addLista(el.dataset.add); }
    else if (el.dataset.addTarefa) { e.preventDefault(); ACT.addTarefa(el.dataset.addTarefa); }
  });
  app.addEventListener("focusout", e => {
    const el = e.target;
    if (el.dataset.moeda === undefined || S.ro || !el.value.trim()) return;
    const n = num(el.value); el.value = n ? brl(n) : "";
    setP(S.D, el.dataset.p, el.value); agendar();
  });

  const ACT = {
    aba: a => { S.aba = a; focar = "titulo"; if (location.hash.slice(1) !== HASH[a]) history.pushState(null, "", "#" + HASH[a]); render(); },
    fonte: () => { const g = document.documentElement.classList.toggle("grande"); try { localStorage.setItem("cep-fonte", g ? "1" : ""); } catch { /* sem armazenamento */ } render(); },
    tri: q => { S.tri = +q; render(); },
    modo: m => { S.modo = m; renderLogin(); },
    sair: async () => { await salvarAgora(); await api.sair(); S.user = null; S.modo = "entrar"; render(); },
    addPend: () => { S.D.retro.pend.push({ id: uid(), texto: "", destino: "" }); mudou(); },
    addLista: p => {
      const el = document.getElementById("nova-" + p.replace(/\./g, "-")), t = el ? el.value.trim() : "";
      if (!t) { if (el) el.focus(); return; }
      const arr = getP(S.D, p) || []; arr.push({ id: uid(), texto: t }); setP(S.D, p, arr);
      focoDepois = el.id; mudou();
    },
    rmLista: a => { const [p, i] = a.split("|"); remover(() => getP(S.D, p).splice(+i, 1), "Item removido."); },
    virarTarefa: a => {
      const [p, i] = a.split("|"), it = getP(S.D, p)[+i];
      if (!it.texto.trim()) return avisar("Escreva o item antes de criar a tarefa.");
      const padrao = +(app.querySelector(`[data-tri-padrao="${p}"]`)?.textContent || 1);
      const tri = +(it.tri || padrao), chave = p.split(".").pop();
      const t = { id: uid(), texto: it.texto.trim(), tri, feito: false, origem: ROTULO_LISTA[chave] || "" };
      S.D.tarefas.push(t); it.tarefa = t.id; mudou();
      avisar(`Tarefa criada no ${tri}º trimestre.`, () => { S.D.tarefas = S.D.tarefas.filter(x => x.id !== t.id); delete it.tarefa; mudou(); });
    },
    irTri: q => { S.tri = +q; ACT.aba("tri"); },
    addTarefa: q => {
      const el = document.getElementById("nova-tarefa-" + q), t = el ? el.value.trim() : "";
      if (!t) { if (el) el.focus(); return; }
      S.D.tarefas.push({ id: uid(), texto: t, tri: +q, feito: false, origem: "" }); focoDepois = el.id; mudou();
    },
    rmTarefa: i => remover(() => S.D.tarefas.splice(+i, 1), "Tarefa removida."),
    rmPend: i => remover(() => S.D.retro.pend.splice(+i, 1), "Pendência removida."),
    addItem: ci => { S.D.custom.push({ id: uid(), cat: +ci, nivel: +$("#novo-nivel-" + ci).value, texto: "", fazer: true }); mudou(); },
    rmItem: i => remover(() => S.D.custom.splice(+i, 1), "Item removido."),
    addVenda: m => { (S.D.vendas[m] ??= []).push({ produto: "", acao: "", ticket: "", qtd: "", resp: "" }); mudou(); },
    rmVenda: a => { const [m, i] = a.split(":"); remover(() => S.D.vendas[m].splice(+i, 1), "Ação de vendas removida."); },
    dividir: () => { [0, 1, 2].forEach(i => { const t = A("fat", i); if (t) [1, 2, 3, 4].forEach(q => setP(S.D, `metas.tri.${q}.${i}`, brl(t / 4))); }); mudou(); },
    ver: id => { const r = S.lista.find(x => x.user_id === id); S.D = normalizar(structuredClone(r.dados || {})); S.ro = true; S.vendo = r.nome; S.aba = "inicio"; focar = "titulo"; render(); },
    voltar: () => { S.D = S.meu; S.ro = false; S.vendo = null; S.aba = "mentora"; focar = "titulo"; render(); },
    atualizar: () => { S.lista = null; render(); },
    senha: async id => {
      const r = S.lista.find(x => x.user_id === id);
      const nova = await pedirSenha("Senha provisória", `Defina uma senha provisória para ${r.nome}. Envie a ela e peça que troque no primeiro acesso.`, true);
      if (nova == null) return;
      try { await api.redefinir(id, nova); avisar(`Senha de ${r.nome} redefinida.`); } catch (e) { avisar(e.message); }
    },
    minhaSenha: async () => {
      const nova = await pedirSenha("Trocar senha", "Escolha a nova senha da sua conta.");
      if (nova == null) return;
      try { await api.trocarSenha(nova); avisar("Senha alterada."); } catch (e) { avisar(e.message); }
    }
  };
  const LIVRES = new Set(["aba", "tri", "modo", "sair", "fonte", "ver", "voltar", "atualizar", "senha", "minhaSenha", "irTri"]);
  let focoDepois = null;
  function mudou() { agendar(); render(); if (focoDepois) { const el = document.getElementById(focoDepois); focoDepois = null; if (el) el.focus(); } }
  app.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    if (S.ro && !LIVRES.has(b.dataset.act)) return;
    ACT[b.dataset.act](b.dataset.arg);
  });

  /* ---------- Início ---------- */
  try { if (localStorage.getItem("cep-fonte")) document.documentElement.classList.add("grande"); } catch { /* sem armazenamento */ }
  api.sessao().then(u => (u ? abrirSessao(u) : render())).catch(() => render());
})();
