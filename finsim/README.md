# FinSim: uma fintech operada por agentes de IA

> Este é o README técnico. Se você não é da área de tecnologia, comece pelo [guia passo a passo](../README.md) na raiz do repositório.

Demo da palestra **"IA na Prática: do Conceito aos Agentes Inteligentes com Claude e MCP"** (25/11/2026).

A FinSim é uma fintech **fictícia**. Todos os clientes, contas, valores e empresas foram inventados. Nada aqui se conecta a banco, órgão público ou sistema real.

## O que tem aqui

| Peça | Onde | Para que serve na palestra |
|---|---|---|
| Servidor MCP `finsim` | `src/mcp-server.js` | 21 ferramentas que o Claude usa para operar a fintech (consultar, validar, bloquear, decidir crédito...) |
| Agente orquestrador | `CLAUDE.md` | Coordena os setores e consolida o resultado |
| 6 subagentes, um por setor | `.claude/agents/` | Atendimento, Onboarding/KYC, Prevenção a Fraude, Compliance/PLD, Crédito, Tesouraria |
| 3 skills | `.claude/skills/` | `operacao-diaria` (roteiro), `politica-credito` (regras), `relatorio-executivo` (modelo) |
| Travas de segurança | `.claude/settings.json` | Leitura liberada; bloquear, liberar, crédito e COAF **pedem aprovação humana**; Bash e escrita de arquivos negados |
| Painel ao vivo | `npm run painel` | Mostra para a plateia o que cada agente está fazendo, em tempo real |
| Plano B sem IA | `npm run simular` | Mesmo roteiro, sem internet e sem modelo, com aprovação no terminal |
| Testes | `npm test` | 10 testes: regras de risco e servidor MCP de verdade |

### Setores e o que cada um pode fazer (acesso mínimo)

| Subagente | Ferramentas | Não pode |
|---|---|---|
| `atendimento` | listar/responder chamados, consultar cliente e transações, registrar alerta | bloquear, liberar, aprovar |
| `onboarding-kyc` | listar e verificar KYC, registrar decisão de KYC, alerta | mexer em transações |
| `prevencao-fraude` | listar e validar transações, consultar saldo/cliente, **bloquear**, alerta | comunicar COAF, decidir crédito |
| `compliance-pld` | transações, lista restritiva, **bloquear**, **comunicar COAF**, alerta | decidir crédito |
| `credito` | ler a política, listar e consultar propostas, **decidir crédito** | mexer em transações |
| `tesouraria` | posição do dia, conciliação, alerta | qualquer ação sensível |

### Casos plantados na base (o que os agentes devem encontrar)

| Caso | Onde | Setor |
|---|---|---|
| PIX em duplicidade (R$ 1.250, 2 minutos de diferença) + cliente reclamando | T-5003, chamado CH-901 | Fraude e Atendimento |
| PIX acima do limite diário | T-5006 | Fraude |
| PIX às 03h12, celular novo, beneficiário desconhecido | T-5007 | Fraude |
| 4 PIX logo abaixo de R$ 10 mil em 21 minutos (fracionamento) | T-5009 a T-5012 | Compliance/PLD |
| TED de R$ 120 mil de cliente PEP para empresa em lista restritiva | T-5013 | Compliance/PLD |
| **Prompt injection**: chamado manda o agente liberar a T-5007 e aprovar R$ 80 mil | CH-903 | Atendimento (segurança) |
| Cliente novo com nome divergente, selfie fraca e sem comprovante | C-08 | KYC |
| Crédito: um aprova, um reprova (score), um vai para o comitê (> R$ 50 mil) | P-301, P-302, P-303 | Crédito |
| Divergências com o banco liquidante | T-5004, T-5016 | Tesouraria |

## Como rodar no seu Mac

Pré-requisitos: Node.js 20 ou mais novo e o Claude Code instalado e logado.

```bash
cd finsim
npm install
npm test            # 10 testes devem passar
npm run reset       # recria a base com a data de hoje
```

Abra **dois terminais** na pasta:

1. **Terminal 1:** `npm run painel` e abra http://localhost:4000 (compartilhe esta janela no Teams).
2. **Terminal 2:** `claude`
   - Na primeira vez, o Claude Code pergunta se você confia na pasta e se aprova o servidor MCP `finsim`. Responda sim.
   - Digite `/mcp` para conferir que o `finsim` está conectado, e `/agents` para mostrar os 6 setores.

### Roteiro sugerido para a demo (cerca de 15 minutos)

1. **Consulta simples:** `Qual é o saldo da conta 1001 e quais foram as maiores saídas de hoje?`
2. **Operação completa:** `Rode a operação do dia.`
   O orquestrador carrega a skill `operacao-diaria` e dispara Atendimento, KYC e Fraude em paralelo. Depois vêm Compliance, Crédito e Tesouraria.
3. **Aprovação humana:** quando aparecer o pedido para bloquear, comunicar ao COAF ou decidir crédito, leia o motivo em voz alta e aprove (ou negue um, para mostrar que o agente respeita).
4. **Segurança:** mostre que o chamado CH-903 tentou mandar o agente liberar dinheiro e foi barrado.
5. **Auditoria:** `Mostre a auditoria das últimas 15 chamadas.` e aponte o painel.

Entre um ensaio e outro: `npm run reset` (ou o botão **Reiniciar base** no painel).

> A operação completa leva cerca de 4 minutos com o Claude. Se o tempo estiver curto, peça só um setor: `Use o subagente prevencao-fraude para validar as transações pendentes.`

### Plano B (sem internet ou sem Claude)

```bash
npm run simular
```

Roda o mesmo roteiro passo a passo, sem modelo de IA, pausando entre os setores e pedindo sua aprovação no terminal para cada ação sensível. O painel acompanha do mesmo jeito.

## Usar com outro cliente MCP

O servidor é MCP padrão (stdio). Qualquer cliente compatível pode usá-lo:

```json
{ "mcpServers": { "finsim": { "command": "node", "args": ["/caminho/para/finsim/src/mcp-server.js"] } } }
```
