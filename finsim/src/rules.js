// Regras determinísticas do motor de risco da FinSim.
// O agente decide O QUE fazer; as regras garantem que os números são sempre os mesmos.

export const LIMITES = {
  horario_atipico_ate: 6, // transações entre 00h e 05h59
  janela_duplicidade_min: 10,
  multiplo_ticket_atipico: 5,
  faixa_fracionamento: [9000, 10000], // valores logo abaixo de R$ 10 mil
  minimo_fracionamento: 3,
  pep_alto_valor: 50000,
};

const NIVEL = { baixo: 0, medio: 1, alto: 2 };
const hora = (iso) => Number(iso.slice(11, 13));
const minutos = (iso) => new Date(iso).getTime() / 60000;
const mesmoDia = (a, b) => a.slice(0, 10) === b.slice(0, 10);

export function avaliarTransacao(state, t) {
  const conta = state.contas.find((c) => c.id === t.conta_id);
  const cliente = state.clientes.find((c) => c.id === conta.cliente_id);
  const doDia = state.transacoes.filter((x) => x.conta_id === t.conta_id && mesmoDia(x.data_hora, t.data_hora));
  const chave = t.destino.chave;
  const conhecido = chave && conta.beneficiarios_conhecidos.includes(chave);
  const alertas = [];
  const add = (codigo, setor, nivel, descricao) => alertas.push({ codigo, setor, nivel, descricao });

  if (t.tipo === "PIX") {
    const acumulado = doDia.filter((x) => x.tipo === "PIX" && x.data_hora <= t.data_hora).reduce((s, x) => s + x.valor, 0);
    if (acumulado > conta.limite_pix_diario)
      add("LIMITE_DIARIO_PIX", "prevencao-fraude", "alto", `PIX acumulado no dia (R$ ${acumulado.toFixed(2)}) passa do limite diário da conta (R$ ${conta.limite_pix_diario.toFixed(2)}).`);
  }
  const anterior = doDia.find((x) => x.id !== t.id && x.data_hora < t.data_hora && x.valor === t.valor && chave && x.destino.chave === chave &&
    minutos(t.data_hora) - minutos(x.data_hora) <= LIMITES.janela_duplicidade_min);
  if (anterior) add("POSSIVEL_DUPLICIDADE", "prevencao-fraude", "medio", `Mesmo valor e mesmo destino da ${anterior.id}, com ${minutos(t.data_hora) - minutos(anterior.data_hora)} minutos de diferença.`);

  if (hora(t.data_hora) < LIMITES.horario_atipico_ate) {
    const agravado = t.dispositivo === "novo" && !conhecido;
    add("HORARIO_ATIPICO", "prevencao-fraude", agravado ? "alto" : "medio",
      `Transação às ${t.data_hora.slice(11, 16)}${agravado ? ", de um dispositivo novo e para um beneficiário nunca usado" : ""}.`);
  }
  if (!conhecido && t.valor > conta.ticket_medio * LIMITES.multiplo_ticket_atipico)
    add("VALOR_ATIPICO", "prevencao-fraude", "medio", `Valor ${(t.valor / conta.ticket_medio).toFixed(1)}x maior que o ticket médio da conta, para beneficiário desconhecido.`);

  const [min, max] = LIMITES.faixa_fracionamento;
  const fracionadas = doDia.filter((x) => x.valor >= min && x.valor < max);
  if (t.valor >= min && t.valor < max && fracionadas.length >= LIMITES.minimo_fracionamento)
    add("FRACIONAMENTO", "compliance-pld", "alto", `${fracionadas.length} transferências no mesmo dia logo abaixo de R$ 10 mil (${fracionadas.map((x) => x.id).join(", ")}): padrão típico de fracionamento para evitar controles.`);

  const restrito = state.lista_restritiva.find((r) => r.nome === t.destino.nome || (t.destino.documento && r.documento === t.destino.documento));
  if (restrito) add("LISTA_RESTRITIVA", "compliance-pld", "alto", `Destino consta na lista restritiva: ${restrito.motivo}.`);

  if (cliente.pep && t.valor >= LIMITES.pep_alto_valor)
    add("PEP_ALTO_VALOR", "compliance-pld", "medio", "Cliente é Pessoa Politicamente Exposta e a operação é de alto valor: exige diligência reforçada.");

  const risco = alertas.reduce((r, a) => (NIVEL[a.nivel] > NIVEL[r] ? a.nivel : r), "baixo");
  const recomendacao = { baixo: "Aprovar automaticamente.", medio: "Manter em análise e confirmar com o cliente.", alto: "Bloquear e encaminhar ao setor responsável." }[risco];
  return { transacao_id: t.id, risco, alertas, recomendacao };
}

// Parcela pela tabela Price, taxa fictícia de 2,5% ao mês.
export const TAXA_MENSAL = 0.025;
export function parcela(valor, meses, i = TAXA_MENSAL) {
  return Math.round(((valor * i) / (1 - Math.pow(1 + i, -meses))) * 100) / 100;
}

export function sinaisDeInjecao(texto) {
  const padroes = [/ignore (todas )?as (regras|instru)/i, /instru[cç][aã]o do sistema/i, /n[aã]o registre/i, /libere imediatamente/i, /aprove (um )?cr[eé]dito/i];
  return padroes.filter((p) => p.test(texto)).map((p) => p.source);
}
