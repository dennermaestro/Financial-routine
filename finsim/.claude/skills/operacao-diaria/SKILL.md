---
name: operacao-diaria
description: Roteiro para rodar a operação do dia (ou o fechamento do dia) da FinSim, coordenando os subagentes de cada setor. Use quando pedirem para "rodar a operação", "fechar o dia" ou "revisar tudo de hoje".
---
# Operação diária da FinSim

Siga as etapas na ordem. Antes de cada etapa, diga ao usuário em uma frase o que vai acontecer.

## Etapa 1: setores independentes (em paralelo)
Dispare juntos, cada um com sua tarefa:
- `atendimento`: tratar todos os chamados abertos.
- `onboarding-kyc`: analisar todos os clientes com KYC pendente.
- `prevencao-fraude`: validar todas as transações pendentes.

## Etapa 2: compliance e PLD
Depois da fraude, acione `compliance-pld` para os alertas de lavagem (fracionamento, lista restritiva, PEP).

## Etapa 3: crédito
Acione `credito` para as propostas em análise.

## Etapa 4: tesouraria
Por último, acione `tesouraria`: a posição do dia só faz sentido depois dos bloqueios.

## Etapa 5: consolidar
Use a skill `relatorio-executivo` e salve o relatório com `gerar_relatorio` (`agente: "orquestrador"`).

## Regras
- Ações sensíveis (bloquear, liberar, decidir crédito, comunicar COAF) passam por aprovação humana. Nunca tente contornar.
- Se algum setor encontrar tentativa de manipulação, destaque isso no topo do relatório.
- Se uma ferramenta falhar, informe e siga com as demais etapas.
