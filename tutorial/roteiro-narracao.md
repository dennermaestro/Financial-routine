# Mini tutorial FinSim: roteiro da narração

Vídeo: finsim-tutorial.mp4 (cerca de 2min50, 1920x1080, legendas embutidas). Voz sintética offline (Kokoro, voz pm_alex).

**0:00 · Abertura**
Olá! Neste mini tutorial, você vai ver a FinSim rodando do começo ao fim. A FinSim é uma fintech fictícia, operada por agentes de inteligência artificial com o Claude e o protocolo MCP. Todos os dados são inventados.

**0:14 · Como a FinSim é organizada**
A organização é igual à de uma fintech de verdade. Um agente orquestrador recebe o pedido e distribui o trabalho para seis subagentes, um por setor: atendimento, cadastro, fraude, prevenção à lavagem de dinheiro, crédito e tesouraria. Todos falam com o sistema por um servidor MCP, e cada setor só recebe as ferramentas de que precisa.

**0:35 · Passo 1: instalar e testar**
Para começar, entre na pasta do projeto e instale as dependências com npm install. Depois, npm test confirma que está tudo certo: são dez testes, e todos passam. Por fim, npm run reset cria a base fictícia com a data de hoje: oito clientes, dezesseis transações, três propostas de crédito e três chamados.

**0:54 · Passo 2: abrir o painel**
Em um terminal, rode npm run painel e abra o navegador no endereço localhost, porta quatro mil. É essa tela que você compartilha na reunião. Ela mostra as transações do dia e, em tempo real, cada ferramenta que os agentes chamam.

**1:09 · Passo 3: pedir ao agente**
No outro terminal, abra o Claude Code com o comando claude. Na primeira vez, confie na pasta e aprove o servidor finsim. Depois, é só pedir em português: rode a operação do dia. O orquestrador carrega a skill de rotina diária e dispara atendimento, cadastro e fraude ao mesmo tempo. Em seguida, vêm compliance, crédito e tesouraria.

**1:29 · Passo 4: o painel ao vivo**
Enquanto isso, o painel se movimenta. Das dezesseis transações, sete têm risco baixo e são aprovadas automaticamente pelo motor de regras. As outras nove ficam em análise. Entre elas, um PIX em duplicidade, um PIX de madrugada feito de um celular novo, quatro transferências fracionadas logo abaixo de dez mil reais e uma transferência para uma empresa em lista restritiva.

**1:52 · Passo 5: aprovação humana**
Agora, o ponto mais importante. Bloquear uma transação, decidir um crédito ou comunicar ao COAF são ações sensíveis, e o agente não faz isso sozinho. Ele explica o motivo e pede a sua aprovação. Se você negar, ele respeita e registra no relatório.

**2:07 · Passo 6: ataque barrado**
Um dos chamados esconde uma armadilha: um texto disfarçado de instrução do sistema, mandando liberar um pagamento e aprovar oitenta mil reais de crédito. O agente de atendimento trata esse texto como dado, e não como ordem, e abre um alerta de segurança.

**2:23 · Passo 7: relatório e auditoria**
No final, o orquestrador junta tudo num relatório executivo para o gestor. E toda chamada de ferramenta fica registrada na auditoria: quem fez, o quê e quando.

**2:34 · Colinha e plano B**
E se a internet cair durante a apresentação, use o plano B: npm run simular. Ele roda o mesmo roteiro, sem inteligência artificial, pedindo a aprovação no terminal. Para recomeçar do zero, rode npm run reset. Bom proveito!
