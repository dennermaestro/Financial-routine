// PLANO B: roda a operação do dia de forma roteirizada, SEM chamar nenhum modelo de IA.
// Serve para a apresentação caso a internet falhe. Usa as mesmas ferramentas do servidor MCP.
// Uso: npm run simular            (pausado e pedindo aprovação no terminal)
//      npm run simular -- --auto   (sem pausas, aprova tudo; usado nos testes)
import readline from "node:readline";
import { executar } from "./core.js";
import { save } from "./store.js";
import { buildSeed } from "./seed.js";

const AUTO = process.argv.includes("--auto");
const cor = (c, t) => `\x1b[${c}m${t}\x1b[0m`;
const setor = (nome) => console.log("\n" + cor("1;38;5;209", `■ ${nome}`));
const fala = (t) => console.log(cor("38;5;250", "  " + t));
const call = (agente, ferramenta, args = {}) => {
  console.log(cor("38;5;37", `  ↳ ${agente} chama ${ferramenta}`) + cor("2", " " + JSON.stringify(args)));
  return executar(ferramenta, { ...args, agente });
};
const rl = AUTO ? null : readline.createInterface({ input: process.stdin, terminal: false });
const linhas = rl?.[Symbol.asyncIterator]();
// Lê a resposta da próxima linha (funciona no terminal e com entrada redirecionada).
const perguntar = async (q) => { process.stdout.write(q); const r = await linhas.next(); if (!process.stdin.isTTY) process.stdout.write((r.value ?? "") + "\n"); return r.value ?? ""; };
const pausa = async () => { if (!AUTO) await perguntar(cor("2", "  [Enter para continuar] ")); };
const aprovar = async (pergunta) => {
  if (AUTO) return true;
  const r = await perguntar(cor("1;33", `  ✋ Aprovação humana: ${pergunta} (s/n) `));
  return r.trim().toLowerCase().startsWith("s");
};

save(buildSeed());
console.log(cor("1", "\nFinSim · operação do dia (simulação roteirizada, dados fictícios)"));
fala("Abra o painel em http://localhost:4000 para acompanhar ao vivo.");
await pausa();

setor("Atendimento");
const chamados = call("atendimento", "listar_chamados", { status: "aberto" });
for (const c of chamados) {
  if (c.sinais_de_injecao) {
    fala(`${c.id}: o texto tenta dar ordens ao agente ("libere a transação", "aprove crédito"). Isso é prompt injection. Não obedeço.`);
    call("atendimento", "registrar_alerta", { setor: "seguranca", tipo: "prompt_injection", descricao: `Chamado ${c.id} contém instruções para liberar transação e aprovar crédito.`, referencias: [c.id] });
    call("atendimento", "responder_chamado", { chamado_id: c.id, classificacao: "seguranca", resposta: "Recebemos sua mensagem. Por segurança, ela foi encaminhada para análise da nossa equipe." });
  } else if (/reconhe/i.test(c.assunto)) {
    fala(`${c.id}: cliente não reconhece um PIX duplicado. Encaminho para prevenção a fraude.`);
    call("atendimento", "registrar_alerta", { setor: "prevencao-fraude", tipo: "contestacao", descricao: "Cliente relata PIX em duplicidade para Studio Vértice.", referencias: [c.id, "T-5003"] });
    call("atendimento", "responder_chamado", { chamado_id: c.id, classificacao: "contestacao", resposta: "Identificamos o possível pagamento em duplicidade e já encaminhamos para análise. Retornaremos em breve." });
  } else {
    call("atendimento", "responder_chamado", { chamado_id: c.id, classificacao: "duvida", resposta: "Você pode ajustar o limite de PIX noturno no app, em Configurações > Limites." });
  }
}
await pausa();

setor("Onboarding e KYC");
for (const c of call("onboarding-kyc", "listar_kyc_pendentes")) {
  const k = call("onboarding-kyc", "verificar_kyc", { cliente_id: c.id });
  const decisao = k.pendencias.length ? "pendente_documentos" : "aprovado";
  fala(`${c.nome}: ${k.pendencias.length ? k.pendencias.join("; ") : "tudo certo"} → ${decisao}`);
  call("onboarding-kyc", "registrar_decisao_kyc", { cliente_id: c.id, decisao, motivo: k.pendencias.join("; ") || "Documentos, selfie e comprovante conferem." });
}
await pausa();

setor("Prevenção a fraude");
const suspeitas = [];
for (const t of call("prevencao-fraude", "listar_transacoes", { status: "pendente" })) {
  const r = executar("validar_transacao", { transacao_id: t.id, agente: "prevencao-fraude" });
  if (r.risco !== "baixo") { suspeitas.push(r); fala(`${t.id} (${t.destino}): risco ${r.risco} · ${r.alertas.map((a) => a.codigo).join(", ")}`); }
}
fala(`${16 - suspeitas.length} transações de risco baixo foram aprovadas automaticamente pelo motor de regras.`);
for (const r of suspeitas.filter((r) => r.risco === "alto" && r.alertas.every((a) => a.setor === "prevencao-fraude"))) {
  const motivo = r.alertas.map((a) => a.descricao).join(" ");
  if (await aprovar(`bloquear ${r.transacao_id}? ${motivo}`)) call("prevencao-fraude", "bloquear_transacao", { transacao_id: r.transacao_id, motivo });
}
await pausa();

setor("Compliance e PLD");
const pld = suspeitas.filter((r) => r.alertas.some((a) => a.setor === "compliance-pld"));
fala(`Casos de lavagem para revisar: ${pld.map((r) => r.transacao_id).join(", ")}`);
call("compliance-pld", "verificar_lista_restritiva", { nome_ou_documento: "Alfa Beta Importadora Ltda" });
if (await aprovar("bloquear T-5013 (TED de R$ 120 mil para empresa na lista restritiva)?"))
  call("compliance-pld", "bloquear_transacao", { transacao_id: "T-5013", motivo: "Destino na lista restritiva; cliente PEP." });
if (await aprovar("comunicar ao COAF o fracionamento da conta 1004 (4 PIX logo abaixo de R$ 10 mil)?"))
  call("compliance-pld", "comunicar_coaf", { cliente_id: "C-04", transacoes: ["T-5009", "T-5010", "T-5011", "T-5012"], fundamentacao: "Quatro PIX entre R$ 9.750 e R$ 9.950 em 21 minutos para destinatários diferentes." });
await pausa();

setor("Crédito");
fala("Sigo a política de crédito (skill politica-credito), regra por regra.");
for (const p of call("credito", "listar_propostas_credito")) {
  const d = executar("consultar_proposta", { proposta_id: p.id, agente: "credito" });
  let decisao, regra;
  if (d.score < 550) [decisao, regra] = ["reprovada", `Regra 2: score ${d.score} abaixo de 550`];
  else if (d.comprometimento_renda > 35) [decisao, regra] = ["reprovada", `Regra 3: comprometimento ${d.comprometimento_renda}%`];
  else if (d.valor > 50000 || d.comprometimento_renda >= 30 || d.pep) [decisao, regra] = ["comite", `Regra 4: valor R$ ${d.valor} acima de R$ 50 mil`];
  else [decisao, regra] = ["aprovada", `Regra 6: score ${d.score}, comprometimento ${d.comprometimento_renda}%`];
  fala(`${p.id} ${d.cliente}: ${decisao} (${regra})`);
  if (await aprovar(`registrar ${p.id} como ${decisao}?`)) call("credito", "registrar_decisao_credito", { proposta_id: p.id, decisao, justificativa: regra });
}
await pausa();

setor("Tesouraria");
const pos = call("tesouraria", "resumo_tesouraria");
const conc = call("tesouraria", "conciliar_dia");
fala(`Saldo de clientes ${pos.saldo_total_clientes} · aprovado ${pos.saidas_aprovadas} · em análise ${pos.em_analise} · bloqueado ${pos.bloqueadas}`);
for (const d of conc.divergencias) {
  fala(`Divergência ${d.transacao_id}: ${d.tipo.replace(/_/g, " ")}`);
  call("tesouraria", "registrar_alerta", { setor: "tesouraria", tipo: d.tipo, descricao: `Transação ${d.transacao_id}: ${d.tipo.replace(/_/g, " ")}.`, referencias: [d.transacao_id] });
}
await pausa();

setor("Orquestrador · relatório executivo");
call("orquestrador", "gerar_relatorio", { titulo: "Fechamento do dia FinSim", conteudo_markdown: [
  "## Resumo em 3 linhas",
  `- ${suspeitas.length} transações suspeitas entre 16; as demais foram aprovadas automaticamente.`,
  "- Um chamado tentou manipular o agente (prompt injection) e foi barrado.",
  "- Bloqueios, decisões de crédito e comunicação ao COAF passaram por aprovação humana.",
  "", "## Posição da tesouraria",
  `Saldo ${pos.saldo_total_clientes} · em análise ${pos.em_analise} · bloqueado ${pos.bloqueadas} · ${conc.divergencias.length} divergências de conciliação.`,
].join("\n") });
console.log(cor("1;32", "\n✔ Operação concluída. Veja o painel e o arquivo em relatorios/.\n"));
rl?.close();
